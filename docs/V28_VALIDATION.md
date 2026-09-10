# v28 — landscape handheld Story Mode

## What changed

- Phones/tablets receive a landscape prompt immediately on entering Story Mode.
  Fullscreen/orientation lock is requested from Enter landscape play or the first
  New Expedition tap. Unsupported/rejected APIs leave manual rotation available.
  The portrait fallback is explicit and never traps the student.
- A console layout reserves left/right control rails and a centered 16:9 canvas.
  The D-pad supports slide-to-change movement, diagonals, jump and held fast-fall.
  A jumps; B attacks continuously with the existing weapon cooldown; L dashes;
  R casts; Use interacts. Select changes gear; Start opens pause/settings/saves.
- Independent captured pointers allow moving and attacking/jumping together.
  Input releases on cancel, lost capture, pause, blur, resize and backgrounding.
- Rotation has its own pause ownership. Returning to landscape preserves any
  open lesson/dialog. Coding questions unlock orientation and suppress the prompt
  while the virtual keyboard is in use. Standalone Python Lab is unchanged.
- The browser adapter has no polling/render loop. The existing bounded simulation,
  graphics quality adjustment and manual-save behavior remain in use.

## Automated evidence

The release gate runs 48 registered checks, including the new orientation suite
and the replaced joystick suite covering the actual D-pad/action adapter. It also
checks native module boundaries, a clean rebuild and repeat-build determinism.
See `V28_TEST_LOG.txt` for the executed results.

New checks exercise phone/tablet versus touchscreen-laptop detection; successful,
missing and rejected browser orientation/fullscreen APIs; async request
cancellation; focus/fallback behavior; independent pause ownership; pointer
capture/multitouch; held attacks; keyboard/assistive activation; and cleanup on
rotation, blur, pause and visibility changes.

Existing checks cover all story scenes/animation continuity, world-specific
learning progression, fights, manual saves, Python worker execution, offline
root/subpath hosting, retries, cache hashes and update recovery. The 61 offline
assets include the new handheld stylesheet; the platform/input code is bundled
inside the engine. Packaging verifies every cached byte against its manifest.

The content fixture changes are limited to the approved Story control markup,
removal of obsolete joystick styles and new handheld stylesheet. Story data,
question banks, character art, mode logos, music and standalone Lab assets retain
their prior accepted content hashes.

## Device validation boundary

Executed in Linux with Node.js 24 and Python. Browser platform tests use explicit
API mocks and the production game harness; they do not establish visual layout,
hardware performance, Safari behavior or physical device compatibility. No new
browser screenshot or physical iOS/Android run was available for this release.
The layout uses safe-area insets, dynamic viewport units with viewport fallbacks,
a fixed-aspect playfield and at least 44px control targets.

Before publishing to a class, test on the actual supported devices:

1. Android Chrome: enter Story in portrait, tap Enter landscape play, verify the
   fullscreen/rotation request and left/right controls. Move while holding B and
   jump twice. Confirm Select changes weapons and Start exposes Save file.
2. iPhone/iPad Safari: test manual rotation if the browser rejects locking. Check
   both landscape directions and notches/home indicator; check the portrait
   fallback is usable without changing device settings.
3. Open a shrine, type with the on-screen keyboard, run/check Python, and close.
   The prompt must not interrupt typing. Portrait play must stay paused behind
   the prompt when returning from the editor.
4. Rotate during movement and during a lesson; background/restore the browser;
   enter/exit fullscreen. No movement should remain held and no lesson should
   close. Check desktop keyboard/mouse play and a touchscreen laptop separately.
5. Confirm Offline ready over HTTPS, reload offline, and manually save/load a file.
   First-time setup and device caches remain separate from student progress.

Browser orientation locks cannot be forced universally. MDN documents their
limited availability and typical fullscreen requirement:
https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock
