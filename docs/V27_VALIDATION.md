# v27 maintainability release — validation

Input: the uploaded v26 ZIP, SHA-256
`f2d0b012d9d0d41b6a1422c1e6b1833d4b352af2e510642bca7eef6164c03edf`.
The v26 baseline suite passed before edits.

## What changed

- Six isolated game/protocol domains with explicit exports: balance/configuration,
  fresh campaign/player state, learning paths, plot state, Story save validation
  and shared message vocabulary.
- Lab entry and coordination separated from catalog, file commands, execution,
  mission/progress presentation and results/trace presentation.
- Actual cancellation completion replaces the timer assumption before session
  replacement. A delayed file import cannot land in a different workspace.
- 85 authored JavaScript files were expanded into readable statement/block layout.
  Each formatting step was compared using a JavaScript parser and had an identical
  AST. This one-time refactor evidence adds no runtime or CI parser dependency.
- Independent build stages, recursive native-import revisioning, explicit UTF-8/LF
  output, path-aware release fingerprints and reproducible-build checks.
- Named test groups, a finite timeout for each test process, Windows/Linux CI,
  contribution guidance and an architecture decision record.

## Automated evidence

The complete registered suite has 47 test processes. It includes:

- 48 reference Python solutions and 180 grading cases using the bundled runtime.
- All 268 world-specific trail lessons, required stage gates, multi-round sets,
  saved progress migration and exclusion of encounters during every boss phase.
- All 81 story pages, dense animation/socket/prop continuity checks, prison and
  BYTE exit timing, fusion, player motion, pet behavior and party combat.
- Audio state, music selection, touch controls, Gear switching, fresh student
  sessions, explicit save/load, iframe identity and stale message isolation.
- Both standalone and embedded Lab module graphs, delayed import routing and
  delayed worker cancellation during session replacement.
- Offline integrity and recovery at root and repository subpaths, SHA mismatch,
  partial download/eviction, quota failure, wrong manifest, body timeout, retry,
  prior scoped-cache retention and concurrent requests.
- Six build-tool unit tests: transitive and multiline imports, side effects and
  re-exports, cycle/missing-source failures, isolated exports, UTF-8/path handling,
  and path-sensitive offline fingerprints.
- Direct domain tests comparing learning order across every world/stage and
  partial-progress pattern, independent nested session data, plot migration and
  indexed mission lookup.
- 20 accepted-content fixtures: questions, tutorials, story, logos, HTML layout
  and CSS remain the same as v26. Only generated HTML asset revisions are ignored.

The quality gate additionally verifies 27 native/domain module boundaries,
48 registered gameplay systems, six isolated domains, the offline dependency
closure, current generated outputs and a byte-identical repeated build.

## Performance evidence

`V27_BENCHMARK.json` records one before/after run of the existing Node VM/mock Canvas
benchmark. Mean script times stayed within a few percent (approximately 0.037 ms
per mocked draw). Maximum cached terrain was unchanged: 3 MiB stationary and
6 MiB while scrolling. Runtime data structures, rendering policy and worker
execution remain in place; no new runtime package dependency was added.

These are synthetic measurements, not browser FPS or phone temperature tests.

## Scope of verification

Local checks ran with Node 24.19.0 and Python on Linux. The included GitHub workflow
is configured to run Node 22/Python 3.12 on Windows and Linux after upload; those
hosted runs are not claimed as already executed here. Browser hardware, physical
mobile UI and actual sound output were not re-tested during this code-only
refactor. The accepted HTML/CSS/art/content checks and functional regressions are
preserved; device acceptance remains appropriate when a future update changes
those surfaces.

The ZIP contains generated production files as well as maintainable sources.
Use `npm run check` for verification and `npm run release -- ../release.zip` to
build, validate and package a future release. Neither command pushes or deploys.
