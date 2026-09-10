# Architecture and maintenance

## Boundaries

| Area | Files | Responsibility |
|---|---|---|
| Mode chooser | `index.html`, `mode-select.css`, `app/mode-select.js` | Lightweight native links to Python Lab and Story Mode; no story engine or interpreter startup |
| Studio opening | `app/studio-intro.js`, `index.html`, `mode-select.css` | Native dialog, one cancellable timer, Continue/Escape, focus/inert lifecycle, reduced motion; no interpreter dependency |
| Encounter catalog | `adventure/encounter-catalog.js` | Immutable nine-mob definitions and precomputed per-world pools |
| Encounter simulation | `systems/10-encounters.js` | Safe placement, capped population, fixed-clock respawns, movement dispatch and nearby audio cues |
| Creature artwork | `adventure/creature-sprites.js` | Original pet/mob pixel art, lazy bounded frame cache and shared-clock pose selection |
| Extra skills | `systems/02-extra-skills.js` | Six bounded effect handlers, skill picker and cooldown-safe equipment changes |
| Additional sound | `systems/04-extra-sounds.js` | Short synthesis recipes, voice throttling, footsteps, landings and weapon sounds |
| Story entry | `story.html`, `game-windows.css` | Centered solo setup, HUD, touch controls, challenge window frame |
| Offline session | `app/offline-session.js` | Shared registration, download status, preparation and retry for all three pages |
| Story session | `app/game-session.js` | Combines manual story/Python files and adapts challenge prewarming to offline setup |
| Python Lab entry | `app/lab.html`, `styles.css` | Standalone IDE or embedded story challenge using the same markup/controller |
| Workspace controller | `app/main.js` | Parent commands, free/mission modes, submissions, output and progress |
| Editor adapter | `app/editor.js` | One pinned CodeMirror bundle, keyboard/touch commands and textarea fallback |
| Python client | `app/runner.js` | Shared initialization promise, request IDs, timeout and cancellation |
| Python worker | `app/python-worker.js` | CPython loading, virtual Python files, streamed output and result messages |
| Execution/checker | `app/grader.py` | Isolated case namespaces, compilation caches, input, bounded output and traces |
| Curriculum | `app/curriculum.json`, `scripts/build-curriculum.py` | Canonical 48 exercises and their authoring source |
| Session state | `app/storage.js`, `app/report.js` | In-memory drafts, revisions, validation, passing snapshots and escaped reports |
| Manual files | `app/session-file.js`, `app/session-controls.js` | Portable codec, explicit downloads/file choices, dirty prompts and New player |
| Offline client | `app/offline.js` | Service worker registration, progress channel and bounded readiness waits |
| Offline worker | `scripts/sw-template.js`, generated `sw.js` | Verified downloads, request deduplication, content-versioned caches and offline navigation |
| Adventure source | `adventure/systems/` | Original game systems divided by concern; generated into one delivery bundle |
| Game utilities | `adventure/core.js` | Spatial hash, pools, bounded stores, LRU backgrounds and conditional DOM writes |
| Frame timing | `adventure/performance.js` | Fixed simulation clock, sleeping frame scheduler and automatic visual quality policy |
| Terrain textures | `adventure/terrain-cache.js` | Visible chunk caching, invalidation and bounded surface reuse |
| Touch input | `adventure/touch-controls.js`, `systems/22-touch.js`, `adventure/story-controls.css` | Pointer-captured joystick, multitouch action wiring, responsive layout and cancellation |
| Guide lessons | `adventure/tutorials.json`, `systems/14-mentor.js` | One authored lesson per curriculum ID, reusable paused dialog, in-memory reading flags and challenge gates |
| Guide art | `adventure/mentor-sprite.js` | Six source poses (48 × 88), six cached world poses (36 × 56), no runtime image download |
| Player mannerisms | `adventure/player-animation.js` | One reusable cosmetic pose, existing simulation clock, idle/landing/reward gestures and reduced motion |
| Guide voice | `adventure/mentor-voice.js` | Deterministic gibberish synthesis, cached mono PCM, one Web Audio loop and explicit stop |
| Guide reactions | `adventure/mentor-animation.js` | Finite portrait animation, one timer, close/visibility/reduced-motion cancellation |
| Chapter story | `adventure/story.json` | Eight Stoneborn chapters, 81 scene pages, introductions, farewells and quips |
| Dependencies | `runtime/`, `vendor/` | Pinned local Pyodide 0.27.7/CPython 3.12.7 and CodeMirror 5.65.20 |

The workspace uses native ES modules with explicit imports and has no animation loop. Task/chapter Maps index lookups. The canvas game uses 45 ordered source units sharing one lexical closure; these are not independent ES modules. `adventure/systems/order.json` defines their order. Edit those sources, not the generated `adventure/game.js`. General-purpose engine helpers are independent modules exposed through small namespaces. The build concatenates `core.js`, `performance.js`, `terrain-cache.js`, `touch-controls.js` `mentor-sprite.js` `mentor-animation.js` `player-animation.js` , `mentor-voice.js`, `encounter-catalog.js` and `creature-sprites.js` into `engine.js`, keeping source boundaries without adding serial network requests. Do not edit that generated bundle either.

## Mode routing and lifetime

`index.html` is the mode chooser. Its native links go to `app/lab.html` and `story.html`; navigation never waits for offline setup or interpreter startup. The chooser loads only its small stylesheet and offline-session modules. It has no game canvas, gameplay script or hidden Python iframe. Its small music score starts only after user interaction. Offline caching can still download the complete pack in the background.

Direct lab entry always selects a fresh `free` workspace and the mobile Code view. It does not redirect or mount a story window. `app/main.js` guards parent messages with the embedded flag plus origin/source checks. Standalone lab starts its own offline session; a challenge iframe relies on its story parent. `app/workspace.html` is a legacy redirect to the lab, while `adventure/index.html` redirects old game links to the chooser.

The story entry retains the existing character creator and adventure. Its left-edge Python Lab launcher, L shortcut and reserved launcher gutter are removed. Return links sit inside setup, help, guide and completion panels. Pagehide stops Python without saving student state. Save file is required before navigation to keep work. Full-page mode changes release the current runtime and initialize another when needed. Runtime bytes are cached, but live workers are not shared across page navigations.

Workspace IDs remain stable for explicit old backup imports. Older browser student data is never read or automatically migrated. A root visit always shows the two choices, and each page initializes fresh in-memory state. The only retained localStorage preferences are audio settings, not student work.

