# v30 — Always-landscape Story and Windows runtime paths

## What changed

- Mobile Story Mode uses a landscape viewport from the first display. The
  landscape-choice dialog, Continue in portrait option and orientation pause
  are removed. Upright browsers show the entire landscape surface rotated 90
  degrees at full size. Turning the device sideways removes the rotation. There
  is no squashed portrait game and no blocked wait for orientation permission.
- The public `story.html` hosts one game frame, `story-game.html`. Only this frame
  rotates: its media queries, canvas and pointer events all use the same native
  landscape coordinates. This preserves the approved D-pad, A/B, shoulder buttons,
  mob-question layout and desktop view without maintaining duplicate touch math.
  Physical safe insets are applied once, outside the frame.
- The existing Play/Fullscreen tap attempts native fullscreen and orientation
  locking where available. Browser denial leaves the already-landscape surface
  usable. Native lock promises are cancelled on departure; fullscreen exit
  returns to the same landscape surface. No polling or extra game loop is added.
- Physical rotation releases held controls, even if the logical frame size stays
  the same. Open lessons, code and story scenes remain open and retain their pause
  ownership. The former orientation pause cannot freeze reading or gameplay.
- Return-to-mode links navigate the whole page. Direct navigation to the inner
  game routes to the public Story host. Both pages and all new presentation assets
  are included in the verified offline pack. Standalone Python Lab is unchanged.

The v29 Windows build-contract fix already passes in the user's supplied log.
The new failure was separate: the Node Pyodide test used `URL.pathname` as a native
path. On Windows, `/D:/...` was resolved into `D:\D:\...`. The worker test adapter
had the same conversion. Both now use the shared `runtimePath()` helper, which
calls Node's `fileURLToPath()`. It decodes URL escapes and handles drive letters and
UNC paths properly. Pinned runtime/vendor files are unchanged.

## Executed evidence

`python scripts/quality.py` passed all **50 registered checks** in Linux with
Node.js 24 and Python 3.12, in **46.1 seconds**. See `V30_TEST_LOG.txt`.

- Architecture boundaries and 32 generated/versioned files passed; a clean rebuild
  and its repeat were byte-identical.
- Node's actual Windows and POSIX URL conversions passed explicitly selected
  platform tests: `D:`, spaces, Unicode, `#`, UNC and normal POSIX directories.
  Both runtime entrypoints are checked to use that shared adapter.
- The shipped WASM/CPython runtime executed all 48 reference solutions and 180
  cases, imports/reimports, input, tracing and errors. Worker initialization,
  execution, endless-loop termination, restart and output streaming also passed.
- Landscape tests cover six viewport geometries, full-surface bounds, detection,
  a phone with an attached keyboard, safe desktop defaults, late host connection,
  accepted/denied/missing native APIs and async cancellation. The real game adapter
  is exercised for held-input release and preservation of lesson/editor pauses.
- Existing suites passed for all 268 world-specific mob questions, their new
  select/confirm/continue controls, all eight worlds, boss exclusion, manual saves,
  story and animation continuity. Offline tests load both Story pages at root and
  GitHub Pages subpaths, including recovery and update checks.

Accepted content hashes were updated only for the landscape host, relocated Story
markup, removed orientation controls/styles and new host stylesheet. The question
banks, narrative, art, music, encounter stylesheet and standalone Lab retain their
previous accepted hashes. The final offline pack contains **66 assets**.

## Limits and post-deployment verification

The full Windows CI job was not executed locally. The Windows path-conversion
algorithm was tested explicitly on Linux; the Windows-only short-root build test
remains in CI and is skipped on Linux. Both Windows and Linux jobs remain enabled
and required. No failing test was disabled to make the gate pass.

Geometry/input tests are not visual browser or physical-device tests. This release
does not claim universal device support, frame rate or temperature results. In
particular, physical Safari/Android rotation, software-keyboard placement and
native fullscreen behavior still require confirmation on the students' devices.

After deploying the whole release:

1. Confirm both GitHub Actions quality jobs pass and Pages finishes deploying.
2. Save work from an old tab, reload online and verify **v30** beside Play controls.
   Do not omit `story-game.html` or the new landscape scripts/stylesheet.
3. Open Story on a phone held upright. It should immediately show a sideways,
   landscape-sized game without asking a question. Turn the phone sideways: the
   same scene should fit normally and keep its place.
4. Test moving while holding B, double jump, L/R, Select, Start and Use. Rotate
   while holding a control; it must release. Try native fullscreen and exiting it.
5. Rotate during a story page, a mob question and Python editing. Check scrolling,
   answer/confirm/next buttons and the software keyboard. Save/Load a session and
   confirm Python Lab opens normally after returning to the mode chooser.
6. Run `python scripts/check_offline_pack.py --url
   https://franku69.github.io/BITBOUND_CS/` from this release. After Offline ready,
   reopen the site offline and enter Story and Python Lab.

Reference behavior:
[Node fileURLToPath](https://nodejs.org/api/url.html#urlfileurltopathurl-options)
and [browser orientation locking](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock).

The ZIP includes source, generated assets, tests and deployment instructions.
Creating it does not push to GitHub or deploy the live site.
