# v24 character and animation update

Characters now share complete human heads and one body rig across story, gameplay and portraits. Hand gestures, cloth and settled fall poses use the same physical sockets as story props.

# v23 update

Allies now fight alongside you until the betrayal. Aster protects and strikes,
Mira casts, Rook attacks with his axe, and Fern heals or attacks. Rune-marked mobs
add 268 prerequisite-ordered, world-specific reading/reasoning questions without moving any shrine.
A rune encounter pauses the world and requires up to four correct answers before returning.
Fixed lesson sentries before the four shrines cover every unfinished question.
Each shrine requires its teaching stage; terminals and exits require all world lessons.
Retry freely, or use Show a clue. They never interrupt bosses.

The prison reveal makes BYTE openly hostile. The final company confrontation
uses synchronized strikes, spell travel, recoil, individual falls and Aster’s
power absorption. The teacher answer key is supplied as a separate offline HTML
file; its copy buttons provide each coding challenge’s exact solution.

# The Stoneborn Oath

The playable campaign has eight worlds and all 48 existing Python challenges. Python Lab remains a separate, immediate free-code mode. Select Story Mode, design your explorer and choose New Expedition to watch the rock-born opening before gameplay.

## Play and save

Move with A/D or the phone joystick. Space / Jump supports a second jump; Shift / Dash dodges. J / Attack uses your weapon, Q / the weapon slot cycles gear, K / Skill casts your equipped concept. E / Use talks, unlocks cages and activates shrines, terminals and portals. C opens the Field Guide.

Story scenes pause gameplay. Next advances the narrative; Pause animation freezes the illustration without skipping it. Sound controls BYTE’s voice, the four distinct party voices and other effects. Reduced-motion and eco modes use still pictures. On small screens the panel scrolls; in short landscape view the picture sits beside the text.

Use **Save file** before closing, reloading, switching modes or handing the device to another student. Files include completed questions, inventory, plot flags, the current scene/page, forging progress and Python work. Load only the file you choose. App files may cache automatically for offline use; student progress does not.

## Campaign route — spoilers

| World | Story event | Boss / gate |
|---|---|---|
| 1 · Stonewake Valley | Born from stone; BYTE offers apparently helpful guidance. Meet imprisoned Aster, Mira, Rook and Fern. | Solve both terminal tasks, defeat the Chain Warden, take its key, return to the cage and use it. Rescue is required before the portal. |
| 2 · Thornveil Forest | The Dawn Company welcomes you beside its fire. | Vault Colossus; companions support combat. |
| 3 · Emberglow Caverns | Mutual rescues make the company feel like family. | Brass Watcher; hints of the treasury appear. |
| 4 · Oathforge Keep | Defeat the Castellan, then meet the company at the portal. The toast is poisoned. | Oathforge Castellan, betrayal and an interactive prison escape. |
| 5 · Ironqueue Catacombs | The scroll reveals the company’s destination. BYTE is furious you escaped. | Iron Gaoler. |
| 6 · Veyrfall: Castle Approach | Original mountains and ruined watchtowers surround the outer castle. Repair the linked route across its approach. | Chain Revenant; enter the outer gate. |
| 7 · Veyrfall: Inner Keep | Explore the vaulted interior; a wall inscription recalls the stoneborn prophecy. No outdoor backdrop is drawn. | Echo Sentinel; open the throne passage. |
| 8 · Veyrfall: Throne Hall | The company turns on itself over the Demon Lord’s power. Only Aster survives. | q47 DFS → Fallen Paladin → q48 BFS barrier → Veyr → BYTE fusion → immortal ending. |

The Dawn Company has four detailed, cached NPC designs. Aster the Paladin briefly protects the player while attacking; Mira the Mage fires spells; Rook the Berserker swings his axe at close range; Fern the Healer restores one missing heart every twelve active seconds. Their shared-road scenes establish the bond before the betrayal. Combat support stops when the party betrays you.

The prison cannot be escaped by advancing dialogue alone. Read the discarded scroll, inspect the dagger hidden in your boot, then use the forge in order: **Heat the blade → Hammer the notches → Quench in water**. Wrong actions give a hint and preserve your work. The dagger leaves the weapon inventory because it is now a key. Turn the key, retrieve the rest of your pack and continue.

BYTE’s teaching examples and correctness checks remain genuine. His motives change the framing and reactions, not the Python rules. Reading a lesson never awards a completed question. Only the Python test result does. Each shrine grants one concept XP, in addition to existing combat and milestone rewards.

## Boss tactics

The eight regional HP targets are 18, 24, 30, 38, 44, 50, 58 and 66. Aster has 44 HP; the fused crown has 70 HP. Every special has at least a 0.78-second warning and a 1.05-second recovery. Learn each boss’s marks, jump ground waves, dash out of marked columns and use ranged weapons when closing in is unsafe. Hits have a brief guard interval; late bosses cap a single hit at two damage.