Entry CSS/scripts and the complete static ES-module import graph use build-generated content-revision URLs. Dependency hashes are computed before importers; the build rejects cycles. This prevents a still-active older worker from returning its unversioned automatic-storage module to a new entry script. The worker maps known revision URLs to the verified canonical cache without duplicate offline assets. `app/lab.html` is a new URL, avoiding the previous worker's cached standalone-workspace redirect. Root, story and lab navigation prefer the network and fall back to their own saved HTML offline. The install shell contains only the mode chooser dependencies; the verified full pack contains both modes.

## Manual student sessions

app/storage.js never reads or writes localStorage, sessionStorage, cookies or IndexedDB. Story state also stays in memory. Scalar revisions track unsaved changes without full-state comparison. Edits after an export snapshot remain dirty. beforeunload requests a browser warning but is not a recovery mechanism; it never saves. A BFCache pageshow reloads fresh rather than silently reviving a previous student. New player confirms discard and reloads. Existing downloaded files are left for the student to manage.

The JSON envelope is bitbound-student-session, version 1, containing python plus an optional story checkpoint. The codec rejects unsupported formats and files larger than 32 MiB. Python validation limits workspace IDs, file names/counts and content size; story validation bounds campaign fields and accepts explicit legacy five-world checkpoints. Old browser keys are not consulted.

One shared control module owns file selection, download requests, overwrite prompts and status messages. Python Lab handles its memory store directly and can carry an attached Story checkpoint without running the engine. Story Mode validates both parts, explicitly replaces child Python state through the reusable iframe, then restores a safe adventure checkpoint. A Lab-only file is rejected by Story Mode with instructions to load it in Python Lab.

The iframe sends only scalar revision notices while editing. Manual Save/Load uses request IDs and at most one pending request with an eight-second timeout. Source/origin checks, request matching and revision acknowledgements reject unrelated/stale replies. Loading invalidates any active challenge continuation. No automatic storage mirroring runs between tabs or frames.

## Persistent story challenge window

`14-practice.js` owns one reusable challenge iframe, created once during story warmup and retained when hidden. Shrines and terminals share it. `window.BitboundChallenges` exposes only prewarming; free coding belongs to Python Lab Mode. Story commands lock the editor to the selected task, including revisited completed shrines.

After `bitbound:workspace-ready`, the parent sends the queued `bitbound:open-workspace` command with the task, locked mode and session ID. The child keeps its previous workspace in memory, stops active code if necessary, selects the mission and refreshes the editor. Closing sends `bitbound:hide-workspace` to retain the current in-memory code and close dialogs while retaining an idle interpreter.

Completion is accepted only from that iframe at the same origin, with the current task and session ID. The callback is consumed once. Passing results remain visible until Continue, with no artificial delay or iframe reload between terminal tasks. This protects against accidental stale rewards, not deliberate manipulation of public game code.

## Story curriculum and tutorials

The build groups the canonical curriculum's 48 task IDs by its eight chapters; it asserts six tasks per chapter and one tutorial per task ID. Each world consumes four shrine tasks followed by two terminal tasks. The generated question adapter contains lessons indexed by task ID, so all narrative text, code and feedback is ready without a runtime fetch or extra library. Edit `adventure/tutorials.json` to change Byte's teaching; edit `app/curriculum.json` (or its generator) to change the tasks. Keep IDs aligned.

`14-mentor.js` owns a single reusable three-page dialog and one pending continuation. `withTutorial` gates first attempts at shrines and each terminal task. Closing discards that continuation; finishing the understanding check sets an in-memory boolean and invokes it once. Transitioning from a passed terminal task closes its editor before displaying the next lesson. Mission awards continue to require the current iframe/task/session match. Reading and checking a lesson never increments the completed-task count.

The next guide target scans at most six fixed mission flags and reuses one world rectangle until the target changes. After a guardian, a farewell target appears near the portal. Byte is 36 × 56 pixels beside the 24 × 44 player. His interaction rectangle and labels use those dimensions, with the original center and foot position preserved. Six 48 × 88 portrait sources and six 36 × 56 world frames are painted once, requiring 149,760 RGBA bytes before Canvas overhead. The world uses one image draw for a visible pose, chosen from the existing game clock. A short nearby quip uses the same clock.

Browser timer defaults are wrappers calling window.setTimeout/window.clearTimeout with their required receiver. Assigning the bare Web API as an animator method caused v10's Illegal invocation error. Lesson correctness, choice state, feedback and Continue are updated before optional animation. A synchronous presentation failure disables further reactions without blocking the lesson. Regression clocks enforce Window receiver semantics rather than silently accepting an animator as the receiver.

PlayerAnimator advances only in the existing unpaused simulation. It mutates one pose object, never player coordinates, velocities, collision size or input. It uses no timer, asset fetch, DOM write or randomness. Running, attacks, jumps and dashes take priority over idle poses. The renderer moves the upper body/head and free arm while feet and weapon behavior retain their gameplay positions. Reduced motion/eco mode resets cosmetic offsets; new campaigns and checkpoint resets clear transient poses. An accepted challenge callback queues a brief celebration once; it resumes when the player leaves the paused editor.

Portrait reactions have a finite frame sequence and at most one 180 ms timer. A generation token ignores stale callbacks. Closing, hiding the page or reduced-motion/eco mode stops animated playback; there is no persistent idle timer or typewriter loop. Dialogs use textContent, managed focus, native buttons and scrolling. All 48 narrative introductions and payoffs are in tutorials.json; eight chapter goals and farewells are in story.json. The build packages both with lesson metadata, without extra runtime fetches.

The joystick has its own normalized movement axis; keyboard keys are not mutated by touch. One pointer is captured for its drag. Other fingers can activate action buttons without stealing that pointer. Pointer events update the knob directly; there is no extra rendering loop. Dead-zone filtering suppresses drift, and pause/blur/resize/visibility changes reset both the axis and capture. Joystick and lesson styles belong to the Story entry only.

`completedQuestionCount` counts shrine flags and individual terminal flags, with an assessment-complete fallback for old checkpoints. Save validation accepts legacy five-world arrays, pads new worlds with unsolved flags, preserves partial terminal progress and whitelists known tutorial IDs. World labels, score-free mission HUD, final portal and completion report use the actual campaign/task counts. Eight palettes, guardian behavior profiles and HP settings cover the expanded campaign; existing artwork and audio are reused.

### Dialogue voice lifecycle

GibberishVoice synthesizes 24 short vowel-like syllables with consonant noise, varying pitch and phrase pauses into 105,840 mono samples at 22,050 Hz (4.8 seconds). Small harmonic wavetables keep sample generation linear and avoid repeated harmonic synthesis. It runs only on first audible conversation, then retains one AudioBuffer (423,360 bytes of PCM). The sample array and small wavetables are temporary. No sound files, fetches, microphone, speech service or per-syllable JavaScript timers are used.

