# Ember Pact — Duel of the Last Flame

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/4Quaranz/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/4Quaranz/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Ember Pact is an original card battler that runs in a desktop browser from static files, with no network request. You are the Keeper of Embers, duelling the Ashen Warden for the last flame: play ember creatures, cast fire spells, and burn the Warden's 30 flame to zero before yours goes out.

## The duel

- **30 flame each** — first hero to 0 loses.
- **Mana grows** — 1 on turn one, +1 each turn to 10, refilled every turn.
- **12 original cards** — 8 ember creatures (Ember Sprite, Ash Imp, Spark Fox, Cinder Wolf, Flame Warden, Coal Golem, Pyre Drake, Bonfire Giant) and 4 fire spells (Firebolt, Cinder Blast, Rekindle, Fan the Flames).
- **Creatures fight** — a creature played this turn is dazed and cannot attack until next turn; attackers trade damage with blockers.
- **The Warden thinks** — a simple AI that plays its strongest affordable cards and attacks with everything it has.

## Controls

- **Click a hand card** — play it (spells that need a target ask for one next).
- **Click your creature, then an enemy** — attack (or click the Warden to go face).
- **End Turn button / Space** — pass to the Warden.
- **1–7** — play hand cards, **Enter** — start / restart.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` directly from the files — no build step, no network. The game is fully offline: every script, style and glyph lives under `game/`.

## Screenshots

`?shot=start` title screen, `?shot=play` mid-duel table, `?shot=win` victory, `?shot=loss` defeat — each a real render of the game's own code.

## Entry

Built for [make.fun — Make the best card game](https://make.fun/bounty/best-card-game-20261122-1826). `main.ts` hands the game in via `vendor/makefun-game.ts`.
