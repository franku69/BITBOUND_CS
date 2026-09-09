# v23 verification

## Educational progression

The uploaded v22 contained 268 authored questions but defeated mobs normally exposed only one, and the terminal/exit did not enforce the remaining curriculum. v23 supplies up to four same-stage questions per encounter and four permanent lesson sentries per world. A shrine requires its stage; terminal and exit require every world lesson. Mission GPS and the question dialog display completion.

| World | Required trail questions | Focus |
|---|---:|---|
| 1 | 40 | Python expressions, input/conversion, branches, loops, functions and debugging |
| 2 | 32 | Lists, indexing, slicing, mutation, copies, tuples and iteration |
| 3 | 32 | List algorithms, bubble/insertion/selection sorting and tracing |
| 4 | 32 | Applied sets/dictionaries/tuples, modules, function arguments, generators, classes, exceptions and files |
| 5 | 32 | Stacks, queues, recursion, search and algorithm reasoning |
| 6 | 32 | Singly linked lists, pointer methods, search implementations/tradeoffs |
| 7 | 32 | Tree structure, recursion, traversals and BST operations |
| 8 | 36 | AVL heights/balance, all four rotation cases, deletion repair, graphs, DFS and BFS |
| Total | **268** | Every authored question appears on the required path |

- `npm test` passed, including the existing runtime, rendering, input, save and offline-cache suites.
- `test_v23_learning.cjs` completed all 268 questions through actual shrine/sentry interactions with **zero combat mobs**. It required 77 short sets. It also checked wrong-answer blocking, round transitions, a single set reward, manual mid-set save/resume, older World 4 save migration, terminal/exit gates, and guardian/paladin/demon/fused-boss exclusions.
- `test_story_curriculum.cjs` completed all 268 trail questions, all 48 BYTE checks and all 48 coding challenge completion flows during the eight-world campaign, including rescue, betrayal, forging, Aster, barrier, fusion and ending.
- `test_v20_encounters.cjs` exercised 32 actual movement/attack traversals across worlds, protected carriers, travel fallback and control availability when art fails.
- The bank audit checked all 268 items, executed 136 Python trace snippets, and checked AVL insertion/deletion rotation cases. The shipped Pyodide runtime ran all 48 reference solutions against 180 challenge test cases.
- Manual progress writes only on explicit Save file. Native browser cache contains app files, not automatic student progress.

## Animation changes and review

A shared facial-performance pass now runs on all story pages. It adds speech syllables with phrase breaks, listener gaze, blink and cloth movement while retaining the exact same limbs and prop sockets. Sleeping/fallen actors remain quiet with closed eyes. BYTE's stern/sad faces are rendered rather than inheriting his static smile. Cinematic cuffs no longer duplicate the scene's restraints.

The fused form carries BYTE's face over Veyr's heart. After absorption, the next page retains the standing posture. A warning precedes an actual animated claw strike; impact dust/cracks use the same claw transform, and the crown opens after the contact. The reading phase does not replay the attack.

- Dense motion regression: **81,081 samples** across all 81 pages, with no unmasked hand-position jump greater than 8 logical pixels between adjacent samples.
- Additional tests: 8,181 timeline samples, 3,030 fixed-limb poses, 16,281 physical-interaction checks and 6,006 interactive prison samples.
- Native Canvas rendering: **4,941 story samples**, **837 creature-battle samples**, and **8,070 frames** for the continuous review. Actor draw calls were instrumented and matched unique scene IDs.
- Visual inspection covered all 81 pages in nine overview sheets, plus focused prison and fusion strips. The review includes start/action/end states and reading-idle samples. The silent MP4 is accelerated review footage, not a recording of a browser playthrough.
- `animation-review-v23.json` identifies the reviewed generated game bundle by SHA-256 and records native drawing measurements. These figures are not browser frame-rate or device-temperature measurements.

## Packaging and practical limits

The release builder verifies the compressed ZIP and every offline asset against its manifest. The Python standard-library ZIP is deliberately included inside the game ZIP. Build and runtime files carry new content hashes for service-worker updates.

The game retains the responsive interface, joystick and action buttons, reduced-motion option, adaptive effects, bounded caches, paused combat during reading/coding and hidden-tab cleanup. Tests use the project DOM/input harness and native Canvas. Physical phones, browser GPU performance, battery use and temperature were not measured. Offline reopening requires the initial pack to finish downloading and the browser to retain it.

For existing saves, only pre-v23 files imported at World 4 reopen the 32 rewritten World 4 questions. Later-world checkpoints retain their location and earlier answers. Use a fresh expedition to test the complete revised course.