After Aster falls, his crown unlocks the Graph Trident and gives a brief overclock boost. The last barrier requires implementing breadth-first search, including unreachable and start-equals-goal cases. It is the existing q48 Python challenge, not a dialogue answer.

Veyr fuses with BYTE at 35% HP. The fused boss uses rotating ring, descent, rush and blade attacks. Its pale shield blocks attacks outside recovery; **CROWN OPEN — STRIKE!** and a gold outline identify the damage window. Losing retries the current fight at full boss HP with fresh player health and three seconds of protection. It does not require repeating the paladin or completed questions.

## Source map

- `adventure/story.json`: chapter names, goals, dialogue and scene page data.
- `adventure/tutorials.json`: 48 teaching introductions and BYTE’s reactions; code examples/checks remain separate fields.
- `adventure/systems/07-biome-art.js`: original regional landscapes; no photo downloads.
- `adventure/systems/07-player-art.js`: detailed customizable explorer and bounded pose cache.
- `adventure/systems/07-story-cinematics.js`: authored lenses, reactions, physical prison actions and crown fusion; pure staged drawing with no plot mutation.
- `adventure/systems/07-story-interactions.js`: cloak, sleeve, ribbon, greeting and gift ownership tied to the shared hand rig.
- `adventure/systems/07-story-choreography.js`: per-page actions, props and animated recollections; no plot mutations.
- `adventure/systems/11-pet-support.js`: timed support effects and concise pet HUD status.
- `adventure/systems/10-encounters.js`: capped spawning and local enemy state machines.
- `adventure/systems/07-weapon-art.js` and `07-skill-art.js`: fixed equipment/sigil atlases and short launch effects.
- `adventure/systems/07-party-art.js`: four role designs, a bounded lazy atlas, expressive poses and normal/elite equipment.
- `adventure/systems/07-castle-art.js`: cached trail/castle architecture, exterior facade and shared magical barrier.
- `adventure/systems/07-story-art.js`: explicit shot/cast contracts, boss sprites, ordered entrances, action staging and castle collapse.
- `adventure/mentor-voice.js`: five deterministic synthetic voice profiles and the shared playback lifecycle.
- `adventure/systems/14-story.js`: plot defaults/validation, explicit scene transitions, rescue, prison, objective routing and four bounded companion actors.
- `adventure/systems/12-story-combat.js`: final encounter profiles and gates. General collisions, damage and attacks remain in `12-combat.js`.
- `09-persistence.js`: includes validated plot state in manual snapshots. Legacy files infer completed prior story beats when loaded.
- `story.html` and `adventure/story-controls.css`: one responsive scene dialog, using the existing pause and manual-file systems.

Each of the 81 story pages has an authored location, camera and duration (6.5–14 seconds). Shots run at up to 20 FPS through one cancellable drawing timer. Plot events finish once; then only gentle breathing, blinking and environmental motion continue at 8 FPS while the reader takes their time. Pause keeps the current frame; hidden pages suspend both drawing and voice. Reduced-motion mode begins with a still. Action sound cues use the same phase timings as physical contact.

All five voices share the audio engine; only one dialogue source can play at a time. Each lazily cached 4.8-second mono buffer uses about 414 KiB, for at most 2.02 MiB across five voices. Party actors and their attack cadence are fixed; projectiles use the existing 140-item cap. The new cinematic director adds no timers or downloaded assets. Source modules are bundled to avoid extra serial requests.

The eight question paths are authored in `encounter-questions.json`, each with four stages and explicit world context. Sequence is fixed even when creature types or positions vary. Finishing an answer and selecting Back to the trail records that lesson; wrong answers leave it pending. Loading an older save fills the earliest unfinished lesson. A completed world reviews from its first lesson, in order. Boss fights and other dialogs still prevent a new rune encounter.

## Verification

`npm test` includes all 48 reference solutions and 180 cases in both native and shipped WebAssembly Python. The campaign integration test covers all lessons, rescue, betrayal, forging, paladin/barrier/fusion order and 48/48 completion. `test_stoneborn.cjs` checks mid-scene and prison saves, invalid file fields, animation cancellation, ally bounds, boss warning/recovery windows, shield rules and final-phase retries.

`test_story_presentation.cjs` checks opening cast, roles, ordered entrance, sprite/cache bounds, voice differentiation and cleanup, finite scene playback and delayed audio cancellation.

Scene art is rendered with a native Canvas implementation for inspection. The game tests use a DOM/Canvas harness; they are not substitutes for physical phone/browser playtesting. Performance depends on the device and browser. Offline reopening requires completing the initial online cache download and retaining the browser’s cached app files.