A single AudioBufferSourceNode loops through the SFX bus at gain 0.18. Repeated page changes reuse that source. Closing, muting, loading another session, leaving the page or hiding the tab stops and disconnects it; reopening reuses the PCM buffer. A separate quiet lesson score plays beneath the voice; dialogue lowers only the music bus. The dialogueOpen flag prevents the normal 1.2-second idle suspension from cutting off the voice. Muting re-enables idle suspension; returning to a visible, still-open conversation resumes audio using the existing AudioContext. The source remains subject to normal browser audio-unlock behavior.

AudioEngine owns open/mute/background state, and the voice module owns samples and playback nodes. Audio failures are caught without blocking lesson feedback or Continue. The dialog exposes the existing SFX toggle to phone users, and its focus loop includes that button. Portrait and player animations remain independent of the audio loop.

## Execution lifecycle

1. Background warmup creates a worker and prepares the local interpreter. `prepare()` shares one promise between warmup and a user pressing Run. The worker fetches the checker while loading CPython.
2. Each request passes a workspace snapshot, input, mode and optional task. Python execution time is measured separately from initialization.
3. The worker updates virtual `.py` files, removes old files, and invalidates student helper modules. Standard-library modules remain cached.
4. The checker uses a fresh namespace for each run/case. Bounded LRU caches retain compiled code (12 entries) and parsed ASTs (8 entries). Helper imports are invalidated by indexed workspace filenames rather than scanning every standard-library module.
5. Run/trace output sends the first write immediately and batches later writes at 40 ms or 2,048 characters. The UI coalesces DOM updates at 40 ms. A final complete result replaces streamed text, preserving exact output. Checks return structured case results rather than streaming every case.
6. The client accepts only the matching pending request ID. Stop and timeout terminate the worker; stale results cannot resolve a newer request. A later run creates a new interpreter after cancellation, but ordinary window changes reuse it.

Output is capped at 24,000 characters; traces at 180 events; workspace file count and size are limited. These bounds keep routine practice responsive. A worker is not a strict memory sandbox: very large Python allocations can still exhaust device memory, and Pyodide exposes browser/origin capabilities to student code. There is no backend secret, remote shell, account or verified grading service.

## Game performance and data structures

- Task Maps give expected O(1) lookups. The adventure adapter contains metadata for all 48 tasks and their separate narrative tutorials; tests and worked solutions live in the one canonical curriculum.
- Collision candidate queries use a one-dimensional spatial hash: O(n) rebuild followed by nearby-bucket checks. Buckets and query markers are reused. The common rebuild path reads scalar bounds without allocating an array per enemy. Extremely dense buckets can still degrade.
- Dense arrays compact in place; particles reuse pooled objects. Projectile, particle, loot and background stores have explicit bounds. The six landmark rectangles and the interaction bounds are reused rather than recreated every simulation tick.
- Terrain is rendered into 8 × 8 tile chunks (256 × 256 pixels). A Map-based LRU retains at most 24 surfaces in low-power mode or 28 in standard mode; evicted surfaces are recycled. RGBA pixel storage is bounded to 6 / 7 MiB, excluding browser object/graphics overhead. Only visible chunks are drawn. Building a missing chunk visits at most 64 tiles; steady frames use one image draw per visible chunk. A new world resets entries while reusing surfaces. Failure to allocate an off-screen surface falls back to the original tile renderer.
- `setTile` invalidates the changed chunk and the tile below, whose grass edge depends on the tile above. Runtime tile edits must use this function. World generation can write its fresh typed arrays directly before assigning the new world.
- A separate two-entry LRU retains background surfaces. Actors, boss telegraphs, shrines and decorations remain dynamic and render separately from terrain. Off-screen drawing and distant simulation are culled.
- Physics advances at a fixed 60 Hz, independently of drawing. Each rendered frame runs at most four simulation steps; stalls discard excess catch-up time. Pausing and visibility changes reset the clock, avoiding a burst of hidden-time simulation on return.
- The frame scheduler sleeps until the next render deadline, then requests a browser-aligned frame. It retains at most one timer or animation callback. Hidden tabs cancel both; paused windows can draw once when changed and then stop. The HUD clock writes at 2 Hz; other unchanged HUD text/classes are skipped.
- Automatic visual profiles target 60 / 30 / 20 FPS (standard / low / eco). Touch devices, reduced-motion preferences and reported low CPU/memory capability start in low mode with a 960 × 540 canvas. Standard starts at 1280 × 720. Sustained expensive frames or missed render deadlines reduce the profile, without oscillating it upward. An automatic downgrade retains the current canvas resolution to avoid resetting game coordinates. Profiles change particles, stars, decorative glows and update frequency, keeping the same projectile and loot capacities and the same physics. Actual frame rates still depend on hardware/browser load.
- The v25 music director selects a quiet section score during overlays and the relevant world/boss score during play. Music has a bounded 40-voice scheduler; SFX retains its separate 48-voice cap. Hidden pages cancel scheduling and suspend audio immediately. When both music and dialogue are off in an overlay, short SFX drain before context suspension. Returning restores the chosen track and mute preference. Individual notes do not rewrite UI controls.
- The setup background is static, paused HUD animations stop, and low mode removes the full-screen scanline blend and backdrop blur. Character design, world art, mission feedback and the centered story setup are retained. The floating launcher is removed in v7.
- CodeMirror's pinned modules are concatenated at build time to avoid a serial script-download waterfall. The native textarea remains available if enhanced-editor loading fails.
- Draft edits remain in memory with a scalar revision increment. JSON serialization occurs only on explicit Save file. No per-keystroke storage serialization or periodic checkpoint write runs.

`tests/benchmark_startup.mjs` compares four isolated worker startups plus a tiny print program against four requests sharing an already-ready worker, using the actual bundled runtime under Node. Recorded means are about 1,401 ms versus 2.1 ms (`docs/startup-benchmark.json`). This isolates removed initialization work; filesystem loading and Node execution do not represent a phone, browser or slow network. Cold startup remains substantial because the bundled Python core is approximately 13.9 MB.

### Measured drawing work

`node tests/benchmark_game.cjs` now runs 600 frames in each of eight worlds under a mocked Canvas in Node. The historical v5/v6 measurements below used the original five-world campaign. The stationary camera is at (800, 480); scrolling advances 6.6 pixels per frame, corresponding to normal 198 px/second movement at 30 FPS. The cache is warmed before measurement, and scrolling measurements include new chunk builds.

