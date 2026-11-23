/* Ember Pact — main: input, turn flow and deterministic screenshot poses.
   Mouse: click a hand card to select it (spells with a target then ask for
   one), click your board creature to arm an attack, click an enemy creature
   or the Warden to strike. Keyboard: 1–7 play hand cards, Space ends the
   turn, Enter starts or restarts. ?shot=start|play|win|loss renders a fixed
   pose of the game's own code for screenshots. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var game = null;

  function boot(seed) {
    game = window.EmberEngine.newGame(seed);
    game.phase = 'title';
    window.EmberRender.render(game);
  }

  function beginDuel() {
    game.phase = 'play';
    window.EmberEngine.say(game, 'The duel begins — your flame against the Warden’s.');
    window.EmberRender.render(game);
  }

  function targetFromEvent(event) {
    var node = event.target.closest('[data-uid], .hero-box');
    if (!node) return null;
    if (node.classList.contains('hero-box')) {
      return node.classList.contains('enemy') ? 'enemy-hero' : 'player-hero';
    }
    var owner = node.dataset.owner;
    if (owner === 'enemy') {
      var minion = game.enemy.board.find(function (m) { return m.uid === node.dataset.uid; });
      return minion ? { owner: 'enemy', minion: minion } : null;
    }
    return null;
  }

  function onTableClick(event) {
    if (!game || game.phase !== 'play' || game.turn !== 'player' || game.winner) return;

    var handCard = event.target.closest('#player-hand .card');
    if (handCard) {
      var idx = Number(handCard.dataset.handIndex);
      var entry = game.player.hand[idx];
      if (!entry) return;
      if (entry.def.kind === 'spell' && entry.def.effect === 'damage3') {
        if (entry.def.cost > game.player.mana) { window.EmberEngine.say(game, 'Not enough mana for ' + entry.def.name + '.'); }
        else { game.selected = { type: 'spell', handIndex: idx }; window.EmberEngine.say(game, 'Firebolt armed — click a target.'); }
      } else {
        var result = window.EmberEngine.playCard(game, idx);
        if (result === 'not-enough-mana') window.EmberEngine.say(game, 'Not enough mana for ' + entry.def.name + '.');
        if (result === 'board-full') window.EmberEngine.say(game, 'Your board is full.');
      }
      window.EmberRender.render(game);
      return;
    }

    if (game.pendingSpell) {
      var target = targetFromEvent(event);
      if (target) {
        var spell = game.pendingSpell;
        // Mana was already spent when the spell left the hand; just resolve it.
        window.EmberEngine.castSpell(game, spell.who, spell.def, target);
      }
      window.EmberRender.render(game);
      return;
    }

    if (game.selected && game.selected.type === 'spell') {
      var spellTarget = targetFromEvent(event);
      if (spellTarget) {
        var entry2 = game.player.hand[game.selected.handIndex];
        var cost = entry2.def.cost;
        var handIdx = game.player.hand.indexOf(entry2);
        game.selected = null;
        game.player.mana -= cost;
        if (handIdx >= 0) game.player.hand.splice(handIdx, 1);
        window.EmberEngine.castSpell(game, 'player', entry2.def, spellTarget);
      } else {
        game.selected = null;
      }
      window.EmberRender.render(game);
      return;
    }

    var ownMinion = event.target.closest('#player-board .card');
    if (ownMinion) {
      var attacker = game.player.board.find(function (m) { return m.uid === ownMinion.dataset.uid; });
      if (attacker && attacker.canAttack) {
        game.selected = 'attack';
        game.attackerUid = attacker.uid;
        window.EmberEngine.say(game, attacker.def.name + ' ready — click an enemy to attack.');
      } else if (attacker) {
        window.EmberEngine.say(game, attacker.def.name + ' already attacked or is dazed.');
      }
      window.EmberRender.render(game);
      return;
    }

    if (game.selected === 'attack') {
      var enemyTarget = targetFromEvent(event);
      if (enemyTarget) {
        var outcome = window.EmberEngine.attack(game, game.attackerUid, enemyTarget);
        if (outcome === 'already-attacked') window.EmberEngine.say(game, 'That creature already attacked.');
      }
      game.selected = null;
      game.attackerUid = null;
      window.EmberRender.render(game);
    }
  }

  function onKey(event) {
    if (!game) return;
    if (game.phase === 'title' && (event.key === 'Enter' || event.key === ' ')) { beginDuel(); return; }
    if (game.phase === 'over' && event.key === 'Enter') { boot(game.seed + 1); beginDuel(); return; }
    if (game.phase !== 'play' || game.turn !== 'player') return;
    if (event.key >= '1' && event.key <= '7') {
      var idx = Number(event.key) - 1;
      if (game.player.hand[idx]) { window.EmberEngine.playCard(game, idx); window.EmberRender.render(game); }
    } else if (event.key === ' ') {
      event.preventDefault();
      if (window.EmberEngine.endTurn(game)) window.EmberRender.render(game);
    }
  }

  /* Fixed poses for screenshots: the same engine and renderer, driven to a
     known state, so each shot is a real render of the game's own code. */
  function pose(shot) {
    if (shot === 'start') { boot(7); return; }
    boot(7);
    game.phase = 'play';
    var E = window.EmberEngine;
    if (shot === 'play') {
      game.round = 4;
      game.player.maxMana = 5; game.player.mana = 3;
      game.enemy.maxMana = 5; game.enemy.mana = 1;
      game.player.hp = 24; game.enemy.hp = 19;
      game.player.board = [
        { uid: 'p1', def: window.cardById('warden'), attack: 3, health: 4, canAttack: true },
        { uid: 'p2', def: window.cardById('wolf'), attack: 2, health: 2, canAttack: true },
      ];
      game.enemy.board = [
        { uid: 'e1', def: window.cardById('golem'), attack: 3, health: 5, canAttack: false },
        { uid: 'e2', def: window.cardById('imp'), attack: 2, health: 1, canAttack: false },
      ];
      game.player.hand = ['drake', 'bolt', 'fox', 'rekindle', 'sprite'].map(function (id, i) {
        return { uid: 'h' + i, def: window.cardById(id), canAttack: false };
      });
      game.enemy.hand = [{}, {}, {}];
      game.log = ['Warden summons Coal Golem.', 'You summon Flame Warden (3/4).', 'Your turn — mana 5/5.'];
    } else if (shot === 'win') {
      game.phase = 'over'; game.winner = 'player';
      game.enemy.hp = 0; game.player.hp = 11; game.round = 9;
      game.player.board = [{ uid: 'p1', def: window.cardById('drake'), attack: 5, health: 3, canAttack: false }];
      game.enemy.board = [];
      game.log = ['Pyre Drake strikes the Warden for 5.', 'Warden takes 5 damage.'];
    } else if (shot === 'loss') {
      game.phase = 'over'; game.winner = 'enemy';
      game.player.hp = 0; game.enemy.hp = 8; game.round = 8;
      game.enemy.board = [{ uid: 'e1', def: window.cardById('giant'), attack: 7, health: 6, canAttack: false }];
      game.player.board = [];
      game.log = ['Bonfire Giant hits you for 7.', 'You take 7 damage.'];
    }
    E.checkEnd(game);
    if (shot === 'play') game.phase = 'play';
    window.EmberRender.render(game);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var shot = params.get('shot');
    if (shot) { pose(shot); }
    else { boot(20261123); }
    $('start-btn').addEventListener('click', beginDuel);
    $('again-btn').addEventListener('click', function () { boot(game.seed + 1); beginDuel(); });
    $('end-turn').addEventListener('click', function () {
      if (window.EmberEngine.endTurn(game)) window.EmberRender.render(game);
    });
    document.addEventListener('click', onTableClick);
    document.addEventListener('keydown', onKey);
  });

  window.EmberMain = { boot: boot, pose: pose, getGame: function () { return game; } };
})();
