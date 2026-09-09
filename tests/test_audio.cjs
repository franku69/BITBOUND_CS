'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {buildContext}=require('./helpers/game-harness.cjs');
const {AudioContext}=require('./helpers/audio-context.cjs');
const {sandbox:s,elements}=buildContext('?quality=low'),api=s.TestAPI,audio=api.AudioEngine;
const {catalog,events,Player}=s.BitboundMusic;
const timers=new Map();let serial=0;
s.setInterval=fn=>{const id=++serial;timers.set(id,fn);return id;};s.clearInterval=id=>timers.delete(id);
s.AudioContext=AudioContext;
assert.equal(audio.ctx,null,'setup does not create an autoplay context');
const fingerprints=new Set();
for(const t of Object.values(catalog)){
 const arrangement=Array.from({length:128},(_,i)=>events(t,i));
 assert.ok(arrangement.flat().length>100);
 for(const e of arrangement.flat()){
  assert.ok(e.gain>0&&e.gain<=.15);if(!e.drum)assert.ok(e.freq>20&&e.freq<10000&&e.dur>0);
 }
 fingerprints.add(crypto.createHash('sha256').update(JSON.stringify(arrangement)).digest('hex'));
 const ctx=new AudioContext(),p=new Player(ctx,ctx.destination,{setTimer:s.setInterval,clearTimer:s.clearInterval});
 p.setTrack(t.id);const timer=p.timer;
 for(let i=0;i<1600;i++){ctx.advance(.04);p.pump();assert.ok(p.voices.size<=40);}
 p.setTrack(t.id);assert.equal(p.timer,timer,'same theme never restarts');
 ctx.advance(8);const before=ctx.created;p.pump();assert.ok(ctx.created-before<22,'stalled callbacks skip missing beats');
 p.destroy();ctx.advance(.5);assert.equal(p.voices.size,0);assert.equal(ctx.nodes.size,0,'score nodes disconnected');
}
assert.equal(fingerprints.size,Object.keys(catalog).length,'every theme has a unique arrangement');
assert.equal(Object.keys(catalog).filter(id=>/^world/.test(id)).length,8);
assert.equal(Object.keys(catalog).filter(id=>/^boss/.test(id)||['paladin','fused'].includes(id)).length,10);
assert.equal(timers.size,0);
audio.init();assert.equal(audio.musicPlayer.track,'setup');assert.equal(timers.size,1);
const scoreTimer=audio.musicPlayer.timer;audio.syncMusic();audio.syncMusic();assert.equal(audio.musicPlayer.timer,scoreTimer);
api.startNew();api.enterWorld();
for(let level=0;level<8;level++){
 audio.playWorld(level);assert.equal(audio.musicTrack,'world'+level);
 audio.playBoss(level,null);assert.equal(audio.musicTrack,'boss'+level);
}
audio.playBoss(7,'paladin');assert.equal(audio.musicTrack,'paladin');
audio.playBoss(7,'fused');assert.equal(audio.musicTrack,'fused');
for(const [id,expected] of [['mentorOverlay','lesson'],['encounterOverlay','encounter'],['puzzleOverlay','practice'],['deathOverlay','defeat']]){
 api.show(elements.get(id));assert.equal(audio.musicTrack,expected);api.hide(elements.get(id));assert.equal(audio.musicTrack,'fused');
}
for(const [scene,theme] of [['origin','origin'],['camp1','camp'],['betrayal','betrayal'],['cell','prison'],['escape','escape'],['fusion','fusion'],['ending','ending']]){
 api.showPlotScene(scene);assert.equal(audio.musicTrack,theme);api.hide(api.plotUI.overlay);
}
api.openMentor('q01');audio.toggleMusic();assert.equal(audio.musicPlayer.timer,null);assert.equal(audio.dialogueOpen,true);
audio.setDuck(true);assert.equal(audio.musicPlayer.timer,null,'muted stays muted across overlays');
audio.toggleMusic();assert.notEqual(audio.musicPlayer.timer,null);
audio.setBackground(true);assert.equal(audio.musicPlayer.timer,null);assert.equal(audio.ctx.state,'suspended');
const count=audio.ctx.created;audio.tick();audio.sequence([{freq:400}]);assert.equal(audio.ctx.created,count);
audio.setBackground(false);assert.equal(audio.musicPlayer.track,'lesson');
for(let n=0;n<100;n++)audio.tone({freq:400});assert.equal(audio.voices.size,48,'SFX independently bounded');
audio.setBackground(true);audio.ctx.advance(2);assert.equal(audio.voices.size,0);assert.equal(audio.musicPlayer.voices.size,0);
const refusedCtx=new AudioContext();refusedCtx.createOscillator=()=>{throw new Error('Audio allocation refused');};
const refused=new Player(refusedCtx,refusedCtx.destination,{setTimer:s.setInterval,clearTimer:s.clearInterval});
assert.doesNotThrow(()=>refused.setTrack('boss7'));assert.equal(refused.failed,true);assert.equal(refused.timer,null);
const silent=buildContext('?quality=low').sandbox.TestAPI;silent.startNew();silent.enterWorld();silent.openMentor('q01');
assert.equal(silent.UI.mentor.hidden,false);assert.equal(silent.AudioEngine.ctx,null);
console.log(`PASS audio: ${fingerprints.size} scores, 8 worlds/10 bosses, scene routing, bounded scheduling/nodes, hidden/mute/resume, no-audio fallback.`);
