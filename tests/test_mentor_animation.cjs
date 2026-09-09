'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sandbox={window:{},setTimeout,clearTimeout};
vm.runInNewContext(fs.readFileSync('adventure/mentor-animation.js','utf8'),sandbox);
// Browser timer functions require their Window receiver. Node's ordinary timers
// and injected arrow-function clocks do not expose this production-only failure.
const browser={};vm.createContext(browser);
vm.runInContext("window=globalThis; calls=[]; setTimeout=function(fn,delay){if(this!==window)throw new TypeError('Illegal invocation');calls.push(['start',delay]);return 7;};clearTimeout=function(id){if(this!==window)throw new TypeError('Illegal invocation');calls.push(['stop',id]);};",browser);
vm.runInContext(fs.readFileSync('adventure/mentor-animation.js','utf8'),browser);
vm.runInContext("a=new BitboundMentorAnimation.PortraitAnimator({paint:()=>{}});a.play([0,1]);a.stop();",browser);
assert.equal(JSON.stringify(browser.calls),JSON.stringify([['start',180],['stop',7]]));
const timers=new Map(),painted=[];let seq=0,visible=true,reduced=false,maxTimers=0;
const animator=new sandbox.window.BitboundMentorAnimation.PortraitAnimator({paint:frame=>painted.push(frame),visible:()=>visible,reduced:()=>reduced,setTimer:fn=>{const id=++seq;timers.set(id,fn);maxTimers=Math.max(maxTimers,timers.size);return id;},clearTimer:id=>timers.delete(id)});
animator.play([0,1,2,0]);assert.equal(timers.size,1);
while(timers.size){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}
assert.deepEqual(painted,[0,1,2,0]);assert.equal(maxTimers,1);assert.equal(timers.size,0,'reaction stops on its own');
animator.play([0,1,2]);animator.stop();assert.equal(timers.size,0);
animator.play([0,1,2]);visible=false;const [id,fn]=timers.entries().next().value;timers.delete(id);fn();assert.equal(timers.size,0);
visible=true;reduced=true;animator.play([0,4,0]);assert.equal(painted.at(-1),4);assert.equal(timers.size,0,'reduced motion is static');
const {buildContext}=require('./helpers/game-harness.cjs');const {sandbox:s,listeners}=buildContext('?quality=low');const api=s.TestAPI;
assert.equal(api.mentorFrames.length,6);assert.equal(api.mentorWorldFrames.length,6);
assert.ok(api.mentorFrames.every(frame=>frame.width===48&&frame.height===88));
assert.ok(api.mentorWorldFrames.every(frame=>frame.width===36&&frame.height===56));
api.startNew();api.enterWorld();api.openMentor('q01');assert.notEqual(api.mentorAnimator.timer,null);
api.closeMentor();assert.equal(api.mentorAnimator.timer,null);
api.openMentor('q01');s.document.hidden=true;for(const callback of listeners['document:visibilitychange'])callback();assert.equal(api.mentorAnimator.timer,null);
console.log('PASS Byte: six cached taller world poses, bounded reactions, stop on close/hidden and reduced-motion handling.');
