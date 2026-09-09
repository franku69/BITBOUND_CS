# BITBOUND — Python Practice 

Choose **Python Lab Mode** for the full-page IDE or **Story Mode** for a solo Python adventure with 48 missions across eight regions. Both modes start fresh on every new visit.

##

- Rebuilt human faces with compact features, distinct hair and restrained speech expressions.
- Shared character rig for story, gameplay, portraits and appearance previews; removed duplicate static body drawings.
- Natural elbow direction, hand shapes, role-specific resting gestures and tighter walking arm swings.
- Fallen characters settle onto their side; the cloak bends and drapes between its actual attachment points.
- Reviewed every story page and retained the complete 268-question world curriculum, 48 coding challenges, manual saves and offline support.

See [v24 animation review and validation](docs/V24_VALIDATION.md). Extract into a **new folder** and run `START_WINDOWS.bat`. For GitHub Pages, replace the full project files together so the new cache manifest matches the scripts.

## 

- **Every trail lesson is required.** Mob encounters contain up to four unfinished questions from the current teaching stage. A fixed lesson sentry before each shrine supplies anything missed. The shrine requires its stage; the terminal and world exit require the whole world. This works even if no roaming creatures remain.
- **Visible progress.** Mission GPS shows trail lessons completed and the next stage. The question panel shows round and world totals. Wrong answers give an explanation and do not advance or cost health. Save file is available during a question set.
- **World 4 applies earlier learning.** All 32 Oathforge questions now involve tracing, debugging or choosing an implementation using sets, dictionaries, tuples, functions, generators, classes, exceptions and files. No beginner print/input recall appears in that world. Importing an older World 4 save keeps shrines and equipment but reopens these revised lessons.
- **Story performance.** All 81 pages use speech shapes, listening glances, blinking and quiet sleeping/fallen characters. Clothing continues gentle motion while reading. Prison restraints have one owner and release before forging. BYTE's face responds to the scene, and the fused face appears over Veyr's heart. The final demonstration has an actual warning, claw impact and exposed-crown recovery with effects attached to the claw.
- **Complete teacher key.** The separate `BITBOUND_v23_Answer_Key.html` contains all 48 Python solutions, 48 BYTE checks and 268 trail answers in teaching order. Keep it separate from student distribution.

See [v23 verification and review notes](docs/V23_VALIDATION.md). Extract into a fresh folder and run `START_WINDOWS.bat`, or run `python3 scripts/serve.py`. For a deployed copy, replace the whole site contents so entry files and cache hashes stay together.

## The Stoneborn Oath

An 81-page, player-paced adventure follows the stoneborn from their first morning alive to the fall of the Demon Lord’s castle. The opening contains only the player and BYTE. The Dawn Company is introduced when you find its cage.

- **Four distinct adventurers:** Aster the Paladin, Mira the Mage, Rook the Berserker and Fern the Healer. Detailed 64 × 96 pixel portraits include walking, expressive conversation poses, signature equipment and upgraded treasure-laden gear at the final encounter.
- **A relationship before a betrayal:** shared meals, a mended sleeve, a company ribbon and mutual rescues give the later confrontation its history. Dialogue is readable in short paragraphs; Next advances at your pace.
- **Five character voices:** BYTE and each adventurer have different original synthetic gibberish. The SFX control mutes them. Voices stop on scene closure or a hidden tab and reuse small local audio buffers.
- **A continuous castle approach:** all photo backdrops are removed. The route moves through Stonewake Valley, Thornveil Forest, Emberglow Caverns, Oathforge dungeon and Ironqueue Catacombs. World 6 approaches Veyr’s castle; world 7 is the inner keep; world 8 is the throne hall. Indoor chapters show masonry, vaults, lamps and banners, with no exterior photo or sky.
- **Staged finale:** the player walks into the hall before the richly equipped company follows. A rotating, runic barrier fractures after the real BFS solution. The ending shows the throne’s destruction, the player’s leap through the roof and the castle towers collapsing.
- **Bounded animation:** shots play once at up to 20 FPS, then use a gentle 8 FPS reading idle. Pause preserves the current frame; reduced-motion/eco modes start with stills. Scene drawings, character portraits and audio do not run the combat loop behind a dialog.

All 48 Python challenges, the Lab / Story mode choice, joystick, USTP studio intro, pets, weapons, skills and manual save files remain. Download a Save file before closing or handing the device to another student. A fresh visit starts fresh. Existing saves retain campaign flags and resume scenes at the saved page number. Older World 4 saves must complete the revised applied trail lessons; other completed answers remain.

See [Story Mode guide](docs/STORY_MODE.md) for controls, the complete route and source ownership.

