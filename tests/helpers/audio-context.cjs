'use strict';
// Clock-driven Web Audio double; checks lifetimes and scheduling, not device audio.
class AudioContext {
 constructor(){this.currentTime=0;this.state='running';this.sampleRate=44100;this.sources=new Set();this.nodes=new Set();this.destination={};this.created=0;}
 param(){return {value:0,setValueAtTime(v,t){if(!Number.isFinite(v+t))throw Error('Invalid audio value');},setTargetAtTime(v,t,c){if(!Number.isFinite(v+t+c))throw Error('Invalid audio target');},linearRampToValueAtTime(v,t){this.setValueAtTime(v,t);},exponentialRampToValueAtTime(v,t){if(v<=0)throw Error('Invalid ramp');this.setValueAtTime(v,t);},cancelScheduledValues(){}};}
 node(extra={}){const ctx=this,n={...extra,connect(){},disconnect(){ctx.nodes.delete(n);}};ctx.nodes.add(n);return n;}
 createGain(){return this.node({gain:this.param()});}
 createBiquadFilter(){return this.node({frequency:this.param()});}
 source(extra={}){const ctx=this,n=this.node({...extra,start(at=0){if(!Number.isFinite(at))throw Error('Invalid start');ctx.created++;ctx.sources.add(n);},stop(at=ctx.currentTime){n.end=at;}});return n;}
 createOscillator(){return this.source({frequency:this.param()});}
 createBufferSource(){return this.source({loop:false});}
 createBuffer(channels,n){const data=new Float32Array(n);return {getChannelData:()=>data};}
 advance(seconds){this.currentTime+=seconds;for(const s of [...this.sources])if(s.end<=this.currentTime){this.sources.delete(s);s.onended?.();}}
 suspend(){this.state='suspended';return Promise.resolve();}
 resume(){this.state='running';return Promise.resolve();}
}
module.exports={AudioContext};