| Scenario | Canvas commands/frame | Mean JS time/frame |
|---|---:|---:|
| v5 stationary baseline | 2,618.6 | 0.263 ms |
| v6 stationary | 184.8 | 0.066 ms |
| v6 scrolling, terrain cache disabled | 3,037.6 | 0.292 ms |
| v6 scrolling, terrain cache enabled | 203.8 | 0.069 ms |

The scrolling comparison isolates the cache in the same code and quality profile. It reduces drawing commands by about 93%; 48 chunks are built across each 600-frame scroll. Raw results are in `game-benchmark-before.json` and `game-benchmark-after.json`. These are JavaScript/mock-command measurements, not GPU costs, browser FPS, network timings, battery savings or temperature measurements. They cannot establish performance on a physical phone.

For v9, the same local mock-Canvas benchmark covers all eight worlds with Byte enabled. Scrolling averaged **201.7 drawing commands/frame** with terrain caching versus **3,041.4** with it disabled; retained terrain pixels stayed within **6 MiB** in low mode. Raw per-world results are in `game-benchmark-v9.json`. These measurements check retained rendering efficiency after adding the guide; they are not browser FPS or temperature measurements.

## Automatic offline app caching

Each top-level page registers the shared worker with bounded readiness waits. The chooser starts caching immediately; story/lab sessions allow interpreter warmup a head start. After warmup (or a 12-second head start), it requests the full offline pack automatically. A shared download job has at most two concurrent consumers, progress subscribers, and an in-flight URL Map so normal page requests and caching can share downloads.

The service worker verifies SHA-256 against the content-versioned manifest. It announces completion only after all required files are present and a completion marker is written. Retries fill missing files after connection failures. On a later visit, a marker plus a presence check avoids downloading or hashing the whole runtime again. Browser eviction of files is detected when preparing the pack again.

Caches separate content-versioned application assets from pinned Python and editor assets. App changes can keep unchanged engine files. The worker installs a small verified shell, activates with `skipWaiting`, and claims pages; it never automatically reloads an open editor. Chooser, story and lab navigation use the network when available and their corresponding cached HTML when offline. Repository subpaths, embedded workspace navigation and old adventure URLs are supported.

The full pack is approximately 16 MB uncompressed. Offline readiness requires the first download to finish and browser storage to remain available. It needs HTTPS or localhost service-worker support; HTTP LAN phones can use the running local server but cannot install offline caching through that insecure address. The readiness banner reports actual completion and exposes retry on failure.

## Build and run

The ZIP is ready for static hosting: no npm installation or compilation is needed for students. `python scripts/serve.py` runs a local development server. It defaults to port 8765, falls back to alternatives or an OS-selected port when binding fails, and prints/opens the actual address. The Windows launcher distinguishes a missing interpreter from a server failure.

After curriculum edits:

```sh
python scripts/build-curriculum.py
python scripts/build.py
```

After any other delivered source or documentation change, run `python scripts/build.py`. It builds the ordered game sources, metadata adapter and editor bundle, then generates hashes, sizes and a versioned offline worker. Individual editable source units and tests are shipped but are not all downloaded in the offline pack.

`runtime/package.json` scopes the pinned Emscripten files as CommonJS for Node-based verification under the root ES-module package. Browser worker loading is unchanged.

Only to refresh dependencies, run `python scripts/fetch-vendor.py` while connected. It downloads pinned files and records their hashes. Version/cache-name changes and license updates must accompany dependency changes.

## Developer verification

`npm test` runs these checks (Python 3 and modern Node are required for developers only):

- `tests/test_curriculum.py`: 48 solutions/180 cases, blank and wrong answers, input, trace and output bounds.
- `tests/test_pyodide.mjs`: all curriculum cases in the shipped WebAssembly engine, plus helper edits, imports and errors.
- `tests/test_tutorials.py`: executes all 48 standalone lesson examples and checks the displayed outputs.
- `tests/test_touch.cjs`: analog dead zone/bounds, captured-pointer ownership, multitouch isolation, and gameplay pause/lifecycle cancellation.
- `tests/test_story_curriculum.cjs`: every tutorial gate and award, 48/48 completion, eight guardian transitions, taller guide ground alignment/interaction/cache, first-terminal count updates, and five-world save migration.
- `tests/test_adventure.cjs`: mocked game DOM/canvas, solo start, persistent iframe, session validation, rewards, assets and resume.
- `tests/test_performance.cjs`: production movement at multiple frame rates; scheduler refresh/cancellation simulation; terrain content, cache bounds, mining/grass invalidation, world changes and chest interaction.
- `tests/test_audio.cjs`: all 35 arrangements, world/boss/section routes, mute, hidden suspension, scheduling drift, voice limits and node cleanup. `test_page_music.cjs`: gesture unlock, isolated standalone music, shared mute setting, navigation/visibility lifecycle and embedded-IDE exclusion.
- `tests/test_storage_runner.mjs`: fresh memory stores, ignored legacy records, explicit imports, revisions and cancellation/stale replies.
- `tests/test_manual_story.cjs`: no automatic student writes, explicit combined files, iframe guards and export revision races.
- `tests/test_session_files.mjs`: portable round trips, real save/load handlers, invalid/large files, discard cancellation and fresh handover.
- `tests/test_mentor_voice.cjs`: PCM bounds/pauses, E interaction, one cached loop, no duplicate voices, mute, visibility, close paths and failure isolation.
- `tests/test_mentor_animation.cjs`: Window receiver checks, cached frame dimensions, finite single-timer reactions and lifecycle cancellation.
- `tests/test_lesson_buttons.cjs`: screenshot questions, wrong/correct answers, all 48 lessons under forced animation failure, and shrine continuation.
- `tests/test_player_animation.cjs`: cosmetic pose reuse, gestures, control priority, unchanged physics, reduced motion, pause and campaign reset.
- `tests/test_update_cache.mjs`: module revision integrity and updates through a worker holding old automatic-storage code.
- `tests/test_worker.mjs`: production worker protocol, helpers, infinite-loop termination and restart.
- `tests/test_streaming.mjs`: output arrives before a sleeping program ends, with an exact final result.
- `tests/test_workspace.mjs`: controller messages, free/locked modes, independent in-memory drafts and window reuse under a mocked DOM. The `--standalone` run also checks direct free-lab startup, Run, optional practice, ignored parent commands and fresh sessions and explicit file restoration. Uses Node's experimental VM modules for dependency injection.
- `tests/test_offline.mjs`: production worker caching under a test adapter, full hashes, subpaths, disconnected navigation/runtime, missing-file retry and in-flight deduplication.
- `scripts/validate.py`: JavaScript syntax, local references, separate entry routes, solo setup and offline hashes.
- `tests/test_modes.mjs`: authored routes/return links, absence of game-engine code on lab/chooser entries, module reachability and ownership.

