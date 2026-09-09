/* Original BITBOUND score. No network, decoded audio files, or game dependency.
 * Each theme has its own melody, harmony, instrumentation and rhythm. Eight-bar
 * phrases develop over a 16-bar arrangement; only a 120ms window is scheduled.
 * Classic script so the same implementation runs in the game bundle and IDE.
 */
(() => {
  'use strict';
  const scales = {major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10], harmonic:[0,2,3,5,7,8,11], dorian:[0,2,3,5,7,9,10]};
  const notes = text => text.split(' ').map(n => n==='_' ? null : Number(n));
  const catalog = Object.create(null);
  function score(id,name,bpm,root,mode,style,chords,a,b,lead='triangle') {
    catalog[id] = Object.freeze({id,name,bpm,root,scale:scales[mode],style,chords:notes(chords),a:notes(a),b:notes(b),lead,
      volume:style==='ambient'?.44:style==='boss'?.90:.68});
  }
  score('studio','A Spark from the Guild',84,60,'major','ambient','0 3 4 0','0 _ 4 _ 7 _ 9 _','8 _ 7 _ 4 _ 0 _');
  score('choose','Two Roads, One Beginning',104,60,'major','light','0 5 3 4','0 2 4 _ 7 6 4 _ 2 3 4 2 1 _ 0 _','7 _ 9 8 7 4 5 _ 4 2 3 1 0 _ _ _');
  score('setup','An Explorer Takes Shape',112,65,'major','light','0 3 5 4','0 2 4 5 4 _ 2 _ 1 3 5 _ 4 3 2 _','4 6 7 _ 6 4 2 3 4 _ 2 1 0 _ 0 _');
  score('lab','Quiet Keys',76,62,'dorian','ambient','0 3 1 4','4 _ _ 2 _ _ 0 _ 1 _ _ 3 _ 2 _ _','7 _ _ 5 _ 4 _ _ 3 _ 1 _ 0 _ _ _','sine');
  score('practice','One Thought at a Time',88,57,'minor','ambient','0 5 3 4','0 _ 2 _ 4 _ _ 3 2 _ 1 _ 0 _ _ _','4 _ 5 _ 7 _ 5 _ 4 _ 2 _ 1 _ _ _','sine');
  score('lesson','A Guide with Answers',94,67,'major','light','0 3 0 4','2 _ 4 _ 3 2 0 _ 1 _ 3 _ 2 _ _ _','4 _ 6 4 5 _ 3 _ 2 _ 1 2 0 _ _ _');
  score('encounter','Runes in the Grass',120,62,'dorian','light','0 3 6 4','0 _ 4 3 0 2 _ 4 5 _ 4 2 1 _ 0 _','7 5 _ 4 3 _ 2 4 6 _ 5 3 4 _ _ _');
  score('origin','The Stone Opens Its Eyes',82,60,'major','ambient','0 5 3 4','0 _ _ 4 _ _ 7 _ 6 _ 4 _ 2 _ _ _','7 _ 9 _ 8 _ 7 _ 4 _ 2 _ 0 _ _ _');
  score('camp','A Fifth Bowl by the Fire',90,65,'major','light','0 3 5 4','4 _ 2 0 1 _ 2 _ 3 _ 5 4 2 _ 0 _','7 _ 6 4 5 _ 4 _ 2 3 4 _ 1 _ 0 _');
  score('prison','Iron and a Small Ember',68,50,'harmonic','ambient','0 5 3 4','0 _ _ _ 1 _ _ 0 4 _ _ _ 3 _ _ _','2 _ _ 1 0 _ _ _ 6 _ _ 4 0 _ _ _','sine');
  score('betrayal','The Empty Place at the Fire',72,58,'minor','ambient','0 5 1 4','4 _ 2 _ 0 _ _ _ 1 _ 3 _ 2 _ _ _','7 _ 5 _ 4 _ 3 _ 2 _ 1 _ 0 _ _ _');
  score('escape','No Cage Is a Conclusion',122,62,'dorian','march','0 3 6 4','0 2 4 _ 5 4 2 0 3 4 6 _ 5 _ 4 _','7 6 4 5 7 _ 9 7 6 4 3 2 0 _ 0 _');
  score('rivals','Four Claims to One Crown',128,55,'harmonic','march','0 5 3 4','0 _ 1 4 3 _ 2 1 0 4 6 _ 5 4 1 _','7 _ 6 4 5 _ 3 2 1 3 4 6 7 _ _ _','square');
  score('barrier','The Crown’s Last Seal',96,54,'harmonic','ambient','0 1 5 4','0 _ 4 _ 6 _ 7 _ 6 _ 4 _ 1 _ _ _','8 _ 7 _ 6 _ 4 _ 3 _ 1 _ 0 _ _ _');
  score('fusion','A Name Inside the Crown',138,48,'harmonic','march','0 1 5 4','0 0 _ 1 4 _ 6 4 3 _ 1 0 6 _ 4 _','7 6 _ 4 8 7 _ 6 5 3 1 4 0 _ _ _','square');
  score('ending','Beyond the Last Mountain',110,62,'major','light','0 3 5 4','0 2 4 _ 7 _ 9 8 7 4 5 _ 4 2 0 _','7 9 11 _ 10 9 7 _ 8 6 4 2 0 _ _ _');
  score('defeat','Another Attempt, Another Dawn',64,57,'minor','ambient','0 3 5 4','4 _ _ 3 2 _ _ _ 1 _ _ 0 0 _ _ _','2 _ 4 _ 5 _ _ 4 3 _ 1 _ 0 _ _ _','sine');
  score('world0','Stonewake Morning',106,60,'major','light','0 3 5 4','0 2 4 2 5 _ 4 _ 7 6 4 2 1 _ 0 _','4 5 7 _ 9 7 6 _ 5 4 2 3 1 _ 0 _');
  score('world1','Under Thornveil Leaves',98,62,'dorian','forest','0 3 6 0','0 _ 2 4 5 _ 4 2 3 _ 1 0 1 3 2 _','7 _ 5 4 6 _ 5 3 4 2 0 _ 3 1 0 _','sine');
  score('world2','Emberglass Reflections',86,57,'minor','cave','0 5 3 4','4 _ _ 7 _ 5 _ 4 2 _ 3 _ 1 _ _ _','9 _ 7 _ 5 _ _ 4 3 _ 2 _ 0 _ _ _','sine');
  score('world3','Oathforge Procession',116,50,'minor','march','0 6 5 4','0 0 4 _ 3 2 1 _ 0 2 5 _ 4 _ 2 _','7 _ 6 5 4 4 3 2 1 _ 4 3 0 _ 0 _','square');
  score('world4','Ironqueue Echoes',92,52,'harmonic','cave','0 1 5 4','0 _ 1 _ 4 _ 3 1 0 _ _ 6 4 _ _ _','7 _ 6 4 3 _ 1 _ 2 _ 3 1 0 _ _ _');
  score('world5','Across the Broken Drawbridge',124,55,'minor','march','0 5 6 4','0 2 4 7 6 _ 4 2 3 5 7 _ 6 4 2 _','9 7 6 4 5 _ 3 2 4 6 7 6 4 _ 0 _');
  score('world6','The House of Returning Steps',102,54,'harmonic','cave','0 3 1 4','0 4 6 _ 7 6 4 _ 1 4 6 _ 4 1 0 _','7 11 10 _ 8 7 6 _ 4 6 7 _ 3 1 0 _','sine');
  score('world7','The Hall Beneath the Crown',108,48,'harmonic','march','0 5 1 4','0 _ 4 3 1 _ 0 _ 6 _ 4 1 3 _ 4 _','7 _ 8 7 6 _ 4 _ 5 3 1 _ 4 _ 0 _','square');
  score('boss0','Break the Warden’s Chains',144,50,'minor','boss','0 5 6 4','0 0 4 3 0 2 5 4 3 1 4 2 1 0 1 _','7 6 4 5 7 4 3 2 5 4 2 1 0 4 0 _');
  score('boss1','Roots around the Colossus',150,55,'dorian','boss','0 3 6 4','0 3 4 _ 6 4 3 1 0 2 3 5 4 _ 2 0','7 5 4 6 8 6 5 3 4 7 6 4 3 1 0 _','square');
  score('boss2','Brass and Burning Glass',156,57,'harmonic','boss','0 1 5 4','4 0 1 4 6 _ 4 3 1 0 3 1 0 _ 6 4','7 8 7 4 6 4 3 1 5 3 1 4 6 _ 7 _');
  score('boss3','The Castellan’s Broken Oath',148,48,'minor','boss','0 6 3 4','0 0 3 4 0 _ 6 5 4 3 1 0 3 _ 4 _','7 7 6 4 5 3 4 2 1 4 6 4 0 _ 0 _','square');
  score('boss4','No Chain Can Hold',158,52,'harmonic','boss','0 5 1 4','0 1 0 4 3 1 4 6 7 _ 6 4 1 3 0 _','7 6 4 7 8 7 4 6 5 3 1 4 0 1 0 _');
  score('boss5','Revenant at the Red Gate',162,55,'minor','boss','0 3 5 4','7 4 0 2 3 5 4 2 0 2 4 6 5 3 1 _','9 7 6 4 7 5 4 2 3 4 6 7 4 2 0 _','square');
  score('boss6','The Sentinel Answers Twice',154,54,'harmonic','boss','0 1 3 4','0 4 6 4 1 4 6 4 3 5 7 5 4 6 8 _','7 11 10 8 7 6 4 3 1 4 6 4 0 1 0 _');
  score('boss7','Veyr, the Gilded Tyrant',164,48,'harmonic','boss','0 5 1 4','0 0 4 6 7 6 4 1 3 1 0 4 6 4 1 _','7 8 7 6 4 7 6 4 5 3 1 4 6 7 0 _','square');
  score('paladin','Aster, the Oath Forsaken',152,53,'minor','boss','0 3 6 4','4 4 2 0 1 3 2 _ 5 4 3 1 0 2 4 _','7 6 4 2 3 5 4 _ 8 7 5 3 4 2 0 _');
  score('fused','Stone against the Fused Crown',174,50,'harmonic','boss','0 1 5 4','0 4 1 6 4 7 6 4 8 7 6 4 3 1 0 4','7 11 10 8 7 6 4 6 9 8 7 6 4 1 0 _','square');
  const frequency = midi => 440 * Math.pow(2,(midi-69)/12);
  function pitch(t,degree,octave=0) {
    return t.root + octave*12 + Math.floor(degree/7)*12 + t.scale[((degree%7)+7)%7];
  }
  // Pure arrangement: shared by the live player, audio tests and score previews.
  function events(t,step) {
    const bar=Math.floor(step/8)%16, beat=step%8, phrase=bar%8;
    const chord=t.chords[Math.floor(phrase/2)%t.chords.length];
    const motif=bar>=8?t.b:t.a, degree=motif[(phrase*8+beat)%motif.length];
    const d=30/t.bpm, out=[], busy=t.style==='boss', ambient=t.style==='ambient';
    const add=(n,span,type,gain)=>out.push({freq:frequency(pitch(t,n)),dur:span*d,type,gain});
    if(degree!==null && !(ambient&&bar%4===3&&beat>3))add(degree,.78,t.lead,busy?.058:.048);
    if(beat===0 || (!ambient && (beat===4 || (busy && [3,6].includes(beat)))))
      add(chord-14+(beat===6?4:0),busy?1.2:2.8,'triangle',busy?.082:.058);
    if(beat===0)for(const n of [chord,chord+2,chord+4])add(n-7,ambient?6.5:3.7,'sine',.021);
    if(!ambient&&bar>=4&&beat%2===1)add(chord+[0,2,4,2][Math.floor(beat/2)]+7,.5,'sine',.017);
    if(!ambient){
      if(beat===0||beat===4||(busy&&beat===6))out.push({drum:'kick',gain:busy?.15:.07});
      if(beat===2||beat===6)out.push({drum:'snare',gain:busy?.055:.017});
      if(busy||beat%2===1)out.push({drum:'hat',gain:busy?.024:.011});
      if(busy&&bar%4===3&&beat>=5)out.push({drum:'snare',gain:.04});
    }
    return out;
  }
  class Player {
    constructor(ctx,output,{setTimer=(fn,ms)=>setInterval(fn,ms),clearTimer=id=>clearInterval(id)}={}) {
      this.ctx=ctx;this.output=output;this.setTimer=setTimer;this.clearTimer=clearTimer;
      this.timer=null;this.track=null;this.enabled=true;this.background=false;
      this.voices=new Set();this.bus=null;this.step=0;this.next=0;
      this.noise=null;this.failed=false;
    }
    setTrack(id){
      if(!catalog[id])throw new Error('Unknown music theme: '+id);
      if(this.track===id)return;
      this.halt(.18);this.track=id;this.step=0;this.start();
    }
    setEnabled(on){this.enabled=!!on;if(on)this.start();else this.halt(.04);}
    setBackground(hidden){this.background=!!hidden;if(hidden)this.halt(0);else this.start();}
    start(){
      if(this.failed||this.timer!==null||!this.enabled||this.background||!this.track||this.ctx.state!=='running')return;
      try{
      this.bus=this.ctx.createGain();this.bus.gain.setValueAtTime(0,this.ctx.currentTime);
      this.bus.gain.linearRampToValueAtTime(catalog[this.track].volume,this.ctx.currentTime+.25);
      this.bus.connect(this.output);this.next=this.ctx.currentTime+.025;
      this.pump();if(!this.failed)this.timer=this.setTimer(()=>this.pump(),40);
      }catch{this.fail();}
    }
    halt(fade=0){
      if(this.timer!==null){this.clearTimer(this.timer);this.timer=null;}
      const bus=this.bus;this.bus=null;
      if(bus){const now=this.ctx.currentTime;bus.gain.cancelScheduledValues(now);bus.gain.setTargetAtTime(.0001,now,Math.max(.005,fade/4));}
      for(const voice of [...this.voices]){
        if(voice.bus!==bus&&fade>0)continue;
        try{voice.source.stop(this.ctx.currentTime+fade+.005);}catch{}
        if(fade===0)this.release(voice);
      }
      if(bus&&![...this.voices].some(v=>v.bus===bus))bus.disconnect();
    }
    release(v){
      if(!this.voices.delete(v))return;
      v.source.onended=null;for(const n of v.nodes)n.disconnect();
      if(v.bus!==this.bus&&![...this.voices].some(other=>other.bus===v.bus))v.bus.disconnect();
    }
    fail(){this.failed=true;try{this.halt(0);}catch{} /* Optional music cannot block play. */}
    pump(){
      if(!this.enabled||this.background||!this.bus||this.ctx.state!=='running'){this.halt(0);return;}
      // A stalled tab never catches up by emitting a burst of missed notes.
      if(this.next<this.ctx.currentTime-.12)this.next=this.ctx.currentTime+.025;
      const t=catalog[this.track];let budget=4;
      try{
      while(this.next<this.ctx.currentTime+.12&&budget-->0){
        for(const e of events(t,this.step))this.voice(e,this.next);
        this.step=(this.step+1)%128;this.next+=30/t.bpm;
      }
      }catch{this.fail();}
    }
    voice(e,at){
      if(this.voices.size>=40||!this.bus)return;
      const ctx=this.ctx,amp=ctx.createGain(),nodes=[amp];let source,dur=e.dur||.07;
      if(e.drum&&e.drum!=='kick'){
        if(!this.noise){this.noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.2),ctx.sampleRate);const data=this.noise.getChannelData(0);let n=271;
          for(let i=0;i<data.length;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;data[i]=n/2147483648-1;}}
        source=ctx.createBufferSource();source.buffer=this.noise;
        const filter=ctx.createBiquadFilter();filter.type='highpass';filter.frequency.value=e.drum==='hat'?6200:1500;
        source.connect(filter);filter.connect(amp);nodes.push(filter);dur=e.drum==='hat'?.035:.11;
      }else{
        source=ctx.createOscillator();source.type=e.drum?'sine':e.type;
        source.frequency.setValueAtTime(e.drum?125:e.freq,at);
        if(e.drum)source.frequency.exponentialRampToValueAtTime(42,at+.08);
        if(e.type==='square'){
          const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2100;
          source.connect(filter);filter.connect(amp);nodes.push(filter);
        }else source.connect(amp);
      }
      nodes.push(source);const gain=e.type==='square'?e.gain*.60:e.gain;
      amp.gain.setValueAtTime(.0001,at);amp.gain.linearRampToValueAtTime(gain,at+.008);
      if(!e.drum){amp.gain.linearRampToValueAtTime(gain*.72,at+dur*.20);amp.gain.setValueAtTime(gain*.72,at+dur*.65);}
      amp.gain.exponentialRampToValueAtTime(.0001,at+dur);amp.connect(this.bus);
      const v={source,nodes,bus:this.bus};this.voices.add(v);source.onended=()=>this.release(v);
      source.start(at);source.stop(at+dur+.01);
    }
    destroy(){this.halt(0);this.track=null;this.noise=null;}
  }
  // This setting contains only music preference, never student work/progress.
  function preference(value){try{if(typeof value==='boolean')sessionStorage.setItem('bitbound-music',value?'on':'off');return sessionStorage.getItem('bitbound-music')!=='off';}catch{return typeof value==='boolean'?value:true;}}
  window.BitboundMusic=Object.freeze({catalog:Object.freeze(catalog),events,Player,preference});
})();
