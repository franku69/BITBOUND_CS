import assert from 'node:assert/strict';
import {startStudioIntro} from '../app/studio-intro.js';
function fixture(reduced=false){
  const timers=new Map(),listeners=new Map();let next=0;
  const node=id=>({id,open:true,inert:false,focused:false,focus(){this.focused=true;},
    addEventListener(type,fn){listeners.set(id+type,fn);},removeEventListener(type){listeners.delete(id+type);},close(){this.open=false;listeners.get(id+'close')?.();}});
  const card=node('studioIntro'),modes=node('modes'),skip=node('studioContinue'),lab=node('labModeLink');
  const doc={...node('doc'),getElementById:id=>({studioIntro:card,studioContinue:skip,labModeLink:lab}[id]),querySelector:()=>modes};
  const win={...node('win'),matchMedia:()=>({matches:reduced}),setTimeout(fn,ms){const id=++next;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);}};
  const finish=startStudioIntro({document:doc,window:win});return {card,modes,skip,lab,timers,listeners,finish};
}
let f=fixture();assert.equal(f.modes.inert,true);assert.equal(f.skip.focused,true);assert.equal(f.timers.size,1);
assert.equal([...f.timers.values()][0].ms,1800);
[...f.timers.values()][0].fn();assert.equal(f.card.open,false);assert.equal(f.modes.inert,false);assert.equal(f.lab.focused,true);assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
f=fixture();f.card.close();assert.equal(f.modes.inert,false);assert.equal(f.timers.size,0,'native Continue cancels the timer');
f=fixture();f.listeners.get('dockeydown')({key:'Escape',preventDefault(){}});assert.equal(f.card.open,false);
f=fixture(true);assert.equal([...f.timers.values()][0].ms,250);
f.listeners.get('winpagehide')();assert.equal(f.timers.size,0);assert.equal(f.lab.focused,false);
f.finish();assert.equal(f.listeners.size,0,'cleanup remains safe twice');
console.log('PASS studio intro: precedes modes, finite timer, Continue/Escape, focus restoration, reduced motion and cleanup on leave.');
