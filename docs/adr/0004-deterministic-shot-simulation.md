# ADR 0004 — A deterministic simulation for preview and flight

**Status:** accepted

## Context

In the reference design, a card is held at the bottom left of the court and a dotted arc predicts its path into the hoop; once released, the card follows that arc and the dots it passed disappear. The arc is therefore an exact prediction, not a hint. Three mechanics fit a "take the shot" gesture: a slingshot (pull back, release), a flick (release velocity) and an aim-assisted throw. The slingshot was chosen: it is deterministic, works the same with a mouse and a finger, and lets the preview be exact. Missing must stay possible.

## Decision

The physics lives in `src/game/`, free of DOM:

- A **fixed step** of 1/120 s. The preview (`previewPath`) and the flight run the same `step()` from the same initial body, so the dots are where the card will be. The flight advances with an accumulator on `requestAnimationFrame`.
- **Rim units**: lengths are in `u`, the rim width in pixels, measured from the rendered elements at each shot (`courtFromRects`). The layout is pure CSS; the game only reads rectangles, and behaves the same at any size.
- **Constants calibrated on the reference**: gravity 21 u/s², dots 1/15 s apart (the design's dots advance ≈0.116 u and lose ≈0.095 u of rise per dot). The launch velocity is the opposite of the pull times a power that `launchPower` sizes per layout: at least 12/s, and enough for a full pull to reach the hoop from the rest spot with 40% to spare.
- **Pseudo depth**: seen from the front, a rising card is still in front of the hoop. The board (the orange square) and the ends of the rim only stop a card around the top of its arc or when it falls. The card shrinks to 0.7 of its size by the time it reaches the hoop, and spins.
- **Events**: entering the square takes most of the speed away, once (the card drops along the board, "aim for the square"); the ends of the rim are round obstacles; going down through the rim between its ends scores; the floor and walls bounce. The preview stops at the first event, drawing a last dot there.
- **Scripted endings**: a score continues as an animation, not physics — through the net (which swings), then the "+1", the counter, the list row and the upload, in the order of the design's frames; a miss bounces, then springs back to the court.
- **Assisted shots** (keyboard, `shoot()`): `solveAssistedShot` computes the velocity of an arc that peaks above the square and comes down on the rim's center.
- **Reduced motion**: a shot goes in without flying.

## Consequences

- The physics is unit tested in Node: the preview matches the flight dot for dot, assisted shots score from anywhere on the court, rising cards pass in front of the hoop.
- The rest spot (`.spot`) and the hoop proportions are CSS: moving them moves the game, which re-measures before every shot.
- One shot at a time; dunks (files dropped on the dropzone) are scripted and may overlap with it.
