# BITBOUND v25 — Music and mode logos

This update adds original synthesized music and the two supplied mode logos. The story text, character designs/animation, world layouts, combat rules, curriculum, and manual save behavior retain v24 content.

## Music

35 original themes: eight world scores, ten boss scores, and 17 section/cinematic scores. Boss arrangements use faster tempos, driving bass, drums, harmonic accompaniment and different melodies. World/section music is quieter, with longer sustained notes. Each score develops across 16 bars.

| World | Exploration music | Boss music |
|---|---|---|
| 1: STONEWAKE VALLEY | Stonewake Morning | Break the Warden’s Chains |
| 2: THORNVEIL FOREST | Under Thornveil Leaves | Roots around the Colossus |
| 3: EMBERGLOW CAVERNS | Emberglass Reflections | Brass and Burning Glass |
| 4: OATHFORGE KEEP | Oathforge Procession | The Castellan’s Broken Oath |
| 5: IRONQUEUE CATACOMBS | Ironqueue Echoes | No Chain Can Hold |
| 6: VEYRFALL • CASTLE APPROACH | Across the Broken Drawbridge | Revenant at the Red Gate |
| 7: VEYRFALL • INNER KEEP | The House of Returning Steps | The Sentinel Answers Twice |
| 8: VEYRFALL • THRONE HALL | The Hall Beneath the Crown | Veyr, the Gilded Tyrant |

Final hall extras: **Aster, the Oath Forsaken**, then **Stone against the Fused Crown** after BYTE fuses with Veyr.

| Section | Theme |
|---|---|
| Studio | A Spark from the Guild |
| Choose | Two Roads, One Beginning |
| Setup | An Explorer Takes Shape |
| Lab | Quiet Keys |
| Practice | One Thought at a Time |
| Lesson | A Guide with Answers |
| Encounter | Runes in the Grass |
| Origin | The Stone Opens Its Eyes |
| Camp | A Fifth Bowl by the Fire |
| Prison | Iron and a Small Ember |
| Betrayal | The Empty Place at the Fire |
| Escape | No Cage Is a Conclusion |
| Rivals | Four Claims to One Crown |
| Barrier | The Crown’s Last Seal |
| Fusion | A Name Inside the Crown |
| Ending | Beyond the Last Mountain |
| Defeat | Another Attempt, Another Dawn |

Music becomes audible after a tap, click or keypress; browsers prevent sound from automatically starting on a fresh visit. Music buttons are available in the chooser, IDE, gameplay and story dialogs. The music preference carries between modes in the same tab. It stores no student work. SFX/character voices retain their own switch. Dialogue lowers background music. Embedded story challenges use the parent's score, avoiding two tracks at once.

Hidden tabs and page navigation stop scheduling and suspend audio; returning resumes the selected track. Music uses one small shared percussion buffer and a bounded 40-voice scheduler, with no streamed audio, extra service, or runtime dependency.

## Mode logos

Story Mode uses the supplied human explorer. Python Lab uses the supplied robot. Both original PNGs are included without image edits; their full aspect ratio is retained. Mode cards remain a two-column desktop layout and a single-column layout at small widths.

## Verification and production limits

`npm test` passes: all 48 Python solutions/180 Python test cases, 268 world-specific encounter questions and progression gates, story/combat/animation regression checks, touch input handling, manual save/load isolation, worker/IDE behavior, offline caching/update hashes, mode routing, and audio lifecycle checks. The new audio tests exercise every score over a simulated audio clock, stale callbacks, repeated transitions, mute/resume, source cleanup, unavailable audio, and allocation failure. These are automated tests; they do not measure actual speaker output, hardware frame rate, temperature or mobile-browser layout.

The supplied assets' dimensions, references, responsive CSS and offline inclusion were checked. A live visual browser run was attempted, but the cloud browser policy blocked both the local app URL and local file URL. No real iPhone, Android, Safari, Firefox or laptop hardware run was completed in this environment. Universal device compatibility or freedom from overheating is therefore not certified. Before publishing to a class, run the extracted build on the intended HTTPS address and check it on the actual school devices, including first-tap sound, mute, rotation, touch controls, Python Run, save/load and airplane-mode reload after Offline ready.

## Open and publish

Extract the entire ZIP. On Windows, run `START_WINDOWS.bat`; the included instructions cover running a local HTTP server on other computers. Double-clicking an HTML file is insufficient for Python workers and modules. For students on phones/tablets, publish the extracted folder through HTTPS and send that site URL. Wait for Offline ready before disconnecting; student progress still requires Save file.
