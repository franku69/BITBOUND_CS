# v24 character and animation review

## What changed

The old expression pass painted large rectangular eyes and mouths over an existing face. The portrait drawers also had their own static limbs, while the story used a separate rig. This produced exaggerated faces, inconsistent body proportions and different acting between views.

- `07-face-art.js` now paints each complete human head once: smaller ears, tapered jaw, compact eyes, restrained mouths and distinct hairstyles. Player appearance choices still apply.
- The player, four adventurers and BYTE share the articulated rig in gameplay, cinematics, portraits, the creator and cached lesson frames. The duplicate full-body drawings were removed from player and party art.
- Elbows bend toward natural forearm gestures. Wrists have oriented palms and thumbs. Aster's gloves, Rook's broader arms and the six resting attitudes remain distinct.
- Walk arms swing with the stride. The player's gait advances continuously instead of multiplying total time by changing speed. Acceleration and reversing cannot reset it to an unrelated frame.
- Falling characters settle out of their impact crouch into a side-lying pose. The painted pose, fixed-length limbs and physical sockets remain identical.
- Aster carries the folded cloak to the explorer, raises it at contact, then lets the fabric drape across the shoulders. Its top edge, hem and folds curve with its attachment points.
- Static torso textures do not bob independently when expressions change. Rotations and expressions use the precise drawing path; routine gameplay retains its bounded cache.

All 81 story pages inherit the shared character changes. The plot timeline, prison foreground, BYTE's departure/absence/return, physical handovers and ordered fusion remain under their existing single scene clock. No extra animation timers, external fonts or image downloads were added.

## Verification performed

- The complete `npm test` suite passed. It includes the real bundled Python runtime, lesson interaction, story progression, mobile inputs, manual saves and offline updates.
- Dense story continuity checks sampled all 81 pages at 1,001 times each. There were no unmasked hand jumps over the existing eight-pixel threshold.
- Existing physical-contact tests passed for cloak ownership, short stitching, ribbon wrapping, hand healing, greetings, forging, key retrieval and ground strikes. Interactive prison/fusion checks also passed.
- New v24 regressions checked 606 settling poses for fixed limb lengths and exact agreement between painted wrists and prop sockets; BYTE's walk-to-greeting boundary; natural conversational elbow placement; and 9,000 accelerating/reversing player frames without gait phase jumps.
- Native Canvas review rendered 4,941 story samples, 837 creature-battle samples and 8,070 continuous sequence frames. Actual draw calls matched unique actor IDs, with no duplicate character draw in a shot.
- An additional native art review rendered 3,780 rig samples across all 30 actions and six characters. Twenty pixel comparisons confirmed that changing mood does not move a torso away from its joints.
- Visual review covered all story-page overview sheets, all 30 action sheets, focused greeting/cloak/stitching/prison/fusion strips and sampled continuous sequences. The separate silent preview uses the actual game renderer, including a second of reading idle after the selected scenes.

`animation-review-v24.json` and `character-review-v24.json` identify the reviewed game bundle by SHA-256. The preview is rendered footage, not a browser recording. Tests use the project's DOM/input harness and native Canvas; physical phones, browser GPU performance, battery use and temperature were not measured.

## Existing educational behavior retained

The 268 required trail questions remain in world and topic order: 40, 32, 32, 32, 32, 32, 32 and 36. The full campaign test completed those questions plus all 48 BYTE checks and 48 coding challenge flows. World 4 keeps its applied questions. Boss fights cannot be interrupted by question encounters. The v23 teacher key still matches this unchanged question bank.

Manual Save file / Load file remains the only way to retain student work between visits. The offline cache stores application files. Offline play requires the first download to finish and the browser to retain that cache.

## Release

Extract into a fresh folder, then run `START_WINDOWS.bat` or `python3 scripts/serve.py`. Update the complete deployed folder together. The release packager verifies every offline asset hash inside the actual ZIP, including the nested Python standard-library ZIP.
