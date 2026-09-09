# BITBOUND Python Practice — teacher guide

Choose **Python Lab Mode** during a coding discussion, or **Story Mode** for Byte's guided adventure. Each new visit begins with a fresh session. The centered character creator, 48 story missions and mobile joystick remain.

## Shared devices and manual files

1. Open either mode and start fresh, or deliberately choose **Load file** and select your own JSON save.
2. The optional Story nickname helps identify the downloaded file. Python Lab's progress dialog also has a student name field.
3. Use **Save file** before leaving. In the lab it is in the top toolbar. In the story it is in Help, Field Guide, chapter introductions, the completion screen and challenge headers.
4. Check Downloads and keep the latest JSON file. A Story file includes the adventure checkpoint and Python work. **Save .py** alone only downloads the selected code file.
5. Before handing a device to another student, choose **New player**. It asks before discarding the session, then reloads fresh. An already-open tab remains the current student's session until reset or closed.

No student work is automatically written to browser storage or read from older browser saves. Edits and completed lessons remain in memory until an explicit file download. New player does not delete existing files in Downloads; students should manage their copies on shared devices. There are no accounts or identity checks on a selected save file.

Use Story Mode to restore a Story checkpoint. Python Lab can open its Python portion without starting the game, then preserve that attached checkpoint when saving again. Lab-only files belong in Python Lab. Earlier explicit Python progress exports remain loadable. Invalid or oversized files are rejected before replacing a session; replacing unsaved work asks for confirmation.

Save before switching modes, reloading or closing the page. A browser leave warning is requested for changed sessions, but mobile browsers may skip it. Discarded unsaved work cannot be recovered. Checkpoints restore progress and inventory at a safe point, not exact enemy positions or partially damaged bosses.

## Byte and the story

A curious warrior born from stone follows BYTE through eight regions. Each region has six Python concepts, guided examples and a guardian. The story includes an adventurer company, betrayal and a final confrontation; see STORY_MODE.md for the spoiler guide. BYTE’s motives are suspicious, but his Python teaching and checks remain correct. Mistakes are repairable and hints are welcome.

Follow the gold marker to Byte and press **Use** or **E**. Byte now stands about one head taller than the explorer. While his conversation window is open, he makes funny high-pitched gibberish sounds with short pauses. Use **Sound effects: on/off** inside the dialog to mute or enable effects. Closing the lesson or entering its coding challenge stops the chatter. Hidden tabs are silent; returning to an open conversation resumes it. Before each first challenge, he presents a narrative situation, a runnable Python example with output, and an understanding question. Wrong answers give feedback and allow another try. Correct answers enable Back to the trail, or Open challenge if you approached a shrine first. Click that button to continue. The example teaches the concept; students must still follow their actual challenge's inputs, output and function name. Reading a lesson does not clear a mission: only passing its Python checks does.

Conversations pause combat, have no timer and can be revisited. Byte waves, blinks, shrugs at a mistake and celebrates a correct answer. Portrait reactions stop when hidden. Dialogue audio is synthesized locally and needs no additional download. The player also breathes, blinks, looks back at the companion, waves near Byte and celebrates a passed coding mission. These cosmetic gestures do not delay movement or attacks. Reduced-motion preferences and the lowest visual profile use static poses. After defeating a guardian, talk to Byte near the portal for that chapter's closing scene.

## Curriculum

| Region | Missions | Focus |
|---|---|---|
| Python base camp | 1–6 | print, input, conversion, conditions, functions, loops |
| List caverns | 7–12 | creation, indexes, slices, append, extend, count, index |
| List workshop | 13–18 | insert, pop, remove, reverse, sort, every index and element |
| Collection forge | 19–24 | averages, tuples, dictionaries, sets, nested lists, filtering |
| Algorithm citadel | 25–30 | stacks, deque queues, brackets, linear/binary search, selection sort |
| Linked pathways | 31–36 | nodes, traversal, length, prepend, append, find, pointer reversal |
| Recursion tower | 37–42 | factorial, indexed sum, memoization, GCD, merge, merge sort |
| Trees and graphs | 43–48 | inorder, height, adjacency lists, BFS, DFS, unweighted shortest distance |

Each chapter has four shrine missions and two terminal missions. All 48 are also selectable from Practice inside Python Lab. Free coding supports other core Python examples; these exercises are not an exhaustive syllabus.

## Phone controls and the IDE

Touch devices show a left movement joystick and right-side Jump, Attack, Dash, Power, Drop and Use buttons. Different fingers can move and act simultaneously. Jump twice for the existing double jump. Controls reset and hide for dialogs; keyboard controls continue to work.

For free coding, choose Python Lab and type your program. In a function challenge, keep the supplied function name and replace pass. Supply input() answers in Program input, one per line. Run executes main.py; use print() to inspect function results. Check challenge runs the mission cases. Trace shows bounded line events with variable state before each line executes. Stop terminates a stuck worker; the next run then needs a new interpreter.

