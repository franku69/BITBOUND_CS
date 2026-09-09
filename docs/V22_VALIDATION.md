# v22 validation and review

This release uses the uploaded v21 project as its base. All 48 shrine/terminal curriculum entries are byte-for-byte unchanged. All 13 story scene IDs and their 81 page positions are preserved for manually saved games. The 268 roaming question IDs remain stable; `e05-12` now asks which structure reverses a route, replacing a memoization question that preceded its prerequisites.

## Automated verification

The complete `npm test` suite passed. The recorded output is `V22_TEST_LOG.txt`.

| Area | Verified scope |
|---|---|
| Ordered questions | All 268 correct-answer/continue paths; all eight ordered review cycles; wrong answers and reopening cannot skip prerequisites; scattered legacy completions fill the first gap. Each world has four stages and context labels. |
| Question accuracy | 144 trace snippets executed in isolated Python; independently computed four AVL insertion rotations and a deletion rebalance boundary. Coverage checks include every requested fundamental, container, sorting, stack/queue, linked-list, search, tree and AVL topic. |
| Encounter integration | 32 simulated world traversals, approach/contact/melee/projectile triggers, required completion, keyboard containment, boss/overlay exclusions and fallback if vignette rendering fails. |
| Python | All 48 reference solutions and 180 test cases passed in the shipped Pyodide runtime; helper imports/reimports, input, trace and Python errors checked. Worker tests cover streaming, Stop, infinite-loop termination and restarting. |
| Story and combat | Rescue, betrayal, prison forging, paladin/barrier/fusion order, manual saves/resume and 48/48 completion. Four allies' real damage, healing, attack release timing and betrayal cutoff. |
| Story continuity | All 81 pages sampled at 1,001 positions (81,081 total); no unmasked hand jumps over eight pixels per sample. Physical-interaction tests add 16,281 full-scene checks for grip/prop ownership, cloak/stitch/ribbon phases, fixed limb lengths and idle behavior. |
| Prison and fusion | 6,006 interactive prison samples; cuffs and door-crossing order, BYTE absence, inspect/heat/hammer/quench phases; both palms reach the crown before absorption; BYTE renders in front of Veyr and disappears before the fused reveal. |
| Runtime lifecycle | Pause/Resume, hidden-page suspension, one actor per character, bounded caches, audio cleanup, mobile joystick cancellation, fresh-session isolation and no automatic student saves. |
| Offline | Root and repository-subpath routing, offline WASM requests, exact hashes, partial-download retry and reuse of unchanged pinned assets. |

These are meaningful program and game-harness tests, not a guarantee that no undiscovered bug exists.

## Native visual review

The actual scene renderer produced all 81 six-frame story filmstrips, 4,941 sampled story frames, 837 creature-battle frames and an action atlas. Another 8,070 sequence frames cover every page, the interactive cell/scroll/four forge actions, and an example required-answer battle. All pages were inspected in overview sheets; the reported cloak, sewing, ribbon, prison, escape, duel and fusion sequences received focused inspection. The final review verified BYTE's departure from the cell corridor and visible crown contact before dissolution.

The separately supplied `BITBOUND_v22_Animation_Review.mp4` is a silent, condensed 20 FPS native-Canvas review, 6 minutes 43.5 seconds at 1280 × 660. Most shots are shortened to 4.5 seconds to make the review manageable; the actual game uses its authored durations and player-paced reading. Gameplay audio and mobile/browser layout are not represented by this preview. Source frame timing is not a measurement of game FPS.

Native rendering on this machine: median **1.30 ms**, 95th percentile **2.31 ms**, largest sampled draw **89.99 ms**. These timings include local scheduling/allocation variability and do not predict phone temperature or browser compositing. Full values and the reviewed game bundle SHA-256 are in `V22_RENDER_REPORT.json`.

## Release integrity

The uploaded v21 archive omitted `runtime/python_stdlib.zip`, which caused the actual Pyodide startup test to fail. v22 restores the matching pinned archive (2,360,737 bytes); its associated WASM, loader and lock files were checked against the same runtime version. This is now part of the 48-asset offline pack, approximately 16.1 MB uncompressed.

`scripts/package_release.py` writes a deterministic ZIP and checks every offline file's size and SHA-256 directly inside that ZIP. It explicitly preserves nested ZIP files. The delivered archive is also extracted into a clean temporary directory and the shipped Python test run from that extracted copy. The teacher key is generated separately from the final curriculum and is not included in the student offline pack.

## Limits and reproduction

No physical phone thermal measurements, real-device frame-rate claims or browser visual automation are included. Native Canvas and the DOM harness verify logic, geometry and raster output; they cannot prove every browser/device combination. Offline play requires the first cache download to finish and the browser to retain the site data. Progress still saves only through an explicit Save file download.

Run `python scripts/build.py`, then `npm test`. Optional visual QA requires `@napi-rs/canvas`: run `node tests/render_animation_review.cjs /absolute/review-directory`. Use `node tests/inspect_cinematic_frames.cjs /absolute/focused-review-directory` for close prison/fusion sheets. These are development utilities; students need no npm packages. Build the separate teacher key with `python scripts/build_answer_key.py /absolute/answer-key.html`, then package with `python scripts/package_release.py /absolute/game.zip`.
