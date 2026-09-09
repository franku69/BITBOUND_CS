# v26 verification and deployment limits

## Production diagnosis

The uploaded v25 release and the published Pages manifest used version
`bitbound-dsa-8474b70f27cb`. A read-only audit of all 52 published offline assets
found one mismatch: `index.html` was 3,265 bytes instead of the manifest's 3,333.
The only difference was the removed “A WORLD BUILT FOR CURIOUS MINDS” paragraph.
The old worker verified that file during installation and rejected the entire
installation. Its page then timed out waiting for readiness and reported a
misleading connection error. The same error was observed in the live browser.

v26 retains the removed paragraph, rebuilds the release and repairs the install
lifecycle. SHA verification is retained: incomplete or mixed site uploads are
never labelled offline-ready. This is a prepared replacement, not a deployment
to the user's repository.

## Verification

- The complete npm regression suite passed, including 48 real Python solutions,
  180 grading cases, 268 contextual trail questions, all 81 story pages, manual
  save/load isolation, animation continuity, combat and 35 music scores.
- New recovery tests reproduce the exact missing-paragraph failure at both a
  domain root and a GitHub Pages repository subpath. The worker activates,
  reports the mismatched file, and succeeds after retry with corrected files.
- Checked partial-download repair, no false ready marker, wrong-version manifest
  recovery, quota denial, blocked browser storage with continued online asset
  delivery, concurrent tabs, completed-pack reuse and no duplicate runtime fetch.
- Checked stalled response bodies terminate and Retry starts a fresh job. Git
  staging with core.autocrlf=true preserves both LF and CRLF release bytes.
- Checked new-worker activation, failed/redundant installation, finite timeout,
  MessageChannel cleanup, retries after registration failure, status dismissal
  and no hidden-interpreter dependency in Story Mode.
- Checked joystick dead zone, two-finger isolation, pointer cancellation,
  rotation/blur/visibility resets, Gear switching without double activation,
  keyboard activation, pause guards and access to Field Guide.
- Compared the accepted artwork, music score and curriculum/story data with the
  uploaded v25 ZIP: no content changes. Gameplay-source changes are confined to
  routing the new Gear touch button into the existing weapon-cycle action.
- The final ZIP is checked for integrity and every offline asset's exact SHA-256
  and size, including the nested Python standard-library ZIP.

## Device and release limits

Automated checks are not a physical-device certification. The updated v26 pages
could not be previewed in this environment's browser because local preview access
is restricted. The production v25 failure was inspected live; final v26 visual,
keyboard, storage and offline checks should be done on the deployed release.
No claim is made that every browser supports WebAssembly, Service Workers, audio
or persistent Cache Storage, or that all hardware runs at a guaranteed FPS.

Before sharing v26 with a class, deploy the whole folder, run the supplied remote
asset checker, and test the actual link on Android Chrome, iPhone/iPad Safari
and desktop browsers used by students. Check 320–430 px portrait widths, short
landscape, notched devices, opening/closing the keyboard, a shrine, a boss fight,
manual Save/Load and a Python run. Wait for Offline ready before disconnecting.

See DEPLOY_TO_GITHUB.txt for exact update and remote-verification commands.
