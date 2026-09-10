# Maintaining BITBOUND

Use Python 3.10+ and Node.js 22+. The build and tests use bundled assets and the
standard libraries; there is no npm install step. Students need only the website.

## Daily workflow

```sh
npm start
npm run build
npm test -- --group interface
npm run check
```

`start` runs the local HTTP server. `build` regenerates bundles, entry URLs and the
offline manifest. `test` runs all registered tests; choose a group for a short
development loop. `check` is the final read-only gate: architecture checks,
reproducible build verification and the complete test suite. It fails on stale
generated files rather than quietly correcting them.

Available test groups: `architecture`, `gameplay`, `animation`, `python`,
`interface`, `offline`. List the individual checks with `python scripts/test.py --list`.

## Where to make a change

| Change | Source of truth |
| --- | --- |
| Weapon, pet or mobility balance | `adventure/domain/game-config.js` |
| New-session defaults | `adventure/domain/campaign-state.js` |
| World question ordering and sets | `adventure/domain/learning-path.js` |
| Save validation/migration | `adventure/domain/story-save.js`, `plot-state.js`, `app/session-file.js` |
| Physics, combat, NPCs, story presentation | Named feature in `adventure/systems/` |
| Mobile orientation/fullscreen | `adventure/handheld.js`, `adventure/handheld.css` |
| D-pad and action input | `adventure/touch-controls.js`, `adventure/systems/22-touch.js` |
| Python editor behavior | `app/editor.js` |
| Mission selection and page coordination | `app/lab/controller.js` |
| Mission/progress HTML | `app/lab/mission-view.js` |
| Output, errors and trace presentation | `app/lab/results-view.js` |
| Run/Check/Stop coordination | `app/lab/execution.js` and `app/runner.js` |
| Python file commands | `app/lab/files.js` |
| Iframe messages | `shared/protocol.js`, with both senders/receivers updated together |
| Questions, explanations or narrative | The authored JSON files listed in `docs/ARCHITECTURE.md` |
| Offline installer | `app/offline.js`, `app/offline-session.js`, `scripts/sw-template.js` |
| Build inputs and runtime asset list | `scripts/build-config.json` |

## Boundaries

- Domain rules receive explicit data. They must not query the DOM, create timers,
  load Python or access browser storage.
- The Lab and mode chooser must not import the Story engine.
- Views render supplied data; they do not start workers or change navigation.
- Use `Message` constants and `isPeerMessage` for the iframe boundary. Preserve
  request IDs, task/session IDs and revision checks. Same origin alone is not enough.
- Keep student progress in memory until a manual Save file action. The existing
  `bitbound-music` session preference is the only storage exception.
- Preserve the fixed simulation step, bounded entity collections and caches.
  Prefer local spatial queries; do not add per-frame sorting or recurring work
  while the game is paused or hidden.
- Register new game systems once in `adventure/systems/order.json`. Boot stays
  last. Register pure game domains in `scripts/build-config.json`.

The compiled simulation still shares a deliberate private runtime context for
entities, camera and caches. Keep UI coordination there; put reusable learning,
configuration and save rules in the isolated domain modules. See the architecture
decision record for why the build retains a single game delivery bundle.

## Source and generated files

Edit authored files, then rebuild. Do not hand-edit `adventure/game.js`,
`adventure/engine.js`, `adventure/questions.js`, `sw.js`, the offline manifest or
the combined CodeMirror bundle. The build also refreshes `?v=` URLs in HTML and
native module imports. Commit those refreshed URLs with the source change.

Use UTF-8, LF, spaces, descriptive function names and short comments explaining
invariants. `.editorconfig` supplies editor defaults. Do not remove
`.gitattributes`: it protects exact offline bytes on Windows.

Tests named for an older release are regression contracts, not obsolete code.
Add new checks to `tests/suite.json`; unregistered test files fail the runner.
The accepted-content fixture intentionally protects v26 narrative, questions and
visual assets. For a future content change, review and update the affected
fixture hashes along with the change; do not update it just to hide a regression.

## Making a release

```sh
npm run release -- ../BITBOUND_Python_Practice_v27.zip
```

This builds, runs the complete quality gate and packages a ZIP outside the
project. Packaging includes `runtime/python_stdlib.zip` and verifies every offline
asset inside the finished archive. The command never commits, pushes or deploys.

Keep the existing GitHub Pages deployment. `.github/workflows/quality.yml` adds
Linux and Windows checks for pushes and pull requests. A quality workflow alone
does not block an independently configured Pages deployment: use a pull request
and wait for its checks before merging. A repository owner can make those checks
required through branch protection.

After Pages finishes, run:

```sh
python scripts/check_offline_pack.py --url https://franku69.github.io/BITBOUND_CS/
```

For changes to layout, input, audio, rendering or offline lifecycle, also test the
published build in the actual Android/iOS/desktop browsers used by the class.
Node Canvas mocks cannot establish frame rate, heat, touch layout or speaker output.
