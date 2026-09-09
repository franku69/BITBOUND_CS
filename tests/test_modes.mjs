/** Entry routing and module ownership checks; no browser or visual layout assertions. */
import {readFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const read=file=>readFile(new URL(file,root),'utf8');
const [home,lab,story]=await Promise.all(['index.html','app/lab.html','story.html'].map(read));
assert.match(home,/<a id="labModeLink"[^>]+href="app\/lab.html"/);
assert.match(home,/<a id="storyModeLink"[^>]+href="story.html"/);
assert.doesNotMatch(home,/<canvas|<iframe|startScreen|pythonLabBtn/);
assert.doesNotMatch(lab,/<canvas|<iframe|location\.replace|adventure\/(?:game|engine)\.js/);
assert.match(lab,/<a id="chooseModeLink"[^>]+href="\.\.\/index.html"/);
assert.match(lab,/<body class="free-workspace">/);
assert.match(story,/<section id="startScreen" class="overlay show start-bg">/);
assert.doesNotMatch(story,/pythonLabBtn|python-lab-launcher/);
assert.match(story,/<section id="puzzleOverlay" hidden/);
assert.ok((story.match(/class="mode-return" href="index.html"/g)||[]).length>=4);
// Follow module imports to catch accidental story-engine dependencies in the lab/chooser.
async function dependencies(entry,seen=new Set()){
 const url=new URL(entry,root);if(seen.has(url.href))return seen;
 seen.add(url.href);const source=await readFile(url,'utf8');
 for(const match of source.matchAll(/\b(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)){
  if(match[1].startsWith('.'))await dependencies(new URL(match[1],url).href,seen);
 }
 return seen;
}
for(const entry of ['app/mode-select.js','app/main.js']){
 const files=await dependencies(entry);
 for(const url of files){await access(new URL(url));assert.ok(!url.includes('/adventure/'),`${entry} must not import the story engine`);}
 if(entry==='app/mode-select.js')assert.ok(![...files].some(url=>/\/(?:runner|editor|main)\.js$/.test(url)),'chooser does not create an editor or Python worker');
}
assert.match(await read('app/workspace.html'),/url=lab.html/);
assert.match(await read('adventure/index.html'),/url=\.\.\/index.html/);
console.log('PASS modes: chooser links, standalone IDE, story setup, removed launcher, return paths and separate module dependencies.');