These tests cover logic and the actual Python runtime. They do not replace browser UI, browser service-worker integration or physical phone testing. No such device/browser QA was performed for this update.


## v13 content and limits

The encounter catalog is separate from drawing and combat. Eight precomputed pools select a random eligible type in O(1). World generation attempts 18 placements; live and dead entries together never exceed 18. Every 18 seconds of active play, the director compacts dead/fallen entries and attempts one replacement outside the camera, at least 12 tiles from the player. Shrines have a seven-tile spawn exclusion; Byte has a five-tile exclusion; the terminal/arena is excluded. Existing player sanctuaries and paused lesson windows remain. No new movement timers or enemy-per-frame DOM writes were introduced. Enemy spatial indexing remains shared with melee, targeting and projectile collision.

Four pets have six cached poses each; six additional mobs have four poses each. At full population of the cache, 48 small 32 × 32 RGBA surfaces account for 196,608 bytes (192 KiB), excluding Canvas implementation overhead. Unknown IDs cannot extend the cache. The renderer reuses frames with one image draw and honors reduced motion. The existing simulation supplies animation time, so dialogs and hidden tabs freeze world animations. No standalone pet RAF or interval exists.

Weapon metadata lives in `01-config.js`; additional designs use the central weapon drawing switch. Mob drop thresholds use >= so a full loot queue or earlier failure does not permanently lose a reward. Three late guardian rewards also arrive at completion milestones 34/40/46. Save validation uses the catalog for supported weapon/skill IDs and all nine mob kill counters, retaining old manual-file compatibility.

Six new skill implementations use a bounded dispatch table, with no recursive projectile creation. Skill selection lives in the existing Field Guide. It preserves level, clears the previous speed buff, and enforces at least one full cooldown when the skill changes. The existing global projectile limit still applies. Creature sound recipes are cached, at most one new creature cue starts per 100ms, and each attacking creature waits 1.5 seconds between audible cues. All tones share the existing voice cap and SFX bus.

The opening card is a short studio presentation, not a measure of offline-download completion. Native form submission can close it even before its JS module loads. The module supplies timed dismissal, Escape, focus restoration and temporary inert mode links. Closing or leaving cancels its only timer. Reduced motion shortens the card and disables CSS animation. The service-worker shell includes the small intro module.

### v13 verification

- `tests/test_expansion.cjs`: pool reachability, placement exclusions, finite AI movement and ranged attacks, capped replacements, mob drops, eight unique guardian rewards, all new skill effects at four levels, manual save round trip, sprite cache bounds and audio throttling.
- `tests/test_studio_intro.mjs`: automatic dismissal, native Continue, Escape, reduced motion, focus and lifecycle cleanup.
- Existing lesson, Python, mobile-input, audio, manual-file, mode-routing and offline/update tests remain in `npm test`.
- Artwork inspected using the production drawing functions with native Canvas. Browser/device QA remains outstanding; these checks do not establish phone temperatures or real browser FPS.

The local mock-Canvas v13 scrolling benchmark averages 193 drawing commands/frame with terrain caching, versus 3,032 with it disabled. Low-mode terrain pixels stay within 6 MiB. `game-benchmark-v13.json` records eight worlds; this measures JavaScript/drawing-command work only, not physical-device performance.


## v14 studio branding

`app/assets/guild-logo.png` is the supplied portrait, used unchanged. `app/assets/guild-wordmark.svg` renders USTP Game Dev Guild as original square-pixel outlines in gold and cyan. Both assets are part of the offline shell and full pack. Explicit aspect ratios prevent layout shifts; the portrait uses high fetch priority and pixelated rendering. The accessible studio heading retains its name through the wordmark's alt text. The existing intro dismissal, Continue button, reduced-motion behavior and mode routes are unchanged.

To change the lettering, edit the 5x7 grids in `scripts/build-guild-wordmark.py`, run it, then run `scripts/build.py`. Both commands use only Python's standard library. The wordmark requires no installed font, font service or runtime drawing script. Its SVG paths preserve the pixel style at desktop and phone sizes.

## v17 narrative, art and combat presentation

There are 37 ordered gameplay sources compiled into the existing static bundle. `07-party-art.js` owns a lazy, closed-set atlas of four 64 × 96 character designs, sixteen poses and two equipment tiers (at most 128 frames / 3 MiB of pixels). Legacy world consumers retain eight 32 × 48 thumbnails. `07-castle-art.js` owns static architecture and the reusable barrier renderer. A four-entry LRU holds 640 × 300 backgrounds (at most 2.93 MiB). `07-story-art.js` composes those assets through explicit shot/cast contracts. The opening cannot inherit a party because its shots declare only the player and BYTE.

`14-story.js` owns plot validation, explicit transitions, the interactive prison and four bounded companion actors. `12-story-combat.js` owns plot gates and the existing final-phase profiles. `story.json` contains chapter and scene text, art IDs and speaker moods; Python correctness is in the unchanged curriculum/tutorial check fields. Scene IDs are stable for existing save files. Rewritten scenes resume at their stored page index; campaign flags and challenge progress do not reset on explicit import.

Scenes schedule one drawing callback every 50 ms for 3.6, 6 or 7.2 seconds, then stop. Playback uses elapsed time so delayed callbacks do not lengthen the sequence. A generation token invalidates cancelled callbacks. An optional delayed crash/launch cue is cancelled with the scene. Reduced motion draws the final pose. Page hiding, explicit Stop, ordinary dialog closure and navigation all cancel drawing. The existing overlay pause mechanism stops combat underneath scenes. Portrait animation uses the same callback and cached frames, with no independent loop or per-frame DOM writes.

`mentor-voice.js` has five pitch, vowel, seed and rhythm profiles. `AudioEngine.setSpeaker` stops the previous speaker before starting another. At most one source loops; up to five 4.8-second, 22,050 Hz mono Float32 buffers are cached (about 2.02 MiB total). SFX mute, hidden tabs, scene closure and audio failure use the existing cleanup path. No audio downloads or speech service are needed.

World backgrounds are declared in `02-powers.js` and painted in `07-biome-art.js`. Their progression is valley, forest, cavern, dungeon, catacombs, castle approach, inner keep and throne hall. Both photo assets and the preload are removed; world 6 adds a cached castle facade. Worlds 7–8 take an early indoor render path that does not request or draw exterior artwork, sky stars, hills or fog. The normal terrain cache and fixed physics continue below this presentation layer.

The four party actors are a fixed array. Fern heals on a twelve-second cadence; Aster provides brief protection on his attack cadence; Mira and Rook provide ranged and short-range attacks. All projectiles use the existing 140-item bound. No new enemy pool, network request chain or student autosave is introduced.

