/* Ember Pact — render: draws the table from engine state into the DOM.
   Cards are real DOM elements (readable values, suits, costs at a glance),
   so screenshots show the game itself, not a canvas blur. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function manaPips(container, mana, maxMana) {
    container.innerHTML = '';
    for (var i = 0; i < 10; i++) {
      var pip = el('span', 'mana-pip' + (i < mana ? ' full' : '') + (i < maxMana ? '' : ' locked'), '◆');
      container.appendChild(pip);
    }
    container.appendChild(el('span', 'mana-text', mana + '/' + maxMana + ' mana'));
  }

  function cardNode(entry, opts) {
    opts = opts || {};
    var def = entry.def;
    var node = el('div', 'card' + (def.kind === 'spell' ? ' spell' : ' creature') +
      (opts.selected ? ' selected' : '') +
      (opts.playable === false ? ' dim' : '') +
      (opts.attackable ? ' attackable' : ''));
    node.dataset.uid = entry.uid;
    if (opts.handIndex !== undefined) {
      node.dataset.handIndex = String(opts.handIndex);
      node.appendChild(el('div', 'card-index', String(opts.handIndex + 1)));
    }
    node.appendChild(el('div', 'card-cost', String(def.cost)));
    node.appendChild(el('div', 'card-art', def.art));
    node.appendChild(el('div', 'card-name', def.name));
    node.appendChild(el('div', 'card-text', def.text));
    if (def.kind === 'creature') {
      var atk = entry.attack !== undefined ? entry.attack : def.attack;
      var hp = entry.health !== undefined ? entry.health : def.health;
      node.appendChild(el('div', 'card-stats', atk + ' ⚔  /  ' + hp + ' ♥'));
      if (opts.daze) node.appendChild(el('div', 'card-daze', '💤'));
    }
    return node;
  }

  function minionNode(minion, owner, opts) {
    var node = cardNode({ uid: minion.uid, def: minion.def, attack: minion.attack, health: minion.health, canAttack: minion.canAttack }, opts);
    node.dataset.owner = owner;
    return node;
  }

  function render(game) {
    $('round-label').textContent = 'Round ' + game.round + '  •  ' +
      (game.phase === 'over' ? (game.winner === 'player' ? 'You win!' : 'Warden wins') :
       game.turn === 'player' ? 'Your turn' : 'Warden thinking…');
    $('turn-banner').textContent = game.phase === 'over' ? 'EMBER PACT — DUEL OVER' :
      game.turn === 'player' ? 'YOUR TURN — play a card, then attack' : 'WARDEN’S TURN…';

    $('enemy-hp-fill').style.width = (game.enemy.hp / game.enemy.maxHp * 100) + '%';
    $('enemy-hp-text').textContent = '🔥 ' + game.enemy.hp + ' / ' + game.enemy.maxHp;
    $('player-hp-fill').style.width = (game.player.hp / game.player.maxHp * 100) + '%';
    $('player-hp-text').textContent = '🔥 ' + game.player.hp + ' / ' + game.player.maxHp;
    manaPips($('enemy-mana'), game.enemy.mana, game.enemy.maxMana);
    manaPips($('player-mana'), game.player.mana, game.player.maxMana);

    var eh = $('enemy-hand');
    eh.innerHTML = '';
    game.enemy.hand.forEach(function () { eh.appendChild(el('div', 'card-back', '🂠')); });

    var eb = $('enemy-board');
    eb.innerHTML = '';
    game.enemy.board.forEach(function (m) {
      eb.appendChild(minionNode(m, 'enemy', { attackable: game.selected === 'attack', daze: m.canAttack === false }));
    });

    var pb = $('player-board');
    pb.innerHTML = '';
    game.player.board.forEach(function (m) {
      pb.appendChild(minionNode(m, 'player', { attackable: false, daze: m.canAttack === false }));
    });

    var ph = $('player-hand');
    ph.innerHTML = '';
    game.player.hand.forEach(function (entry, i) {
      var selected = game.selected && game.selected.type === 'card' && game.selected.handIndex === i;
      ph.appendChild(cardNode(entry, {
        handIndex: i, selected: selected,
        playable: game.turn === 'player' && entry.def.cost <= game.player.mana,
      }));
    });

    var log = $('log');
    log.innerHTML = '';
    game.log.forEach(function (line) { log.appendChild(el('div', 'log-line', line)); });

    $('end-turn').disabled = game.phase !== 'play' || game.turn !== 'player' || !!game.winner;
    $('title-screen').classList.toggle('hidden', game.phase !== 'title');
    var over = game.phase === 'over';
    $('end-screen').classList.toggle('hidden', !over);
    if (over) {
      $('end-title').textContent = game.winner === 'player' ? 'VICTORY' : 'DEFEAT';
      $('end-title').className = game.winner === 'player' ? 'win' : 'loss';
      $('end-sub').textContent = game.winner === 'player'
        ? 'The flame endures — the Warden burns out.'
        : 'The flame dies — the Warden takes the last ember.';
      $('end-detail').textContent = 'Final flame — You ' + game.player.hp + ' : ' + game.enemy.hp +
        ' Warden.  Rounds played: ' + game.round + '.';
    }
  }

  window.EmberRender = { render: render };
})();
