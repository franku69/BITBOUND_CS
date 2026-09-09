'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {AudioContext}=require('./helpers/audio-context.cjs');
function setup({embedded=false,unsupported=false,muted=false}={}){
 const events={},winEvents={},timers=new Map(),storage=new Map(muted?[['bitbound-music','off']]:[]);let id=0,created=0,ctx;
 const button={dataset:{},listeners:{},setAttribute(k,v){this[k]=v;},contains(n){return n===this;},addEventListener(k,fn){this.listeners[k]=fn;}};
 const document={hidden:false,querySelector:()=>button,addEventListener(k,fn){events[k]=fn;}};
 const sandbox={document,console,Float32Array,Promise,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
 setInterval(fn){assert.ok(this===undefined||this===sandbox,'timer receiver is Window, never Player');timers.set(++id,fn);return id;},clearInterval(id){timers.delete(id);},
 addEventListener(k,fn){winEvents[k]=fn;}};
 sandbox.window=sandbox;sandbox.parent=embedded?{}:sandbox;
 if(!unsupported)sandbox.AudioContext=class extends AudioContext{constructor(){super();created++;ctx=this;this.state='suspended';}};
 vm.createContext(sandbox);
 vm.runInContext(fs.readFileSync('app/music-score.js','utf8'),sandbox);
 vm.runInContext(fs.readFileSync('app/page-music.js','utf8').replace('export function','function')+';window.pageMusic=startPageMusic("choose");',sandbox);
 return {sandbox,document,button,events,winEvents,timers,storage,created:()=>created,context:()=>ctx};
}
(async()=>{
 const a=setup();assert.equal(a.created(),0);assert.match(a.button.textContent,/Play music/);
 a.events.pointerdown({target:{}});await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(a.created(),1);assert.equal(a.timers.size,1);assert.match(a.button.textContent,/Music on/);
 for(let i=0;i<25;i++)a.events.keydown({target:{}});assert.equal(a.created(),1);assert.equal(a.timers.size,1);
 a.sandbox.pageMusic.select('lab');assert.equal(a.button.dataset.musicTrack,'lab');
 a.sandbox.pageMusic.select('practice');assert.equal(a.button.dataset.musicTrack,'practice');assert.equal(a.timers.size,1);
 a.button.listeners.click();assert.equal(a.storage.get('bitbound-music'),'off');assert.equal(a.timers.size,0);assert.equal(a.context().state,'suspended');
 a.events.keydown({target:{}});assert.equal(a.timers.size,0,'muted typing does not restart audio');
 a.button.listeners.click();await Promise.resolve();await Promise.resolve();await Promise.resolve();assert.equal(a.timers.size,1);
 a.document.hidden=true;a.events.visibilitychange();assert.equal(a.timers.size,0);assert.equal(a.context().state,'suspended');
 a.document.hidden=false;a.events.visibilitychange();await Promise.resolve();await Promise.resolve();await Promise.resolve();assert.equal(a.timers.size,1);
 a.winEvents.pagehide();assert.equal(a.timers.size,0);assert.equal(a.context().nodes.size,0);
 a.winEvents.pageshow();await Promise.resolve();await Promise.resolve();await Promise.resolve();assert.equal(a.timers.size,1);
 a.winEvents.pagehide();
 const b=setup({embedded:true});assert.equal(b.created(),0);assert.deepEqual(b.events,{});b.sandbox.pageMusic.select('lab');
 const c=setup({unsupported:true});c.events.pointerdown({target:{}});assert.equal(c.button.disabled,true);assert.equal(c.timers.size,0);
 const d=setup({muted:true});d.events.pointerdown({target:{}});assert.equal(d.created(),0);assert.match(d.button.textContent,/Music off/);
 console.log('PASS page music: gesture-only startup, one context/timer, lab/practice routing, mute preference, hidden/pagehide cleanup, BFCache resume, unsupported audio and no iframe double music.');
})().catch(e=>{console.error(e);process.exitCode=1;});