`test_story_curriculum.cjs` drives all 48 questions and the complete campaign. `test_stoneborn.cjs` covers plot/save gates and final boss retries. `test_story_presentation.cjs` covers cast isolation, entrances, role/sprite bounds, character voice lifecycle, finite animation and delayed cue cancellation. Native Canvas previews cover every shot at start, action and resting frames. Physical mobile performance remains device/browser-dependent; see `STORY_MODE.md` for the full route and controls.


`07-story-choreography.js` maps each directed `story.json` page beat to a physical action and participants. Public opening shots never show the company; private company scenes never render BYTE. Callback-independent progress drives hand-offs, gate rescue, soup, needlework, poison and memories. Narrative pages are stable, so v15/v16 manual save indices still work. The final fusion has a page-stage guard to avoid showing the merger during the preceding conversation.

`07-player-art.js` caches up to 32 64×96 poses (768 KiB). Appearance changes clear that cache. At most 24 cinematic hero poses are held (600 KiB) and cleared for a new scene's explorer. Sixteen party poses across four actors and two equipment tiers take at most 3 MiB; the four-backdrop LRU is at most 2.93 MiB. `creature-sprites.js` holds eight poses for four pets and six for nine mobs (792,576 bytes). Twenty 88×58 weapon surfaces take 408,320 bytes; twenty-one 48×48 spell surfaces take 193,536 bytes. Native Canvas previews validate shape rendering; decoded pixel figures exclude browser bookkeeping.

`11-pet-support.js` scans bounded loot/projectile arrays at 5 Hz rather than each 60 Hz physics step. Fox fetch selection uses squared distance; Sort Bot queries the existing spatial index. Owl interception consumes one hostile shot per cooldown. Healing clamps to maximum health. All actions run under the ordinary simulation pause guard and introduce no timers, network calls or writes to local storage.

Enemy behavior remains local and bounded. Each actor owns a small intent state (`patrol`, `windup`, `leap`/`rush`/`dive`, `recover`; mimic adds `sleep`) and locks its attack aim when the warning starts. A maximum 24-probe line-of-sight test runs when preparing/firing an attack. Terrain lookahead uses a few tile cells. This deliberately avoids whole-map pathfinding per actor. The existing 18-enemy director, spatial hash, active simulation range and projectile limits remain authoritative.

`test_v17_gameplay.cjs` covers secrecy contracts, directed memories, fetch/heal/interception/overclock effects and cooldowns, pause behavior, aimed attack commitment, terrain occlusion and fixed art cache sizes. `docs/game-benchmark-v17.json` measures mocked-Canvas JavaScript work only; it is not a phone FPS or temperature claim.


## v18 character animation and scene ownership

The build now bundles 38 ordered sources. Edit the source modules and run `python scripts/build.py`; never patch `adventure/game.js` directly.

| Module | Responsibility |
|---|---|
| `adventure/player-animation.js` | Chooses player actions from existing velocity, airborne, dash, attack and landing state. Reuses one pose object; does not modify physics. |
| `07-character-rig.js` | Samples articulated poses; solves two-segment arms and legs with fixed lengths; maintains grounded soles; paints textured body/head parts and attaches equipment to hands. |
| `07-player-art.js`, `07-party-art.js`, `mentor-sprite.js` | Detailed appearance layers. Layer parameters suppress the neutral limbs under an articulated body. Legacy portrait helpers remain compatible. |
| `07-story-choreography.js` | Builds a scene graph keyed by actor ID. Owns entrance paths, actions, props, explicit cast presence, flashbacks, prison placement and escape-page metadata. |
| `07-story-art.js` | Paints the graph once per character, then foreground props, effects and occluding bars. Boss body parts and Veyr's wings share this presentation layer. |
| `14-story.js` | Plot transitions, manual-save indices, companion simulation and finite animation/audio lifecycle. |

`buildStoryFrame` is deterministic for a page and normalized time. It does not draw. Each actor ID has exactly one final pose; assigning a new pose replaces the previous pose in its Map. `renderStoryGraph` is the sole actor draw pass. An interaction cannot accidentally paint a second hero underneath a different gesture. The `rendered` IDs support regression assertions; native-raster QA separately instruments the real draw calls.

The rig uses 13+14 pixel arm segments and 16+16 pixel leg segments. Kneeling lowers the pelvis and bends joints instead of vertically scaling the torso. Hand/foot targets are constrained to reach, and grounded poses retain a planted sole. Short target blends settle walking into dialogue and kneeling without compositing two complete actors.

There are at most 32 texture-part cache entries (two 64×96 RGBA layers each: 1.5 MiB) and 80 body frames (112×128 RGBA: 4.375 MiB). Body caches exclude held weapons, so switching equipment does not duplicate the body atlas. Walking uses eight phase samples; attacks and forging use ten. Two demon configurations each retain three 96×112 body-part textures. These are upper pixel-storage bounds, excluding browser bookkeeping. Existing terrain, creature and equipment cache limits remain in force. In v21, completed cinematics continue with bounded 8 FPS reading idle. One-shot plot time stays at 1. Hidden tabs, Pause and scene closure cancel the timer; reduced-motion mode renders a settled pose.

Companions use four fixed actors, constant-time terrain lookahead and bounded gravity updates. A visible companion jumps before stepping onto a higher surface; it does not teleport its y-coordinate to the next tile. Only off-camera actors may regroup instantly. Support cooldowns and friendly-projectile caps remain in the gameplay layer.

Scene IDs and page numbers remain stable for imported v15–v17 saves. `escapeBeat` explicitly distinguishes the unattended lock/escape page from BYTE's return; `endingBeat` distinguishes the final blow from absorbing its power. Interactive forging never includes BYTE. The prisoner and corridor visitor occupy different sides of the front bars.

## v19 combat, pose and encounter ownership

| Source | Responsibility / bound |
| --- | --- |
| `systems/07-character-rig.js` | Shared articulated pose and grip transforms. Cinematic actors draw continuous poses; gameplay caches at most 80 body frames. Attack grip returns to idle at both endpoints. |
| `systems/07-story-duel.js` | Pure finite throne-room choreography, camera framing, contact effects and dropped equipment; no gameplay state mutations. |
| `systems/11-party-combat.js` | Four ally state machines. O(18) nearest-target scan per actor, terrain probes, single release per attack, role-specific damage/healing, no support after betrayal. |
| `adventure/encounter-questions.json` | 268 authored questions with world, topic, options, answer and explanatory feedback. Separate from the 48 coding challenges. |
| `systems/14-question-encounters.js` | Pre-indexed ordered world arrays and ID Map; earliest-unfinished selection over at most 40 entries; 10 Hz proximity scans over at most 18 mobs; one required encounter dialog. |
| `systems/10-encounters.js` | Spreads initial rune carriers across five route segments. Sealed creatures approach without damaging ranged attacks. |
| `systems/09-persistence.js` | Optional `encounterRead` field in explicit save files; filters unknown IDs. Older saves load with an empty encounter record. No automatic browser progress writes. |
| `scripts/build_answer_key.py` | Generates a separate, self-contained teacher HTML key from the exact shipped content. Not a runtime or offline-pack dependency. |

