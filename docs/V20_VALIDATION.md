# v20 — required encounters and story animation repair

## Reproduced failure

A v19 full-loop walking/attacking run passed most of a world without opening a question. The original cooldown only advanced outside sanctuary areas, warning encounters could be canceled by movement, and carriers could die to weapon damage. The optional retreat button also contradicted the requested required-answer encounter. Global game shortcuts continued to run behind the dialog.

## Changed behavior

A sealed creature now opens a battle on close approach or weapon contact. Carriers are spread along the route, and a travel-based fallback allows an eligible nearby creature to reveal its rune. A correct answer is required before returning; explanations, clues and unlimited retries cost no health. The world stops immediately. Boss combat, all final boss phases, the final arena, sanctuary areas, death, hidden tabs, story scenes and other overlays block launch.

The answer controls become functional before any illustration runs. An unavailable graphics context hides the picture and preserves the working question. Escape cannot bypass completion or open Help. Native Space/Enter and Tab remain available, and A/B/C select answers. The viewport-sized dialog scrolls on phones and short landscape screens.

The 112 authored encounter questions and all 48 original Python tasks are retained. Shrine placement, terminal placement and curriculum contents are unchanged. Manual save files retain their existing format and student isolation; offline app caching stays separate from saving work.

## Animation work

The shared rig now includes 29 actions, stance/swing walking, fixed prior-pose transitions, offering, drinking, reading, listening, speaking, crawling and a grounded punch. All story scenes pass through a separate pure acting/framing module. Props follow actual palms, including gift transfers, scrolls, the hammer, key and stolen items. The pan and dagger grip alignment is corrected. Scene lighting is cached, with a fixed twelve-mote limit.

Prison bars remain in the foreground, BYTE stays away during the unattended forge/escape, and the recalled gate has crawling companions underneath the player's raised hands. The final company confrontation keeps ordered impacts, individual collapses and persistent dropped equipment. Castle fractures begin at the punch contact point; audio uses the same normalized timeline, with no independent delayed crash timer.

## Verification

- `test_v19_encounters.cjs`: all 112 real answer/continue callbacks, wrong-answer retries, required completion, world decks, boss/overlay guards and manual progress.
- `test_v20_encounters.cjs`: 32 full-loop traversals across eight worlds using movement and attacks, immediate pause/resume, carrier protection from melee/projectiles/ally collateral, keyboard containment, travel fallback, every boss phase and recovery from an intentionally unavailable graphics context.
- `test_animation_continuity.cjs`: 81 pages × 101 timeline samples, 2,929 fixed-limb poses, unique actor IDs, formation spacing, prison/escape cast rules and bounded caches.
- `test_v20_animation.cjs`: continuous gift/drink transitions, hammer ownership, gate crawling, fist-to-ground contact and key retrieval.
- Existing gates cover the complete campaign, party combat, 48 reference Python solutions in native and shipped WebAssembly Python, touch input, manual-file persistence, modes, worker behavior, offline loading, cache updates, HTML references and JavaScript syntax.

The complete final log is `v20-test-results.txt`. An expected graphics-failure case is injected by the test; it verifies that students can still answer and return.

## Visual review and limits

The native Canvas review renders 4,941 story frames covering all 81 pages, plus 837 encounter frames covering all nine creature types. The review reel adds 2,790 continuous sequence frames spanning opening, rescue, all camps, betrayal, forging, escape, reunion, the final fight, barrier, fusion, destruction and rune encounters. Contact sheets were inspected for cast duplication, bars, grips, timing and contact.

`animation-review-v20.mp4` is a silent review reel, with many long shots condensed for review. It is not a runtime download. In-game dialogue and effects use the player's SFX setting. `animation-raster-v20.json` records native drawing measurements on the build machine, not browser FPS.

No browser executable or physical phones were available here. The DOM/Canvas harness and native raster checks do not establish performance or appearance on every real device. Animations are finite, stop when hidden, honor reduced motion, and leave no recurring drawing timer while a student reads.

## Reproduce

```sh
python scripts/build.py
npm test
NODE_PATH=/path/to/node_modules node tests/render_animation_review.cjs /tmp/bitbound-review
python scripts/build_answer_key.py /tmp/BITBOUND_v20_Answer_Key.html
```

The optional visual-review dependency is `@napi-rs/canvas`; students do not install it. The game remains a static site with the Python runtime included for offline use after the first complete download.