## 

- Walking, running, jumping, falling, landing, dashing, attacking and casting use a shared articulated character rig. Hands hold the weapons; legs bend without stretching. Essential gameplay poses remain visible with reduced motion.
- Story scenes contain one actor per character. Duplicate draws and full-player dash afterimages are removed. The company enters the hall in a formation that keeps its spacing.
- Kneeling and sitting have bent legs and planted feet. Approaching an interaction settles into the next pose; the invitation and handshake no longer use a compressed sprite or an extra stretched arm.
- Captivity uses a fully enclosed cell, front bars and bound wrists. BYTE stays in the corridor, leaves before the scroll/forge sequence, remains absent during the escape, and returns with his snack on the following page.
- Four companion actors have movement velocity, jump over ledges, and show their actual support/combat actions. The final Paladin uses the same rig; Veyr has separately animated wings and arms.
- A bounded 80-frame body cache keeps the usual draw to one body image plus held equipment. No new runtime downloads, animation timers or automatic student saves.

See [v18 validation and review notes](docs/V18_VALIDATION.md). The build refreshes the offline asset hashes so existing installations can pick up the corrected animation bundle.

## 

- **Private company moments:** BYTE is absent from the prisoner meeting, rescue and camp interactions. His hostility is revealed at the betrayal; his allegiance to Veyr is revealed during the final fight.
- **Actions and memories:** a real gate rescue, Rook’s pan-versus-troll memory, healing and tying the ribbon, passing soup, sewing a sleeve, sharing a cloak, poison, taking the pack and leaving the player. Later memories replay these actions. Prison forging illustrates the scroll, heating, hammering, quenching and finished key. BYTE only merges with Veyr when that page reaches the actual fusion.
- **Detailed explorer:** 64 × 96 source art respects every existing skin, hairstyle, eye, clothing and accent choice. Walking, blinking, waving, reaching, bracing, kneeling and expressions share a bounded cache; collision dimensions are unchanged.
- **Useful pets:** see the table below. All four have original 48px designs, eight cached poses and a short visible ability cue. No extra animation timers.
- **Readable creatures:** nine redesigned species. Bats commit to a dive, frogs crouch before a long hop, beetles wind up their spit, moths fire paired shots, crabs lunge, crawlers rush, wisps warn before relocating and mimics wake at close range. Sight rays stop at terrain; recoveries give you time to answer an attack.
- **Equipment art:** twenty cached weapon silhouettes have material facets, wrapped grips and attack trails. Twenty-one distinct skill sigils replace the generic boxes. Damage, progression and Python checks remain separate from art.

| Companion | What it does |
|---|---|
| Index Fox | Fetches drops within 300 pixels, without changing your equipped weapon. |
| Append Slime | Heals a missing heart every 16 active seconds; retains a bonus heal after three mob defeats. |
| Slice Owl | Intercepts one hostile projectile within 110 pixels every 8 seconds; retains faster dash recovery. |
| Sort Bot | Adds a 3-second attack overclock every 12 seconds when combat is nearby, alongside its small passive speed bonus. |

New sessions and respawns use a short 3-second pet warm-up. Cooldowns stop while a lesson or story dialog pauses the game. The pet HUD tells you when an ability is ready or recovering. Pet support is transient combat state, not a student autosave.

##

- **USTP Game Dev Guild opening:** a brief, original studio card appears before Python Lab Mode / Story Mode. Continue or Escape skips it. It lasts 1.8 seconds, shortened for reduced motion, and does not wait for the Python engine or offline pack.
- **Wider Byte:** 36 × 56 world pixels beside the 24 × 44 player. His taller silhouette, lesson gestures and optional chipmunk-like dialogue chatter remain.
- **Redesigned companions:** Index Fox has a white-tipped tail and scarf; Append Slime has a little sprout; Slice Owl has feathered wings; Sort Bot has an expressive screen and articulated arms. Tail swishes, squishes, wing flaps, stepping and blinks use cached frames. Pets celebrate when their recovery restores a heart.
- **Nine mob types:** the original three are joined by Buffer Frog, Spark Moth, Moss Crab, Gear Crawler, Glitch Wisp and Null Mimic. Each region draws random encounters from an expanding pool. Hoppers, walkers and flying ranged enemies behave differently. At most 18 enemies exist per world, with at most one off-screen replacement every 18 seconds. No spawning beside shrines, Byte or the boss arena.
- **20 weapons:** six additions have distinct shapes and attack properties: Stack Mace, Spark Staff, Gear Saw, Link Lance, Recursion Prism and Graph Trident. The final three guardians now have their own rewards.
- **21 selectable skills:** open the existing **Field Guide** with C or slot 4, then use **Equipped skill**. Six additions cover Stack Guard, Queue Lance, Set Nova, Recursive Echo, Graph Star and Heap Comet. Switch freely; switching starts a cooldown and retains your skill level. Press K or tap Skill to cast.
- **More sound effects:** distinct creature voices, weapon cues, soft/heavy landings, surface footsteps and pet recovery sounds. They use the existing SFX switch and bounded audio engine, with no audio downloads.

