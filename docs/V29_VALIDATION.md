# v29 — Windows paths, handheld detection and mob-question controls

## Fixes

The Windows failure was in the build tooling, before gameplay tests ran. A
resolved child used `runneradmin` while the temporary root still used `RUNNER~1`.
The asset versioner now resolves its root before walking the module graph; the
architecture checker uses the same boundary. Cycle detection, missing-file
validation and containment checks remain active. The portable alias regression
failed on the original implementation and passed with this fix. A Windows-only
test also exercises the actual `GetShortPathNameW` API. The Windows CI job remains
required alongside Linux; it has not been disabled or made continue-on-error.

Handheld layout and touch-control visibility now share one detector. It recognizes
coarse input, touch-only input, Android/iOS, iPad desktop mode, mobile user-agent
hints and actual touch interaction. A touchscreen laptop retains desktop controls
until touch is used or Handheld is selected. Setup and pause/settings both expose
**Play controls: Auto detect / Handheld · D-pad + A/B / Keyboard + mouse**. The
explicit selection wins and lasts only for the current page session. The adjacent
status includes **v29**, making the installed version easy to identify.

The existing D-pad, A/B buttons, L/R shoulders, Select, Start and Use now receive
that unified presentation state. Reading screens intentionally hide gameplay
buttons while combat is paused. Fullscreen/orientation requests still require a
gesture, have no polling loop, and retain the manual-rotation/portrait fallback.

Mob questions now separate selection, confirmation and continuation. Each answer
has a larger target with a letter badge, readable multiline text and visible
selected/correct/incorrect states. Tap an answer (or use the ▲/▼ controls), then
Confirm. A correct response enables Next question or Back to the trail. Wrong
answers allow retries without health loss. Code and choices scroll independently
of the bottom action deck. Landscape uses a two-column scene/question view;
portrait stacks them. New rounds reset both scroll layouts to the top.

Keyboard support: A/B/C selects, arrow keys change selection, Enter confirms a
focused choice, and other buttons keep native Enter/Space behavior. After a correct
response focus moves to Next. Save and Music remain within the dialog's tab order.
Repeated selection does not grade; double-tapping Next cannot skip an unanswered
round. Lesson order, world difficulty, all 268 questions, 48 shrine missions,
manual saves, combat balance, narrative, characters, animation and music content
remain unchanged.

## Executed checks

`python scripts/quality.py` passed all **49 registered checks** in Linux (46.5s),
including architecture boundaries, a clean reproducible rebuild, 7 portable build
contracts, all 268 native answer/confirm/continue paths, 32 gameplay traversals,
world-specific progression, boss encounter exclusion, touch input, orientation
lifecycle, Python execution, saves and offline recovery. The log is
`V29_TEST_LOG.txt`. The Windows-only short-path test is skipped on Linux and will
run in the unchanged Windows GitHub Actions matrix.

Content hashes were updated only for the requested Story control markup/styles,
the new dedicated encounter stylesheet and removal of its obsolete overlapping
rules. All accepted educational, narrative, character and mode assets retain
their previous hashes. Build-generated files and offline revisions are refreshed.
The offline manifest includes **62 assets**, including `adventure/encounter.css`.

## Verification limits and release check

These are automated source/runtime tests, not physical Android/iOS runs or visual
browser tests of this new build. They do not prove every screen size, browser API,
hardware temperature or frame rate. A live production inspection found v28's
handheld markup and matching v28 asset revisions, so this fix does not assume
that clearing a student's browser data is the solution.

After copying this release into the existing repository and deploying:

1. Wait for both Windows and Linux quality jobs and the Pages deployment.
2. Save work from an old tab before reloading online. Verify the **v29** control
   status and run `python scripts/check_offline_pack.py --url
   https://franku69.github.io/BITBOUND_CS/` from this release.
3. On an actual phone, enter Story, rotate to landscape and reach trail gameplay.
   Verify D-pad + simultaneous held B and A, double jump, L/R, Select, Start, Use.
   If detection differs, select Handheld in Play controls and return to the trail.
4. Encounter a rune mob. Select a wrong answer and confirm; read the feedback;
   choose the correct answer, confirm and continue. Test a long code question in
   portrait and landscape: the bottom actions must stay reachable without covering
   the reading area. Complete the set and verify combat resumes with no held input.
5. Rotate/background during movement and questions; verify no stuck controls or
   skipped lessons. Check a shrine with the software keyboard, Save/Load and an
   offline reopening after Offline ready. Test Safari's manual-rotation fallback.

The ZIP includes the build, source, tests and deployment instructions. No GitHub
push or production deployment is performed by creating this release.
