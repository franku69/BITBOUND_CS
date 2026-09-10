/** Behavioral contracts for the extracted models, independent of browser globals. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createCampaignState, createPlayerState} from '../adventure/domain/campaign-state.js';
import {createLearningPath} from '../adventure/domain/learning-path.js';
import {newPlot, validatePlot} from '../adventure/domain/plot-state.js';
import {Message, isPeerMessage} from '../shared/protocol.js';
import {createCatalog} from '../app/lab/catalog.js';

const readJSON = async file => JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'));
const {items: questions} = await readJSON('../adventure/encounter-questions.json');
const story = await readJSON('../adventure/story.json');
const curriculum = await readJSON('../app/curriculum.json');

const first = createCampaignState({worldCount: 8, defaultPetId: 'index_fox'});
const second = createCampaignState({worldCount: 8, defaultPetId: 'index_fox'});
first.solved[0][0] = true;
first.weapons.push('byte_dagger');
first.encounterRead.test = true;
first.keys.a = true;
assert.equal(second.solved[0][0], false);
assert.equal(first.solved[1][0], false, 'world rows must not share the same array');
assert.deepEqual(second.weapons, ['data_blade']);
assert.deepEqual(second.encounterRead, {});
assert.equal(second.keys.a, undefined);
assert.deepEqual(createPlayerState({maxHealth: 5, airJumps: 1}), {
  x:120, y:0, w:24, h:44, vx:0, vy:0, dir:1, onGround:false, health:5,
  invuln:0, attack:0, attackCd:0, runFrame:0, runClock:0, airJumps:1,
  dashCd:0, dashTime:0, dashDir:1, dropTimer:0
});

const path = createLearningPath(questions, 8);
// Compare the public model to the accepted v26 ordering rules across partial saves.
for (let world = 0; world < 8; world++) {
  const ordered = questions.filter(q => q.world === world).sort((a,b) => a.sequence-b.sequence);
  for (let pattern = 0; pattern < 12; pattern++) {
    const read = Object.fromEntries(ordered.filter((_,i) => (i+pattern)%5 < pattern%5).map(q => [q.id,true]));
    for (let stage = 1; stage <= 4; stage++) {
      const stageItems = ordered.filter(q => q.stage <= stage);
      const unfinished = stageItems.filter(q => !read[q.id]);
      assert.deepEqual(path.progress(world,read,stage), {
        done:stageItems.length-unfinished.length, total:stageItems.length,
        remaining:unfinished.length, next:unfinished[0] || null
      });
      const expected = unfinished[0] ? ordered.filter(q => q.stage===unfinished[0].stage && !read[q.id]).slice(0,4) : [];
      assert.deepEqual(path.lessonSet(world,read,stage), expected);
    }
    const allRead = Object.fromEntries(ordered.map(q=>[q.id,true]));
    assert.equal(path.nextQuestion(world,read), ordered.find(q=>!read[q.id]) || ordered[0]);
    assert.equal(path.nextQuestion(world,allRead,ordered.length+2), ordered[2]);
  }
}
assert.throws(()=>createLearningPath([...questions,questions[0]],8),/Duplicate/);
assert.throws(()=>createLearningPath([{id:'bad',world:8}],8),/Invalid world/);

const plot = newPlot();
const saved = {level:0,bossDefeated:Array(8).fill(false),assessmentPassed:Array(8).fill(false)};
assert.deepEqual(validatePlot(plot,saved,story.scenes),plot);
plot.scene = 'origin'; plot.scenePage = 1000;
assert.equal(validatePlot(plot,saved,story.scenes),null);
assert.equal(validatePlot({...newPlot(),finalPhase:'unknown'},saved,story.scenes),null);
assert.equal(validatePlot(null,{...saved,level:5},story.scenes).escaped,true);
assert.equal(newPlot().camps[0],false);

const peer = {};
const event = {source:peer,origin:'https://class.example',data:{type:Message.OPEN}};
assert.equal(isPeerMessage(event,peer,event.origin),true);
for (const invalid of [
  {...event,source:{}}, {...event,origin:'https://other.example'},
  {...event,data:null}, {...event,data:[]}, {...event,data:{type:'unknown'}}
]) assert.equal(isPeerMessage(invalid,peer,event.origin),false);

const catalog = createCatalog(curriculum);
assert.equal(catalog.byId.size,48);
assert.equal(catalog.chapterItems.size,8);
assert.equal([...catalog.chapterItems.values()].flat().length,48);
assert.equal(catalog.byId.get('q01'),curriculum.items[0]);
assert.throws(()=>createCatalog({...curriculum,items:[...curriculum.items,curriculum.items[0]]}),/Duplicate mission/);
console.log('PASS domains: independent sessions, all-world ordering equivalence, four-round sets, plot migration, protocol identity and indexed catalog.');
