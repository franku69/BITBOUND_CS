# v17 verification

The complete `npm test` command passed. This includes:

- All 48 reference solutions and 180 cases in native Python and the shipped WebAssembly interpreter.
- The eight-world route, all lesson gates, rescue, betrayal, interactive dagger forging, paladin, BFS barrier, BYTE fusion and 48/48 completion.
- Manual save/import, fresh visits, isolated Lab/Story workspaces, stop/run behavior and streaming output.
- Touch input, movement timing, paused/hidden behavior, audio cleanup and bounded spawning/projectiles.
- Offline manifests, root/subpath navigation, WASM availability, interrupted-download recovery, update hashes and all HTML asset references.
- New pet fetch/heal/interception/overclock effects, their cooldowns and pause behavior; enemy aim commitment and terrain sight checks; private story casts and bounded art caches.

Native Canvas rendered all 81 story pages at 0%, 30%, 60% and 100% animation progress. Every page produced changing raster output. Character, pet, mob, weapon, skill and regional contact sheets were visually reviewed. A pose dispatch mismatch and a leftover photo preload found during review were corrected before packaging.

`game-benchmark-v17.json` records a 600-frame-per-world JavaScript benchmark with a mocked Canvas. Scrolling averaged approximately 124 drawing commands per frame with cached terrain versus 2,977 without that cache. This measures command scheduling and JavaScript work, not browser GPU performance or temperature.

Physical phones, tablets and PCs were not available for device or thermal measurements. The game retains responsive layouts, touch controls, reduced-motion mode, adaptive effects, fixed-step physics and pause-on-hidden behavior; performance still depends on the device and browser.

Source changes are in the ordered `adventure/systems/` modules, the creature atlas, narrative data and documentation. Rebuild with `python scripts/build.py`; edit those sources rather than the generated bundles.
