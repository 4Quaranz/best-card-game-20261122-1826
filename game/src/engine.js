/* Ember Pact — engine: state, rules and the Ashen Warden AI.
   A duel: each hero has 30 flame (HP). Mana starts at 1, grows +1 per turn
   to a max of 10, and refills each turn. Creatures attack once per turn;
   a creature played this turn cannot attack (summoning daze). Spells
   resolve at once. First flame to 0 loses. */
(function () {
  'use strict';

  function makeRng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function shuffledDeck(rng) {
    var ids = window.EMBER_DECKLIST.slice();
    for (var i = ids.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = ids[i]; ids[i] = ids[j]; ids[j] = t;
    }
    return ids.map(function (id) { return window.cardById(id); });
  }

  function newHero(deck) {
    return { hp: 30, maxHp: 30, mana: 0, maxMana: 0, deck: deck, hand: [], board: [] };
  }

  function drawCards(hero, n) {
    for (var i = 0; i < n; i++) {
      if (hero.hand.length >= 7) return;
      var card = hero.deck.shift();
      if (!card) return;
      hero.hand.push({ uid: Math.random().toString(36).slice(2, 8), def: card, canAttack: false });
    }
  }

  function newGame(seed) {
    var rng = makeRng(seed || 20261123);
    var game = {
      seed: seed || 20261123,
      round: 1,
      phase: 'title',
      turn: 'player',
      player: newHero(shuffledDeck(rng)),
      enemy: newHero(shuffledDeck(rng)),
      log: [],
      winner: null,
      selected: null,
    };
    drawCards(game.player, 4);
    drawCards(game.enemy, 4);
    startTurn(game, 'player');
    return game;
  }

  function say(game, text) {
    game.log.unshift(text);
    if (game.log.length > 6) game.log.length = 6;
  }

  function startTurn(game, who) {
    var hero = game[who];
    hero.maxMana = Math.min(10, hero.maxMana + 1);
    hero.mana = hero.maxMana;
    hero.board.forEach(function (c) { c.canAttack = true; });
    drawCards(hero, 1);
    game.turn = who;
    if (who === 'player') say(game, 'Your turn — mana ' + hero.mana + '/' + hero.maxMana + '.');
  }

  function endTurn(game) {
    if (game.phase !== 'play' || game.turn !== 'player' || game.winner) return false;
    game.selected = null;
    game.round += 1;
    startTurn(game, 'enemy');
    aiTakeTurn(game);
    if (!game.winner) startTurn(game, 'player');
    return true;
  }

  function playCard(game, handIndex) {
    var hero = game.player;
    var entry = hero.hand[handIndex];
    if (!entry || game.phase !== 'play' || game.turn !== 'player' || game.winner) return 'not-your-turn';
    if (entry.def.cost > hero.mana) return 'not-enough-mana';
    if (entry.def.kind === 'creature' && hero.board.length >= 6) return 'board-full';
    hero.mana -= entry.def.cost;
    hero.hand.splice(handIndex, 1);
    game.selected = null;
    if (entry.def.kind === 'creature') {
      var minion = { uid: entry.uid, def: entry.def, attack: entry.def.attack, health: entry.def.health, canAttack: false };
      hero.board.push(minion);
      say(game, 'You summon ' + entry.def.name + ' (' + minion.attack + '/' + minion.health + ').');
      return 'played';
    }
    return castSpell(game, 'player', entry.def, null);
  }

  function castSpell(game, who, def, target) {
    var me = game[who];
    var foe = game[who === 'player' ? 'enemy' : 'player'];
    if (def.effect === 'damage3') {
      if (!target) { game.pendingSpell = { who: who, def: def }; return 'need-target'; }
      damageTarget(game, target, 3);
      say(game, (who === 'player' ? 'You cast ' : 'Warden casts ') + def.name + ' for 3 damage.');
    } else if (def.effect === 'board4') {
      foe.board.slice().forEach(function (m) { damageMinion(game, foe, m, 4); });
      say(game, (who === 'player' ? 'You cast ' : 'Warden casts ') + def.name + ' — enemy board scorched.');
    } else if (def.effect === 'heal6') {
      me.hp = Math.min(me.maxHp, me.hp + 6);
      say(game, (who === 'player' ? 'You rekindle ' : 'Warden rekindles ') + '6 flame.');
    } else if (def.effect === 'draw2') {
      drawCards(me, 2);
      say(game, (who === 'player' ? 'You draw' : 'Warden draws') + ' 2 cards.');
    }
    game.pendingSpell = null;
    checkEnd(game);
    return 'played';
  }

  function damageMinion(game, owner, minion, amount) {
    minion.health -= amount;
    if (minion.health <= 0) {
      var i = owner.board.indexOf(minion);
      if (i >= 0) owner.board.splice(i, 1);
      say(game, minion.def.name + ' burns out.');
    }
  }

  function damageTarget(game, target, amount) {
    if (target === 'enemy-hero') { game.enemy.hp -= amount; say(game, 'Warden takes ' + amount + ' damage.'); }
    else if (target === 'player-hero') { game.player.hp -= amount; say(game, 'You take ' + amount + ' damage.'); }
    else if (target && target.owner) { damageMinion(game, game[target.owner], target.minion, amount); }
    checkEnd(game);
  }

  function attack(game, attackerUid, target) {
    if (game.phase !== 'play' || game.turn !== 'player' || game.winner) return 'not-your-turn';
    var attacker = game.player.board.find(function (m) { return m.uid === attackerUid; });
    if (!attacker) return 'no-attacker';
    if (!attacker.canAttack) return 'already-attacked';
    attacker.canAttack = false;
    if (target === 'enemy-hero') {
      game.enemy.hp -= attacker.attack;
      say(game, attacker.def.name + ' strikes the Warden for ' + attacker.attack + '.');
    } else if (target && target.owner === 'enemy') {
      var defender = target.minion;
      damageMinion(game, game.enemy, defender, attacker.attack);
      if (game.enemy.board.indexOf(defender) >= 0) damageMinion(game, game.player, attacker, defender.attack);
      say(game, attacker.def.name + ' trades blows with ' + defender.def.name + '.');
    }
    checkEnd(game);
    return 'attacked';
  }

  function checkEnd(game) {
    if (game.winner) return;
    if (game.enemy.hp <= 0) { game.enemy.hp = 0; game.winner = 'player'; game.phase = 'over'; }
    else if (game.player.hp <= 0) { game.player.hp = 0; game.winner = 'enemy'; game.phase = 'over'; }
  }

  /* The Ashen Warden: plays what it can afford, strongest first, then
     attacks with everything, hero first when the board is empty. */
  function aiTakeTurn(game) {
    var foe = game.enemy;
    var guard = 0;
    var played = true;
    while (played && guard++ < 12) {
      played = false;
      var best = -1, bestCost = -1;
      foe.hand.forEach(function (entry, i) {
        if (entry.def.cost <= foe.mana && entry.def.cost > bestCost) { best = i; bestCost = entry.def.cost; }
      });
      if (best < 0) break;
      var entry = foe.hand[best];
      if (entry.def.kind === 'creature' && foe.board.length >= 6) {
        // Board full: this card cannot be played, so do not spend it.
        foe.hand.splice(best, 1);
        foe.hand.push(entry);
        played = true; // try the next-best card on the next pass
        continue;
      }
      foe.mana -= entry.def.cost;
      foe.hand.splice(best, 1);
      if (entry.def.kind === 'creature' && foe.board.length < 6) {
        foe.board.push({ uid: entry.uid, def: entry.def, attack: entry.def.attack, health: entry.def.health, canAttack: false });
        say(game, 'Warden summons ' + entry.def.name + '.');
      } else if (entry.def.kind === 'spell') {
        if (entry.def.effect === 'damage3') damageTarget(game, 'player-hero', 3);
        else if (entry.def.effect === 'board4') game.player.board.slice().forEach(function (m) { damageMinion(game, game.player, m, 4); });
        else if (entry.def.effect === 'heal6') foe.hp = Math.min(foe.maxHp, foe.hp + 6);
        else if (entry.def.effect === 'draw2') drawCards(foe, 2);
        say(game, 'Warden casts ' + entry.def.name + '.');
      }
      played = true;
      checkEnd(game);
      if (game.winner) return;
    }
    foe.board.slice().forEach(function (m) {
      if (game.winner) return;
      if (game.player.board.length === 0) {
        game.player.hp -= m.attack;
        say(game, m.def.name + ' hits you for ' + m.attack + '.');
      } else {
        var target = game.player.board[0];
        damageMinion(game, game.player, target, m.attack);
        damageMinion(game, foe, m, target.attack);
        say(game, m.def.name + ' attacks ' + target.def.name + '.');
      }
      checkEnd(game);
    });
  }

  window.EmberEngine = {
    newGame: newGame, playCard: playCard, attack: attack, endTurn: endTurn,
    castSpell: castSpell, damageTarget: damageTarget, checkEnd: checkEnd,
    startTurn: startTurn, say: say, drawCards: drawCards,
  };
})();
