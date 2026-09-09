# v18 animation repair and validation

This release addresses the missing action poses, duplicate character draws, compressed kneeling sprites, stretched handshake arm, overlapping guild entrance and inconsistent prison/escape staging reported in v17.

## What changed

- One shared articulated rig for the player, BYTE and the four adventurers, including the final Paladin. Walking/running, jumping/falling, landing, dashing, attacking/casting and dialogue gestures have distinct poses. Kneeling bends legs and preserves body proportions.
- One scene-graph actor per character. Updating a pose replaces its previous entry. The renderer paints each actor once; player dash effects use speed lines instead of extra player sprites.
- Approach/settle transitions, a spaced hall entrance, a proper seated invitation and hand-to-hand handshake, and explicit props for the memories, poisoning and forging.
- A closed prison room with foreground bars and bound wrists. BYTE visits from the corridor, leaves before the player reads/forges, is absent from the lock-opening page, and returns with a falling snack on the next page. His chatter stops when his departure animation ends.
- The guild's confrontation and subsequent fight are separate beats. Deaths and BYTE's fusion do not replay during the preceding conversation. The ending's final blow shows its target dissolving before the next page absorbs the power.
- Companions use actual velocity/gravity and jump over raised terrain instead of snapping vertically to it. Their support actions change their pose. Veyr has separately moving wings and arms.
- Fixed-size texture/body caches, unchanged finite cinematic scheduling, and no new runtime assets or student autosaves.

## Automated checks

`npm test` includes the existing complete campaign, 48 Python challenges and shipped Python runtime, tutorial buttons, manual saves/imports, Lab mode, touch input, sound cleanup, offline pack integrity, update-cache behavior and syntax/reference validation.

The new `tests/test_animation_continuity.cjs` checks:

- 81 authored pages at 101 timeline positions each: **8,181 scene samples**.
- **2,222 articulated poses**: fixed arm/leg lengths and a planted foot for grounded actions.
- Unique actor IDs and exactly one rendered entry per visible actor.
- Guild entrance spacing throughout movement, not just at its final positions.
- Cast secrecy, prison-side placement, BYTE's absence during forging/escape and delayed fusion.
- Essential movement/combat poses under reduced motion, visible companion ledge jumps and bounded caches.
- No automatic storage writes introduced by animation.

## Raster review

`tests/render_animation_review.cjs` runs the production art modules with native Canvas. It renders **4,941 frames across all 81 story pages**, instruments actual character draw calls, and exports a four-frame contact sheet for every page. It also exports **720 consecutive frames** for twelve key sequences: invitation, handshake, gate rescue, poisoning, captivity, BYTE's departure, forging, escape, BYTE's return, guild entrance, impact and castle leap. Action sheets include the player, all four adventurers and BYTE.

The contact sheets and sequence frames were reviewed for duplicate bodies, limb/prop attachment, grounded feet, cast timing, entrance overlaps and foreground prison bars. `docs/animation-review-v18.mp4` contains those sequences as a 20 FPS review reel. It is a QA preview, not an additional download required by the game or offline pack. `docs/animation-raster-v18.json` records the local render timings.

Native Canvas validation exercises actual raster drawing, but is not a physical-phone or browser/GPU test. Timing numbers measure this machine only; they do not establish a universal FPS, temperature or zero-bug guarantee. Existing responsive layout and touch controls are preserved, and the touch lifecycle regressions pass.

## Reproduce

```sh
python scripts/build.py
npm test
```

Optional raster review, with `@napi-rs/canvas` installed in a development environment:

```sh
node tests/render_animation_review.cjs /tmp/bitbound-review
```

The normal game build needs only Python's standard library. The optional raster dependency is never loaded by students' browsers.

## Run this release

Extract the ZIP. On Windows, run `START_WINDOWS.bat`; use the local URL it prints. For students, upload the folder contents to the existing GitHub Pages repository, preserving its directory structure. Let the first online visit finish preparing the offline pack. Existing manual save files can be imported explicitly; new visits still start fresh.
