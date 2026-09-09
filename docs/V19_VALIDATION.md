# v19 implementation and verification

## What changed

- Attack poses now share one timing curve for torso, arm and weapon. They return to the same idle grip at both ends. Cinematic poses use continuous articulation; gameplay retains bounded cached poses. Held gifts and the pan attach to character hands. Dropped guild equipment stays on the floor after its owner falls.
- Friendly Aster, Mira, Rook and Fern actively fight until betrayal. They choose nearby targets, move toward their effective range, jump terrain/obstacles, wind up, release once, and recover. Aster and Rook use melee contact areas; Mira and Fern launch real projectiles from their staff tips. Fern prioritizes healing when needed. Healing and attacks have separate cooldowns. Support is available against the early guardians and stops after betrayal.
- 112 authored rune encounters supplement the original 48 Python tasks. Their world assignments range from basic Python through lists, collections, algorithms, linked lists, recursion, trees, graphs and AVL rotations/rebalancing. These are multiple-choice code-reading and reasoning encounters; the existing shrines retain their Python coding editor and exact task positions.
- At most four of the existing bounded mobs carry runes. A nearby carrier announces a short warning. The dialog pauses the game, allows explained retries without health loss, and offers Step away. Bosses, the final arena, sanctuary areas, other overlays and story scenes block question launch. Guards are checked again after the warning. Completed encounter IDs are included only in explicit save files; new sessions start empty.
- BYTE's prison reveal, cell taunt and escape dialogue are rewritten to make his hostility explicit. Later lesson introductions and responses use his hostile characterization while retaining useful concept explanations.
- The final guild confrontation now has an authored windup, axe/spell release, contact, recoil, separate falls, dropped equipment, power transfer and restrained camera movement. Sound cues use the same scene clock. The shot lasts 12 seconds, then rests. Aster remains alive and the three bodies stay in their positions on subsequent pages.

## Automated checks

`npm test` runs the existing regression suite plus:

- `test_encounter_bank.py`: all 112 authored entries, 47 code-output snippets executed in isolated Python, all four AVL insertion rotation families, and the deletion case with zero child balance.
- `test_v19_encounters.cjs`: every actual answer/continue button path, wrong-answer retries, retreat, automatic nearby-mob warnings, per-world nonrepeating decks, boss/final-phase/overlay/hidden/death guards, pending-warning cancellation, explicit-save filtering, fresh sessions and unchanged shrine/terminal arrays.
- `test_v19_party.cjs`: all four roles, no damage or projectile before release, real melee/projectile damage, healing cooldown/cap, team damage against a boss, immediate betrayal cutoff, continuous hand/weapon recovery, ordered final-fight deaths, persistent corpses/equipment and near-contact gift transfer.
- Existing continuity tests: 8,181 timeline samples over all 81 story pages and 2,222 articulated poses, including fixed limb lengths, unique actor IDs, entrance spacing and BYTE's absence during the prison escape.
- Existing production Python runtime, curriculum solutions, joystick, manual save/import, lesson buttons, editor/worker lifecycle, offline package integrity and cache update tests also pass.

The log is `docs/v19-test-results.txt`.

## Rendered review

`tests/render_animation_review.cjs` executed the actual production art modules with native Canvas and rendered 4,941 frames covering all 81 pages without rendering exceptions. It instrumented actual draw calls to check one draw per visible actor. It also exported 1,080 consecutive review frames, including the full 12-second guild fight. Selected contact sheets and action poses were inspected for detached equipment, duplicate bodies, floor contact, foreground bars and cast continuity.

`docs/animation-review-v19.mp4` is a silent 54-second visual review reel. Other than the guild fight, long dialogue shots are condensed for review; the game uses its own finite durations. In-game dialogue and effects remain enabled according to the player's SFX setting. The review video is not part of the automatic offline download.

`docs/animation-raster-v19.json` records local native-Canvas timings. Those are drawing measurements on the build machine, not browser FPS or phone temperature measurements. No physical phone or browser binary was available in this environment. Responsive layout, pointer controls and lifecycle behavior have automated coverage; real-device performance and appearance should still be checked on the school's target devices. No universal no-lag or no-overheating guarantee is implied.

## Reproduce

```sh
python scripts/build.py
npm test
NODE_PATH=/path/to/node_modules node tests/render_animation_review.cjs /tmp/review
python scripts/build_answer_key.py /tmp/BITBOUND_v19_Answer_Key.html
```

Native raster review uses optional `@napi-rs/canvas`; the game itself has no new dependency or CDN request. Source modules remain in `adventure/systems/`, with a deterministic bundle and refreshed offline asset hashes.
