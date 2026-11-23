/* Ember Pact — card catalogue. Every card is an original ember-flame design.
   Types: creature (stays on the board, attacks) and spell (one-shot effect).
   Fields: id, name, kind, cost, attack, health, text, art (glyph shown on the card). */
window.EMBER_CARDS = [
  { id: 'sprite',  name: 'Ember Sprite',  kind: 'creature', cost: 1, attack: 1, health: 1, text: 'A spark that refuses to die.', art: '✦' },
  { id: 'imp',     name: 'Ash Imp',       kind: 'creature', cost: 1, attack: 2, health: 1, text: 'It giggles as it burns.', art: '👺' },
  { id: 'fox',     name: 'Spark Fox',     kind: 'creature', cost: 2, attack: 3, health: 1, text: 'Fast as a struck match.', art: '🦊' },
  { id: 'wolf',    name: 'Cinder Wolf',   kind: 'creature', cost: 2, attack: 2, health: 2, text: 'Its howl smells of smoke.', art: '🐺' },
  { id: 'warden',  name: 'Flame Warden',  kind: 'creature', cost: 3, attack: 3, health: 4, text: 'Guards the last hearth.', art: '🛡️' },
  { id: 'golem',   name: 'Coal Golem',    kind: 'creature', cost: 4, attack: 3, health: 6, text: 'Slow, heavy, still burning.', art: '🪨' },
  { id: 'drake',   name: 'Pyre Drake',    kind: 'creature', cost: 5, attack: 5, health: 5, text: 'Its wings are funeral fires.', art: '🐉' },
  { id: 'giant',   name: 'Bonfire Giant', kind: 'creature', cost: 6, attack: 7, health: 7, text: 'A walking festival of flame.', art: '🔥' },
  { id: 'bolt',    name: 'Firebolt',      kind: 'spell', cost: 2, attack: 0, health: 0, text: 'Deal 3 damage to any target.', art: '⚡', effect: 'damage3' },
  { id: 'blast',   name: 'Cinder Blast',  kind: 'spell', cost: 4, attack: 0, health: 0, text: 'Deal 4 damage to all enemy creatures.', art: '💥', effect: 'board4' },
  { id: 'rekindle',name: 'Rekindle',      kind: 'spell', cost: 2, attack: 0, health: 0, text: 'Restore 6 flame to yourself.', art: '❤️', effect: 'heal6' },
  { id: 'fan',     name: 'Fan the Flames',kind: 'spell', cost: 1, attack: 0, health: 0, text: 'Draw 2 cards.', art: '🃏', effect: 'draw2' },
];

window.EMBER_DECKLIST = [
  'sprite', 'sprite', 'imp', 'imp', 'fox', 'fox', 'wolf', 'wolf',
  'warden', 'warden', 'golem', 'golem', 'drake', 'giant',
  'bolt', 'bolt', 'bolt', 'blast', 'rekindle', 'rekindle', 'fan', 'fan',
];

window.cardById = function cardById(id) {
  return window.EMBER_CARDS.find(function (c) { return c.id === id; });
};

window.EMBER_CARD_COUNT = window.EMBER_CARDS.length;
window.EMBER_DECK_SIZE = window.EMBER_DECKLIST.length;