Boss/arena/story/overlay/sanctuary guards are checked when an encounter opens. Finishing a rune question never writes to
`solved`, `terminalSolved`, `assessmentPassed` or `tutorialRead`. The earliest unfinished item
remains next until completed; previously learned items review in lesson order after
all questions in that world have been completed. A new student session clears
all in-memory records. App-file offline caching remains separate from saving
student work.


## v20 presentation and required-encounter boundaries

- `07-story-direction.js`: pure acting/camera pass over the unique-actor scene graph; explicit prop ownership, fixed-pose transitions, blink offsets and prison/recall staging. It never advances campaign flags.
- `07-character-rig.js`: 29 bounded actions. `fromPhase` preserves the prior grip during transitions. IK enforces both maximum reach and minimum joint distance. Story rendering and prop sockets sample the identical continuous pose.
- `07-encounter-art.js`: finite intro/retry/win battle vignette. Uses the existing creature atlas and world backdrop cache; adds no external assets or gameplay loop.
- `14-question-encounters.js`: required-answer state, ordered world paths, proximity/travel director and cancelable 20 FPS vignette. Shows functional controls before attempting art. The correct answer enables completion synchronously, independent of animation timing.
- Combat calls `runeContact` before changing carrier HP. The simulation exits as soon as an encounter pauses it. Global keyboard routing yields to the encounter before handling game shortcuts; Escape provides a clue and cannot open stacked windows.
- Sound effects are crossed on the same normalized story timeline as contacts. Stopping or hiding a scene cancels future frames and cues together. Two cached lighting overlays add depth with a fixed 12-mote bound.

Initial carrier assignment makes one scan over the bounded enemy list. World question indexing costs O(Q) plus one O(Qw log Qw) sort per world at startup; selection costs O(Qw), Qw <= 40, only when opening a question; and proximity checks O(E), with E capped at 18. No per-frame whole-world path search, downloads or unbounded animation caches were added.


## v21: interaction ownership and separate ambient time

`07-story-interactions.js` owns physical action phases and small interaction props. `rigPoseForActor` is the single source of painted limb positions, hand sockets and weapon grips. It converts optional world-space hand targets into the actor frame, clamps reach, then solves two fixed-length arm segments. Hand targets are used only by cinematic poses, without changing gameplay physics or damage. Close interaction shots use a gentle camera push.

`14-story.js` owns one timer: 50 ms during a finite action, then 125 ms while reading. Plot progress remains 1 during reading; a separate ambient time affects only breathing, eyes, cloth, fire and motes. Cast, position, prop ownership, death, opening doors and destruction never restart. Pause/Resume and hidden-tab resume preserve elapsed action time. Rendering has no automatic storage writes or additional network dependencies.

The question bank contains 268 stable-ID questions in eight world arrays. Coverage tags and the top-level coverage index support authoring audits and the teacher key. Runtime selection now uses a bounded earliest-unfinished scan over the authored world path; ID lookup stays O(1). Existing question IDs and manual progress remain compatible.

`tests/test_v21_story.cjs` checks all 81 pages at 201 timeline positions, exact prop/palm agreement, fixed limb lengths, gift/tie phases, two-hand contact, worn-ribbon continuity, dual castle impacts, and idle/pause/visibility lifecycle. Native Canvas review adds six-frame filmstrips and complete preview sequences. This is deterministic local rendering and simulated game integration, not a claim of testing every physical device.


## v22: authored learning paths and cinematic staging

| Source | Responsibility |
|---|---|
| `encounter-questions.json` | 268 stable IDs, contiguous per-world sequence, four stages, world context, coverage and authoring manifest. |
| `14-question-encounters.js` | First-unfinished selection, fixed 12-second encounter cooldown, explicit success/continue, ordered review. Creature randomness does not alter question order. |
| `story.json` | All 81 connected narrative pages, stable scene/page indices, locations, lens settings and durations. |
| `07-story-cinematics.js` | Pure pose composition after physical-interaction staging: prison, forging, escape, crown fusion, map and group reactions. |
| `07-character-rig.js` | Fixed-length arms, shared hand sockets, gaze/head tilt. It never mutates game collision or HP. |
| `07-story-art.js` | Background, actor depth, one draw per actor, small props and foreground bars. BYTE's absorption clips the existing actor in 384 bounded cells; it does not create ghost sprites. |
| `14-story.js` | Explicit prison action metadata and corresponding text/audio, manual save state, one playback owner. |
| `scripts/package_release.py` | Reproducible ZIP, including nested Python archives; verifies every offline hash directly from the finished ZIP. |

Questions are indexed once and sorted once per world. Finding the earliest missing prerequisite is O(k), with k at most 40, only when a dialog opens; no sorting or full-bank scans happen per frame. Progress uses existing stable-ID records in manual save files. Review cursors are transient and reset for a new session. Unfinished lessons always take precedence, including when a pre-v22 save contains scattered completions.

The cinematic pass mutates one existing scene graph with at most the established cast. It runs on normalized plot time; reading idle has a separate time, so gifts, death, escape and fusion never repeat while someone reads. Each visible prop has one owner or a declared world anchor. Foreground bars are painted after the prisoner; the door opens before crossing. BYTE departs before scroll/forging scenes, then returns only on the authored return page. His fusion uses explicit depth in front of Veyr and shared hand targets at the crown.

`test_v22_progression.cjs` exercises every ordered answer through real encounter controls, wrong retries, review and older-save gaps. `test_v22_cinematics.cjs` adds 6,006 interactive prison samples, exact crown contact, foreground depth and absorption ordering. `render_animation_review.cjs` renders all 81 actual scene pages plus interactive prison/forging steps; `inspect_cinematic_frames.cjs` provides focused six-frame sheets. These optional native-Canvas utilities are development tools, not client dependencies. See `V22_VALIDATION.md` for scope and physical-device limits.


## v23: required completion and shared facial performance