The mode split, mobile joystick, Byte's 48 tutorial checks, manual student save files and offline application caching remain. New visits still start fresh. An already-open session stays visible until the student chooses New player or closes it.

### 

| Weapon | How to obtain it | Combat style |
|---|---|---|
| Spark Staff | Defeat two Spark Moths from world 2 onward | Twin spreading sparks |
| Stack Mace | Defeat two Moss Crabs from world 3 onward | Slow, heavy close attack |
| Gear Saw | Defeat two Gear Crawlers from world 4 onward | Fast, short-range melee |
| Link Lance | Clear 34 missions or defeat guardian 6 | Long-reach melee |
| Recursion Prism | Clear 40 missions or defeat guardian 7 | Three-projectile fan |
| Graph Trident | Clear 46 missions or defeat guardian 8 | Piercing ranged shot |

Collect dropped gear, then press Q or tap the weapon slot to cycle your inventory. Kills accumulate in the current session and in an explicitly saved file. Combat never replaces the coding requirements. Skill names are playful references; Byte's lessons explain the actual concepts.

## 

Extract the ZIP completely. On Windows with Python 3 installed, run **START_WINDOWS.bat** and leave the server window open. On macOS/Linux run **python3 scripts/serve.py**. The launcher tries another port if one is blocked or occupied. Use its printed address; do not double-click index.html.

To share with students, upload all extracted folder contents to your GitHub Pages repository and use its website link. See [deployment instructions](DEPLOY_TO_GITHUB.txt). Students do not need an account, API key, npm installation or local Python installation.

## 

In Python Lab, use the top **Save file / Load file / New player** controls. In Story Mode, these controls are in Help, Field Guide, chapter introductions, story scenes and the final screen; coding challenges also have **Save file**.

Save file requests a JSON download. Check Downloads and keep that file somewhere you can find it. A Story save includes the adventure checkpoint and Python work from that story session. Load it from Story Mode to continue. Python Lab can load the Python portion of a Story file and preserve its attached checkpoint when saving again. A Lab-only file is loaded from Python Lab Mode.

Previous browser saves are never searched or imported automatically. Earlier manually exported Python progress backups are supported. New player does not delete downloaded files. Story checkpoints retain progress and inventory, but restart at a safe point rather than preserving exact enemy positions or partially damaged bosses.

Unsaved changes are lost on reload, closure or mode changes. The app asks the browser to warn before leaving a changed session, but mobile browsers may not show that warning. Save explicitly before leaving. **Save .py** downloads one Python file; **Save file** includes all workspaces and practice records.

## 

Open the website while connected and wait for **Offline ready · app files cached · progress saves manually**. The complete pack is approximately 16 MB uncompressed. The same address and browser can then reopen offline while its cached site data remains available. The first download and Python startup take time; later runs reuse the ready interpreter within a mode.

Python runs in a worker. Terrain chunks, sprite frames and collision buckets are reused; stores are bounded. Rendering sleeps during coding and hidden tabs. Byte's brief portrait reactions use at most one timer, and his world poses use the existing game clock. Responsive dialogs and phone joystick controls remain. Very old or low-memory browsers may not support the complete WebAssembly engine; physical-device FPS and temperature are not guaranteed.

## 

Editable gameplay sources are in **adventure/systems/**. Byte's art, animation, chapter story and teaching content have separate modules/data files. Manual file parsing and controls are separate from session state and mode adapters. See [architecture](docs/ARCHITECTURE.md) and [teacher guide](docs/TEACHER_GUIDE.md).

After editing source, run **python scripts/build.py** to regenerate bundles, module revision URLs and the offline manifest. Run **npm test** for curriculum, real Python runtime, joystick, game progression, manual file isolation, animation lifetime, worker and cache regression checks. Browser UI and physical-device testing have not been performed for this update.

The bundled engine is Pyodide 0.27.7 / CPython 3.12.7 with CodeMirror 5.65.20. It supports core Python, multiple files, input, errors, trace replay and Stop; it is not a desktop shell or a complete Python package distribution. This is formative practice with visible solutions and editable records, not verified examination software. Original artwork and dependency license notices are retained.
