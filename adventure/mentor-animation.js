/* Short portrait reactions. At most one timer; no permanent portrait loop. */
(() => {
  'use strict';
  class PortraitAnimator {
    constructor({paint,setTimer=(callback,delay)=>window.setTimeout(callback,delay),clearTimer=id=>window.clearTimeout(id),reduced=()=>false,visible=()=>true}){
      this.paint=paint;this.setTimer=setTimer;this.clearTimer=clearTimer;this.reduced=reduced;this.visible=visible;this.timer=null;this.generation=0;
    }
    stop(){this.generation++;if(this.timer!==null)this.clearTimer(this.timer);this.timer=null;}
    play(frames){
      this.stop();
      if(!this.visible())return;
      if(this.reduced()){this.paint(frames.includes(4)?4:0);return;}
      const generation=this.generation;let index=0;
      const step=()=>{
        this.timer=null;if(generation!==this.generation||!this.visible())return;
        this.paint(frames[index++]);
        if(index<frames.length)this.timer=this.setTimer(step,180);
      };
      step();
    }
  }
  window.BitboundMentorAnimation=Object.freeze({PortraitAnimator});
})();