`05-learning-path.js` owns immutable per-world question indexes, four-question stage sets, progress queries and the four cached sentry rectangles. `14-question-encounters.js` owns answer UI, explicit per-round completion, set rewards and interruption guards. `13-interactions.js`, `14-practice.js` and `15-campaign.js` enforce stage, terminal and exit gates; `08-navigation.js` points at the first missing stage. Shrine data and placement do not change.

Question selection scans at most 40 current-world items when opening a set. Four sentry completion flags update with the HUD, and static rectangles are cached with the generated world. Drawing and interaction inspect at most four sentries without sorting or scanning the whole question bank per frame. There are no extra combat enemies, background polling loops, worker instances or network dependencies. Random creature placement cannot determine curriculum coverage.

Correct/Continue commits one stable question ID. Up to four rounds share one paused dialog and one cancelable illustration timer. A set rewards one skill XP and at most one heart, after its last answer. Manual snapshots record `encounterVersion: 4`. When an older snapshot is explicitly imported at World 4, only its rewritten World 4 answers reopen; shrine flags and inventory remain. No student data is loaded automatically.

`07-story-performance.js` adds speech phrases, gaze, blink and cloth time to the one actor Map after physical direction. It cannot change actor positions or hand/prop ownership. A handful of Canvas rectangles paint facial changes over the same transformed head; no facial animation frames or new caches/timers are allocated. Sleeping or fallen characters remain silent with closed eyes. Story restraints are owned by the scene; the gameplay rig's default cuffs are suppressed for precise cinematic actors.

The fused-boss demonstration shares warning, claw motion, contact point, dust and crown opening on normalized shot time. `demonClawSocket` evaluates the same arm transform as the painter. BYTE's fused face sits over the heart, after the separate actor has dissolved. Reading idle keeps plot time at 1; it never restarts the claw strike or any transfer/death.

`test_v23_learning.cjs` covers all 268 items through physical sentries with no combat mobs, real shrine/terminal/exit gates, multiple rounds, rewards, save/resume, revised-question migration and every boss exclusion. `test_story_curriculum.cjs` combines all 268 trail answers with all 48 BYTE checks and Python challenge completions in the full campaign. `test_v23_animation.cjs` checks acting and final attack ordering; the existing dense tests sample all 81 pages and the interactive prison. See `V23_VALIDATION.md` for review evidence and limitations.


## v24: a single character painter

`07-face-art.js` draws a complete head, including mood, blink and speech. It is shared by `paintStoneborn`, `paintAlly`, BYTE's cached lesson frames and the articulated head. Facial expressions do not erase rectangles over another face. Hair styles and player colors remain configurable.

`07-character-rig.js` owns limbs, palm orientation, fixed-length joint solving, role-specific rest offsets, fallen settling and attached equipment. Hand targets are applied after rest offsets. The same final pose supplies painting and all interaction sockets. Expressions, rotated bodies and physical interactions use the precise path; routine gameplay retains the bounded 80-frame cache. No animation adds timers or dependencies.

Full portraits call this same rig. The body painters draw only static torso textures; they no longer add a second set of limbs or independently translate the torso. Compatibility party frames initialize after the rig, avoiding initialization-order recursion. Cloth curves are local to the existing hand/shoulder ownership timeline.

Run `npm test` for behavior and motion checks. The optional native Canvas review scripts render actual artwork, all 81 pages, and action sequences. Native render timings are not browser/device benchmarks.

The player animator integrates its gait phase each update. Do not derive phase from total time multiplied by current velocity: changing velocity changes that entire product and causes animation snaps. Keep visual cadence independent of physics.

## v25: shared original music score

`app/music-score.js` contains 35 original compositions and a shared Web Audio player. The build includes that implementation in the Story engine bundle; the chooser and standalone IDE load it directly, without importing any game systems. Each track defines melody, harmony, tempo and instrumentation. The pure `events()` arranger supplies a 128-step, 16-bar score. The scheduler wakes every 40 ms, schedules only 120 ms ahead, skips missed beats after a stalled callback, caps work per callback and retains at most 40 music voices. Filtered pulse leads, triangular bass, harmonic pads and a single reused 0.2-second percussion buffer require no music file downloads.

`04-audio.js` owns Story routing and shares the existing AudioContext with SFX/voices. Modal controls select quieter lesson, question or cinematic tracks; world and boss routes return on closure. Aster, Veyr and the Fused Crown have separate combat scores. `app/page-music.js` owns one context for the chooser or standalone IDE and creates nothing in embedded frames. Web Audio starts after a user gesture, never on a fresh page load. Hidden/pagehide states disconnect music sources and suspend the context; page return resumes the selected score. The only new sessionStorage item is the on/off music preference, not student data. Audio allocation failure leaves gameplay and coding usable.

The exact supplied PNGs are `app/assets/modes/story-logo.png` (human) and `lab-logo.png` (robot). The mode cards use intrinsic dimensions and contained, pixelated rendering with responsive height. Gameplay and cinematic character art are unchanged.

## v26 offline lifecycle and mobile layout

Worker installation only activates the worker. `app/offline-session.js` observes the actual registration through `app/offline.js`, then requests one resumable `bitbound:cache-offline` job. It never waits for, or starts, a Python interpreter. The standalone Lab starts its own interpreter; Story starts one when its coding workspace is opened.

The worker verifies every offline file against `offline-manifest.json` before writing its ready marker. A mismatched homepage can no longer reject the worker installation or leave `navigator.serviceWorker.ready` pending forever. Retry re-registers, observes the newest worker, repairs invalid cached assets and resumes the pack. Manifest mismatches are not persisted. Downloads have a body-inclusive timeout and two consumers; the 10 MB runtime is reused rather than hashed again on every completed-pack visit. Online asset delivery survives blocked Cache Storage or quota errors.

Application caches use `bitbound-app:<scope-path>:<version>`. Activation never deletes packs. Successful verification may prune older caches for this scope, keeping one previous scoped release. Fallback code must match the requested module revision. Unscoped legacy caches are left untouched and never revived, so old automatic-student-storage code cannot reappear. Python/editor caches remain versioned, keyed by full URLs.

`mobile-refinements.css` is loaded last by all three entries. It contains the current responsive adjustments without altering story scenes, rigs or physics. `cycleWeaponTouch` invokes the same existing cycle action as Q. Field Guide retains pause, skills and explicit save controls. Offline details can be minimized and are hidden during active touch gameplay. Layout uses CSS media queries and safe-area insets; no resize polling or new render loop was added.

After any file edit, run `python scripts/build.py`, `python scripts/check_offline_pack.py`, and the relevant tests. The offline manifest hashes exact bytes; `.gitattributes` disables Git line-ending conversion. `python scripts/check_offline_pack.py --url https://host/repository/` verifies what students actually receive after deployment.
