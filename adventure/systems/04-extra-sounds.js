/* Short synthesized cues: no downloads, loops or per-creature audio contexts.
   At most one new creature cue every 100ms, with the existing engine voice cap. */
const CREATURE_VOICES=Object.freeze({bubble:[260,-150,'sine'],chirp:[880,-220,'triangle'],
  croak:[150,65,'triangle'],flutter:[640,210,'sine'],clank:[190,-70,'square'],
  rattle:[310,-160,'triangle'],wisp:[760,290,'sine'],chomp:[120,-55,'sawtooth']});
const ACTION_CUES=Object.freeze({
  heavy:[{freq:105,dur:.10,type:'triangle',gain:.030,slide:-55},{freq:190,dur:.05,type:'square',gain:.013}],
  arc:[{freq:460,dur:.09,type:'sine',gain:.025,slide:390},{freq:790,dur:.045,type:'triangle',gain:.016}],
  saw:[{freq:210,dur:.07,type:'sawtooth',gain:.019,slide:130}],
  shield:[{freq:390,dur:.07,type:'sine',gain:.026,slide:150,wait:.06},{freq:650,dur:.13,type:'sine',gain:.023,slide:160}],
  petHeal:[{freq:520,dur:.06,type:'triangle',gain:.020,slide:90,wait:.065},{freq:780,dur:.08,type:'sine',gain:.022,slide:90}],
  softLand:[{freq:87,dur:.04,type:'triangle',gain:.022,slide:-30}],
  hardLand:[{freq:67,dur:.11,type:'triangle',gain:.031,slide:-36},{freq:150,dur:.045,type:'square',gain:.010}],
  grassStep:[{freq:115,dur:.025,type:'triangle',gain:.012,slide:-45}],
  stoneStep:[{freq:210,dur:.025,type:'square',gain:.010,slide:-95}]
});
const CREATURE_CUES=Object.freeze(Object.fromEntries(Object.entries(CREATURE_VOICES).map(([id,[freq,slide,type]])=>[
  id,Object.freeze({attack:[{freq,dur:.075,type,gain:.018,slide}],defeat:[
    {freq:freq*.85,dur:.09,type,gain:.022,slide:-freq*.45,wait:.06},
    {freq:freq*.45,dur:.08,type:'triangle',gain:.015,slide:-freq*.15}]})
])));
let creatureSoundAt=-Infinity;
function playCreatureCue(voice,event){
  const now=performance.now();if(now<creatureSoundAt||!AudioEngine.sfxEnabled||AudioEngine.background||document.hidden)return;
  const sequence=CREATURE_CUES[voice]?.[event];if(!sequence)return;
  creatureSoundAt=now+100;AudioEngine.sequence(sequence);
}
function playActionCue(name){const cue=ACTION_CUES[name];if(cue)AudioEngine.sequence(cue);}
function playLandingSound(speed){playActionCue(speed>10?'hardLand':'softLand');}
function playFootstep(){
  const tile=getTile(Math.floor((player.x+player.w/2)/TILE),Math.floor((player.y+player.h+2)/TILE));
  playActionCue(tile===Tile.DIRT||tile===Tile.WOOD?'grassStep':'stoneStep');
}
