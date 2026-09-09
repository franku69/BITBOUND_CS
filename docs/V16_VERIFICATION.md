# v16 verification

- `npm test` passed on the release candidate.
- All 48 reference solutions passed 180 cases in native Python and the shipped Pyodide runtime. Curriculum and tutorial source files are byte-identical to the supplied v15.
- The full eight-world campaign passed rescue, betrayal, forging, paladin/BFS barrier, fusion and completion gates. Manual save/load and fresh-session isolation passed.
- Presentation regressions cover the spoiler-free opening, four roles, ordered hall entry, 96-frame sprite bound, four-entry backdrop LRU, indoor-only background drawing, five distinct cached voices, mute/visibility/close cleanup, finite animation and cancellation of delayed sounds.
- Every cinematic art ID was rendered with native Canvas at progress 0, 0.3, 0.6 and 1. Character lineup, hall, barrier and ending previews were inspected.
- Touch controls, worker execution, editor isolation, offline hashes, root/subpath navigation and cache updates passed the existing regression suite.

The UI/input tests use the project DOM/Canvas harness; art inspection uses native Canvas. This release was not measured on physical phones or laptops, so it does not claim a universal frame rate or temperature. The initial online download must finish before offline reopening; the browser must retain its cached app files.
