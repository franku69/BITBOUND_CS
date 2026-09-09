'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const scope={window:{}};vm.runInNewContext(fs.readFileSync('adventure/mentor-voice.js','utf8'),scope);
const {createSamples,SAMPLE_RATE,DURATION,GibberishVoice}=scope.window.BitboundMentorVoice;
const samples=createSamples();let peak=0,energy=0,silence=0;
for(const n of samples){assert.ok(Number.isFinite(n));peak=Math.max(peak,Math.abs(n));energy+=n*n;if(n===0)silence++;}
assert.equal(samples.length,SAMPLE_RATE*DURATION);assert.ok(peak<.8&&peak>.2);assert.ok(energy>10);
assert.ok(silence/samples.length>.3,'phrases include breathing pauses');
assert.ok(samples.subarray(0,100).every(n=>n===0)&&samples.subarray(-100).every(n=>n===0),'quiet seamless loop boundaries');
assert.deepEqual(createSamples(),samples,'deterministic offline sound');

const {buildContext}=require('./helpers/game-harness.cjs');
const {sandbox:s,elements,listeners}=buildContext('?quality=low'),api=s.TestAPI,audio=api.AudioEngine;
let bufferBuilds=0,sourceStarts=0,sourceStops=0,nextId=0,suspends=0,resumes=0;
const activeSources=new Set(),timers=new Map(),intervals=new Map();
s.setTimeout=(fn,ms)=>{const id=++nextId;timers.set(id,{fn,ms});return id;};s.clearTimeout=id=>timers.delete(id);
s.setInterval=fn=>{const id=++nextId;intervals.set(id,fn);return id;};s.clearInterval=id=>intervals.delete(id);
const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
s.AudioContext=class{
 constructor(){this.currentTime=0;this.state='running';this.destination={};}
 createGain(){return {gain:param(),connect(){},disconnect(){}};}
 createOscillator(){return {frequency:param(),connect(){},disconnect(){},start(){},stop(){}};}
 createBuffer(channels,length,rate){bufferBuilds++;assert.equal(channels,1);assert.equal(rate,22050);const data=new Float32Array(length);return {getChannelData:()=>data};}
 createBufferSource(){const node={loop:false,connect(){},disconnect(){},start(){assert.equal(this.loop,true);sourceStarts++;activeSources.add(this);},stop(){sourceStops++;activeSources.delete(this);}};return node;}
 suspend(){this.state='suspended';suspends++;return Promise.resolve();}
 resume(){this.state='running';resumes++;return Promise.resolve();}
};
audio.musicEnabled=false; // Isolate dialogue PCM; score integration is tested in test_audio.cjs.
api.startNew();api.enterWorld();
assert.equal(bufferBuilds,1,'origin BYTE conversation initializes the reusable voice');
assert.equal(activeSources.size,0,'origin voice stops before the world starts');
const startsBeforeLesson=sourceStarts;
// E/Use reaches the taller guide from the shared ground.
const npc=api.mentorRect();api.player.x=npc.x;api.player.y=npc.y+npc.h-api.player.h;
api.updateInteractable();assert.equal(api.state.currentInteract.type,'mentor');api.interact();
assert.equal(api.UI.mentor.hidden,false);assert.equal(audio.dialogueOpen,true);
assert.equal(activeSources.size,1);assert.equal(bufferBuilds,1);assert.equal(audio.musicTimer,null);
assert.equal(audio.suspendTimer,null,'idle audio suspension must not cut off an open dialogue');
elements.get('mentorNext').onclick();elements.get('mentorNext').onclick();
assert.equal(sourceStarts,startsBeforeLesson+1,'page changes do not stack voices');
const lesson=s.BitboundQuestions.tutorials.q01;
elements.get('mentorChoices').children[lesson.answer].onclick();
assert.equal(elements.get('mentorNext').disabled,false,'voice never blocks correct answers');
audio.sequence([{freq:500,dur:.1}]);assert.equal(audio.suspendTimer,null,'feedback does not cut off babble after 1.2 seconds');
elements.get('mentorSound').onclick();
assert.equal(audio.sfxEnabled,false);assert.equal(activeSources.size,0);
assert.equal(elements.get('mentorSound').attributes['aria-pressed'],'false');
elements.get('mentorSound').onclick();assert.equal(activeSources.size,1);assert.equal(bufferBuilds,1);
s.document.hidden=true;for(const fn of listeners['document:visibilitychange'])fn();
assert.equal(activeSources.size,0);assert.equal(audio.ctx.state,'suspended');
s.document.hidden=false;for(const fn of listeners['document:visibilitychange'])fn();
assert.equal(activeSources.size,1);assert.equal(bufferBuilds,1);
elements.get('mentorNext').onclick();
assert.equal(api.UI.mentor.hidden,true);assert.equal(audio.dialogueOpen,false);assert.equal(activeSources.size,0);
api.openMentor('q02');assert.equal(activeSources.size,1);
api.hide(api.UI.mentor);assert.equal(activeSources.size,0,'generic dialog close also cleans up');
api.openChapterEnding();assert.equal(activeSources.size,1);api.closeMentor();assert.equal(activeSources.size,0);
api.openMentor('q03');for(const fn of listeners.pagehide)fn();
assert.equal(activeSources.size,0);assert.equal(audio.dialogueOpen,false);
assert.equal(bufferBuilds,1,'reopened lessons share one PCM buffer');
assert.equal(sourceStarts,sourceStops);
const broken=buildContext('?quality=low'),bad=broken.sandbox.TestAPI;
broken.sandbox.console={...console,warn(){}};
broken.sandbox.AudioContext=s.AudioContext;
bad.AudioEngine.musicEnabled=false;bad.startNewRaw();bad.AudioEngine.ctx.createBuffer=()=>{throw new Error('Audio allocation refused');};
while(bad.plotState().scene==='origin')bad.advancePlotScene();bad.enterWorld();
bad.openMentor('q01');
const next=broken.elements.get('mentorNext');next.onclick();next.onclick();
broken.elements.get('mentorChoices').children[0].onclick();assert.equal(next.disabled,false);next.onclick();
assert.equal(bad.UI.mentor.hidden,true,'audio allocation failure leaves lessons usable');
console.log('PASS Byte voice: deterministic bounded PCM, one looping source/cached buffer, E interaction, lesson answers, mute, hide/resume, all close paths and audio failure isolation.');