The editor provides colors, line numbers, bracket matching, indentation, undo/redo, search, basic suggestions and touch punctuation controls. Each workspace permits up to eight Python files of 60 KB each. Add helpers.py and import it from main.py. Core modules such as collections work; package installation, desktop GUIs and an operating-system shell are outside this lab's scope.

## Opening and offline use

For a local PC, extract the ZIP and run START_WINDOWS.bat with Python 3, or python3 scripts/serve.py on macOS/Linux. Keep the server window open and use its printed address. Blocked or occupied ports are retried. Do not open index.html directly.

For independent access, share the GitHub Pages website link. Keep it open online until **Offline ready · app files cached · progress saves manually** appears. This downloads approximately 15 MB of application assets, including Python; it does not save student work. The same address and browser can then reopen offline while those assets remain cached. Private browsing, clearing site data or browser eviction can remove the pack. Keep downloaded student saves separately.

Local Wi-Fi use is available through python scripts/serve.py --lan and the PC's LAN address if the network permits it. Plain HTTP LAN addresses cannot provide service-worker offline caching on phones; use the HTTPS website for independent offline use.

## Performance and records

Python initialization is reused within a mode, output streams during execution, and rendering sleeps while coding or hidden. Terrain caching, bounded stores and adaptive visual quality remain. First download/startup still takes time; very large Python allocations can exceed memory. Actual hardware and browser behavior vary.

Reports contain passing code, attempts and solution views for the current or explicitly loaded session. These are editable practice records, not proof of authorship. Ask students to explain and modify their code. Automated checks cover all 48 solutions and tutorials, manual save/load isolation, animation cancellation, touch controls, progression, runtime behavior and offline caching. They do not replace classroom testing on your actual phones and computers.


## Studio opening and expanded Story combat (v13)

The USTP Game Dev Guild opening card precedes the mode chooser. It disappears after 1.8 seconds, or students can press Continue immediately. Python Lab remains independent of the story engine. Offline readiness is still reported separately; the studio card is not a download meter.

Students can choose from 21 combat skills in Field Guide (C or slot 4), under Equipped skill. K or the Skill touch button activates the equipped skill. Changing skills starts a cooldown while preserving their earned skill level. Combat names are playful references, not simulations of the underlying algorithms.

Four redesigned companions animate during play. Nine enemy types become available gradually across the eight regions, with a strict population cap. Six new weapons expand the inventory to 20; Q or the weapon slot cycles collected weapons. Details and drop sources are in README.md. The SFX toggle controls new creature, weapon and movement sounds along with Byte's existing optional dialogue chatter. Audio remains silent in Python Lab.

Students still need to complete the same 48 Python missions. Save file is still explicit; all new inventory/skill choices and mob drop counters travel with a manually downloaded Story file.


## Complete trail curriculum (v23)

Rune creatures open a separate question battle when approached or struck. Each set has up to four questions from one teaching stage. Students must answer each correctly before returning to the trail; retries cost no health. Show a clue explains the idea. Tap an answer on phones, or use A/B/C on a keyboard. The game pauses completely while students read. The title shows the encounter ID for quick lookup in the separate teacher key.

There are 268 world-specific questions alongside the original 48 coding tasks. Rune questions do not clear shrines or change their positions. Each world has four ordered learning stages. Its next unfinished lesson is required; review repeats the same order after completion. Boss combat, the final arena and other dialogs cannot be interrupted. Rune progress travels only in a manually saved student file.

The battle illustration finishes in under a second and leaves no repeating draw timer. Story actions play once, then subtle reading idle runs at 8 FPS while visible. Pause/Resume preserves the current instant. Reduced-motion preferences show a still. See V21_VALIDATION.md for automated and visual review coverage and its device-testing limits.

### Completion is now enforced

Each world has four fixed lesson sentries, one before each shrine. Press E / Use at a sentry to take the next unfinished set. A shrine cannot open until its teaching stage is complete; the terminal and portal require every lesson in that world. Roaming mobs and sentries share the same completion records, so students do not repeat answered questions while any unfinished question remains. This path works without random spawns or combat kills.

Mission GPS shows **TRAIL LESSONS completed / total**. The battle panel shows the current round, lesson number and world. **Next question** commits a correct answer and opens the next round; **Back to the trail** appears for the final round. The explicit **Save file** button keeps already completed rounds; an unanswered round is presented again after loading. Each whole set gives at most one heal and one skill XP, without multiplying combat rewards per question.

World totals are **40, 32, 32, 32, 32, 32, 32, 36**: 268 trail questions, in addition to 48 Python coding challenges and their BYTE checks. Allow multiple class sessions and use manual files to continue. The separate v23 teacher key follows this exact sequence.

All 32 World 4 items are applied exercises. Students trace loops and aliases, debug dictionary and set operations, reason about tuple keys, repair default arguments and class state, and handle exceptions/files. Imported older World 4 saves keep story flags, equipment and shrines; their replaced elementary answers do not mark the new applied lessons complete. Importing an already later-world save does not move the student backward.
