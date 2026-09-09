# v21 verification

The v20 source archive was the baseline. The coding curriculum and world-generation source remain byte-for-byte identical. Manual student saves, boss exclusions and the Python Lab / Story Mode entry remain intact.

## Checks performed

- Full `npm test`: all gameplay, Python runtime, lesson, manual-save, audio, joystick, mode and offline-cache checks.
- 268 roaming-question answer/continue paths and 32 normal world traversal simulations. Correct answers remain required; wrong answers allow retries; bosses cannot be interrupted.
- 144 executable Python traces match their correct choices. Independent AVL insertion and deletion reference checks cover LL, RR, LR, RL and the zero-child-balance deletion case. Coverage assertions include every requested topic category; see `QUESTION_COVERAGE.md`.
- All 81 story pages sampled at 201 timeline positions: fixed segment lengths, exact palm/prop agreement, single character identities and stable plot state during reading idle. Dedicated checks cover cloak ownership/contact, sleeve stitching, ribbon phases, dual-hand healing, the pebble greeting and both castle punches.
- Dense 1,001-sample sweeps of all 81 pages detect abrupt hand jumps outside explicitly faded cuts.
- Native Canvas review renders all 81 pages at 61 action positions, plus two reading-idle positions, with start/action/end/idle filmstrips and continuous scene exports. The interactive cell departure and four forge stages are also exported. Actual draw calls must match unique scene-graph actor IDs.
- Pause, resume, hidden tabs and closing the overlay cancel/resume the single animation timer correctly. Plot events never repeat during idle. No new storage writes are introduced.

## Scope and limits

Automated integration uses Node DOM/Canvas mocks and the shipped Python runtime. Pixel review uses native Canvas in this workspace. These checks detect rendering faults, pose discontinuities, duplicate actors, wrong prop timing and functional regressions; they do not certify every browser, phone or thermal condition. The native render timings are local timings, not device FPS.

Story animation uses 20 FPS during an action and 8 FPS for subtle reading idle, with one timer and reused art caches. Reduced-motion mode starts with a still. This intentionally replaces the previous fully frozen end frame. Stop/Pause and hidden tabs eliminate the reading timer.

## Reproduce

Run `python scripts/build.py`, then `npm test`. For pixel review, install the optional development dependency `@napi-rs/canvas` and run `node tests/render_animation_review.cjs /path/to/review`. The exporter reuses canvases across frames to keep native pixel memory bounded; it is not downloaded by game clients.
