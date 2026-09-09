'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {buildContext}=require('./helpers/game-harness.cjs');
const h=buildContext('?quality=standard'),s=h.sandbox,api=s.TestAPI;
const book=s.BitboundQuestions.story;
// The opening's actual illustration contracts contain no party, even on BYTE's pages.
assert.ok(book.scenes.origin.pages.length>=5);
for(const page of book.scenes.origin.pages){
 assert.ok(!api.STORY_SHOTS[page.art].cast.includes('party'));
 assert.doesNotMatch(page.text,/Dawn Company|Aster|Mira|Rook|Fern|guild/i);
}
assert.deepEqual(Array.from(api.DAWN_COMPANY,a=>a.role),['Paladin','Mage','Berserker','Healer']);
for(const scene of Object.values(book.scenes))for(const page of scene.pages){
 assert.ok(api.STORY_SHOTS[page.art],page.art);
 if(page.mood)assert.ok(api.PARTY_POSES.includes(page.mood));
 if(page.art==='throne'||page.art==='reunion')assert.ok(api.STORY_SHOTS[page.art].elite);
}
// Player enters in a shot with no adventurers. The next shot starts them behind him.
assert.equal(book.scenes.rivals.pages[0].art,'arrival');assert.equal(book.scenes.rivals.pages[1].art,'reunion');
assert.ok(!api.STORY_SHOTS.arrival.cast.includes('party'));
const entry=api.storyEntrance(0);assert.ok(entry.party.every(x=>x<0));
for(const t of [.2,.4,.6,.8,1]){
 const positions=api.storyEntrance(t).party;
 assert.ok(positions.every((x,i)=>i===0||x>positions[i-1]),'walking line does not cross/stack its members');
}
assert.ok(api.storyEntrance(1).party.every(x=>x>=0&&x<300));
// Appearance tiers/poses are cached by a closed set, not unbounded arbitrary caller strings.
for(let i=0;i<4;i++)for(const elite of [false,true])for(const pose of api.PARTY_POSES){
 const first=api.partySprite(i,pose,elite);assert.equal(api.partySprite(i,pose,elite),first);assert.equal(first.width,64);assert.equal(first.height,96);
}
assert.equal(api.partyAtlas.size,4*2*16);api.partySprite(0,'arbitrary text');assert.equal(api.partyAtlas.size,128);
for(const name of ['trail','camp','cell','interior','hall'])api.getStoryBackdrop(name);
assert.ok(api.storyBackdrops.values.size<=4);
// Production world draw never samples an exterior image indoors; all old CS2C slots replaced.
assert.deepEqual(Array.from(s.BitboundGameCatalog.worldBackgrounds),['valley','forest','cavern','dungeon','catacombs','approach','interior','hall']);
assert.ok(s.BitboundGameCatalog.backgrounds.every(a=>a.procedural&&!a.src));
assert.ok(!fs.existsSync(require('node:path').join(__dirname,'../adventure/assets/eclipse_host.png')));
assert.ok(!s.BitboundGameCatalog.backgrounds.some(a=>a.id==='cs2c'));
assert.ok(book.chapters[5].region.includes('APPROACH'));assert.ok(book.chapters[6].region.includes('INNER'));assert.ok(book.chapters[7].region.includes('HALL'));
const drawing=s.document.createElement('canvas').getContext('2d'),originalDraw=drawing.drawImage;
for(const [level,kind] of [[6,'interior'],[7,'hall']]){
 const indoor=api.getStoryBackdrop(kind),sampled=[];drawing.drawImage=(image)=>sampled.push(image);
 api.state.level=level;api.drawBackground(api.worlds[level],0,0);
 assert.equal(sampled.length,1);assert.equal(sampled[0],indoor,'indoors only composites its own room');
}
drawing.drawImage=originalDraw;
// Each voice is distinct, deterministic, finite PCM, with silent loop boundaries.
const voice=s.BitboundMentorVoice,hashes=new Set();
for(const name of ['BYTE','Aster','Mira','Rook','Fern']){
 const pcm=voice.createSamples(name),pcmAgain=voice.createSamples(name);
 assert.deepEqual(pcm,pcmAgain);assert.equal(pcm.length,105840);
 assert.ok(pcm.subarray(-100).every(x=>x===0));let peak=0;for(const n of pcm){assert.ok(Number.isFinite(n));peak=Math.max(peak,Math.abs(n));}assert.ok(peak<.8);
 hashes.add(crypto.createHash('sha256').update(Buffer.from(pcm.buffer)).digest('hex'));
}
assert.equal(hashes.size,5,'different formants/pitch/rhythm, not five labels on BYTE audio');
let buffers=0,starts=0,stops=0;const live=new Set(),timers=new Map();let nextId=0;
s.setTimeout=(fn,ms)=>{const id=++nextId;timers.set(id,{fn,ms});return id;};s.clearTimeout=id=>timers.delete(id);
const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
s.AudioContext=class{
 constructor(){this.currentTime=0;this.state='running';this.destination={};}
 createGain(){return {gain:param(),connect(){},disconnect(){}};}
 createOscillator(){return {frequency:param(),connect(){},disconnect(){},start(){},stop(){}};}
 createBuffer(n,len,rate){buffers++;assert.equal(rate,22050);const pcm=new Float32Array(len);return {getChannelData:()=>pcm};}
 createBufferSource(){return {connect(){},disconnect(){},start(){starts++;live.add(this);},stop(){stops++;live.delete(this);}};}
 suspend(){this.state='suspended';return Promise.resolve();}resume(){this.state='running';return Promise.resolve();}
};
api.AudioEngine.musicEnabled=false; // Isolate character voices.
api.startNew();
const audio=api.AudioEngine;
for(const name of ['Aster','Mira','Rook','Fern','BYTE','Mira','Fern']){audio.setSpeaker(name);assert.equal(live.size,1);assert.equal(audio.dialogueSpeaker,name);}
assert.equal(buffers,5,'one reused PCM buffer per character');
const before=starts;audio.setSpeaker('Fern');assert.equal(starts,before,'same speaker pages do not restart/stack');
audio.toggleSfx();assert.equal(live.size,0);audio.toggleSfx();assert.equal(live.size,1);
s.document.hidden=true;for(const fn of h.listeners['document:visibilitychange'])fn();assert.equal(live.size,0);
s.document.hidden=false;for(const fn of h.listeners['document:visibilitychange'])fn();assert.equal(live.size,1);
audio.setSpeaker('Narrator');assert.equal(live.size,0);
// Exercise the real story button -> speaker switch, not just the audio API.
api.showPlotScene('prisoners');assert.equal(audio.dialogueSpeaker,'Fern');assert.equal(live.size,1);
assert.equal(h.elements.get('storyPortrait').hidden,false);assert.match(h.elements.get('storySpeaker').textContent,/Healer/);
api.advancePlotScene();assert.equal(live.size,0);api.advancePlotScene();assert.equal(audio.dialogueSpeaker,'Aster');assert.equal(live.size,1);
api.hide(api.plotUI.overlay);assert.equal(live.size,0);
// Active non-reduced scene has at most one drawing timer and one finite delayed cue.
api.showPlotScene('rivals');const countBefore=timers.size;assert.ok(countBefore<5);
let draws=0;while([...timers.values()].some(v=>v.ms===50)&&draws<200){const [id,task]=[...timers].find(([,v])=>v.ms===50);timers.delete(id);task.fn();draws++;}
assert.ok(draws>60&&draws<=Math.ceil(api.storyDuration('arrival',s.BitboundQuestions.story.scenes.rivals.pages[0])/50),'authored shot duration finishes once');
assert.ok(![...timers.values()].some(v=>v.ms===50),'the full-rate action timer ends before reading idle');
api.showPlotScene('ending');api.plotState().scenePage=4;api.showPlotScene('ending',true);assert.ok([...timers.values()].some(v=>v.ms===50),'destruction plays on the shared finite animation clock');
api.stopStoryAnimation();assert.ok(![...timers.values()].some(v=>v.ms===50||v.ms===125||v.ms===1900),'Stop cancels playback and its frame-synchronized cues');
for(const fn of h.listeners.pagehide)fn();assert.equal(live.size,0);assert.equal(starts,stops);
console.log('PASS v16 presentation: spoiler-free cast, 4 roles, ordered hall entrance, bounded 128-pose atlas/4 backdrops, castle progression, 5 unique reusable voices, mute/visibility/close, finite actions, slow reading idle and cue cancellation.');
