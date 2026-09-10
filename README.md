# BITBOUND — Python Lab and The Stoneborn Oath

An educational Python IDE and eight-world Story Mode for students. Includes 48
coding missions, 268 world-specific trail lessons, BYTE tutorials, animated
companions and bosses. Every visit starts fresh; students keep work with **Save
file** and restore it with **Load file**.

This v29 release fixes Windows build paths and improves mobile Story controls and mob lessons.
Use the D-pad to move, A to jump, hold B to attack, L to dash, R for power and Use
to interact. Select changes weapons; Start opens pause, manual saves and settings.
The accepted story, questions, artwork, music and desktop layout are preserved.

Story Mode detects phones/tablets and offers landscape immediately. Tap **Enter
landscape play** to request fullscreen and orientation locking where supported.
Otherwise, turn the device sideways. **Continue in portrait** is available if the
device cannot rotate. The Python editor remains usable with the phone keyboard.
Standalone Python Lab keeps its existing responsive layout.

In setup or Start → How to play, choose **Play controls → Handheld · D-pad + A/B**
if Auto detect does not match your device. Detection also recognizes touch input
and mobile browsers in desktop mode. The controls appear during active trail play;
reading screens pause combat and provide their own controls. The status says **v29**.

In mob lessons, tap an answer or use ▲/▼, then **Confirm**. A correct response
enables **Next question** or **Back to the trail**. These buttons stay outside the
scrolling question area. No answer is submitted just by selecting it. Keyboard:
A/B/C select, arrows move selection, Enter confirms a focused answer, Tab moves
between controls. Wrong answers allow retries and cost no health.

## Play or run locally

Published class site: https://franku69.github.io/BITBOUND_CS/

For a downloaded project, double-click `START_WINDOWS.bat`, or run:

```sh
python scripts/serve.py
```

Use the localhost URL printed by the server. Keep that terminal open. The published
website needs no local Python installation, npm packages, student accounts or
backend. Its Python interpreter is bundled and runs in a browser worker.

Wait for **Offline ready** before disconnecting. Offline availability depends on
the browser retaining its cached app files. Saving a student's progress is a
separate, explicit download.

## Develop

Maintainers need Python 3.10+ and Node.js 22+. No `npm install` is required.

```sh
npm run build
npm test
npm run check
```

`build` updates generated files. `test` runs registered checks. `check` also proves
source/generated consistency, repeat-build determinism and architecture boundaries.
For a focused iteration: `npm test -- --group animation` (or `interface`, `python`,
`gameplay`, `offline`, `architecture`).

## Project map

| Folder | Purpose |
| --- | --- |
| `adventure/domain/` | Configuration, fresh state, learning order, plot and save rules |
| `adventure/systems/` | Story, gameplay, rendering, audio and input adapters |
| `app/lab/` | IDE catalog, files, execution, views and composition |
| `app/` | Browser adapters, worker, grader, manual saves and offline lifecycle |
| `shared/` | Shared iframe protocol |
| `scripts/buildlib/` | Separate deterministic build stages |
| `tests/` | Registered regression suites and accepted-content fixtures |
| `runtime/`, `vendor/` | Bundled, pinned Python and editor dependencies |
| `docs/` | Current guides and historical release evidence |

Read [CONTRIBUTING.md](CONTRIBUTING.md) for where to make each kind of change and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for boundaries and contracts. Earlier
versioned validation files are historical reports; `V29_VALIDATION.md` describes
this release.

## Package and publish

```sh
npm run release -- ../BITBOUND_Python_Practice_v29.zip
```

The release command builds, runs the complete quality gate and packages a verified
ZIP. It does not upload anything. Follow `DEPLOY_TO_GITHUB.txt` to update the
existing `franku69/BITBOUND_CS` repository. Copy extracted contents into the repo
root; do not upload the ZIP or accidentally nest the project another level.

After GitHub Pages deploys:

```sh
python scripts/check_offline_pack.py --url https://franku69.github.io/BITBOUND_CS/
```

The included GitHub workflow adds Windows/Linux checks. Wait for quality checks
before merging changes; it does not replace or reconfigure Pages publishing.
