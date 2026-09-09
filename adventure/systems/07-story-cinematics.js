/* Shot direction and physical set pieces. No animation timers live here.
 * One scene graph owns each actor. Timed actions are sampled, never replayed;
 * camera, light, props and sound all read the same normalized story clock. */
const CINEMA_CAST=['hero','aster','mira','rook','fern','byte'];
function cinemaPulse(t,start,peak,end){return storyWindow(t,start,peak)*(1-storyWindow(t,peak,end));}
function cinemaPose(actor,motion,t,start=.08,end=.88){
  if(!actor)return;
  const phase=clamp((t-start)/(end-start),0,1),blend=storyWindow(t,start,start+.12)*(1-storyWindow(t,end-.12,end));
  directPose(actor,motion,phase,'listen',blend,.4);
}
function cinemaPropPoint(f,prop){return prop.holder?rigSocket(f.actors.get(prop.holder),prop.hand??1,prop.offset):prop;}
function cinemaSet(f,kind){f.environment=kind;}
function cinemaPrison(f){
  const page=f.page,t=f.t,h=f.actors.get('hero');if(!h)return;
  const isCell=f.stage==='prison';if(!isCell)return;
  const initial=page.shotId==='betrayal:6'||page.byteExit;
  if(initial){
    f.props=[];discardStoryEffect(f,'prison');h.x=335;h.face=-1;h.armed=false;h.mood='sad';
    directPose(h,'prison',t,'prison',1);h.phase=t;
    const pull=cinemaPulse(t,.22,.44,.69);storyHand(h,0,356+pull*7,232-pull*5);storyHand(h,1,322-pull*6,230-pull*4);
    const b=stageWalk(f,'byte',103,182,0,.24,{foot:264,face:1,scale:1.14,armed:false,mood:'calm'});
    if(t>=.24){cinemaPose(b,'speak',t,.24,.62);storyHand(b,1,208,203,cinemaPulse(t,.28,.4,.62));b.mood=t>.42?'grin':'angry';}
    f.restraints={owner:'hero',anchors:[{x:365,y:202},{x:324,y:200}],release:0};
    f.prisonAction={kind:page.byteExit?'discard-and-leave':'taunt',phase:t};
    if(page.byteExit){
      // Parchment is nudged UNDER the door, not teleported through iron.
      const kick=storyWindow(t,.23,.41);b.footLift=[0,6*cinemaPulse(t,.19,.26,.42)];
      f.props.push({id:'scroll',x:lerp(182,322,kick),y:261-Math.sin(kick*Math.PI)*6,angle:lerp(-.07,.12,kick),size:.43});
      if(t>=.48&&t<.6){const fold=storyWindow(t,.48,.58);storyHand(b,0,182,216,fold);storyHand(b,1,182,216,fold);}
      if(t>=.6){const u=storyWindow(t,.6,.82);b.x=lerp(182,-78,u);b.foot=264-u*72;b.face=-1;
        directPose(b,'jump',0,'listen',storyWindow(t,.6,.68),.4);b.opacity=1-storyWindow(t,.8,.9);b.mood='grin';delete b.handTargets;const unfold=1-storyWindow(t,.61,.73);storyHand(b,0,b.x,b.foot-48,unfold);storyHand(b,1,b.x,b.foot-48,unfold);
      }
    }
    const zoom=storyWindow(t,.06,.25)*(page.byteExit?1-storyWindow(t,.58,.74):1);
    f.camera={x:320-zoom*47,y:150+zoom*32,zoom:1+zoom*.26};
  }
  if(page.beat==='scroll'){
    // Still chained: the readable parchment is close to the knees.
    h.x=335;h.face=-1;h.armed=false;h.mood='sad';f.props=[];
    directPose(h,t<.35?'stoop':'prison',0,'stoop',storyWindow(t,.35,.6),0);
    const reach=storyWindow(t,.04,.27),lift=storyWindow(t,.32,.64);
    storyHand(h,1,322,lerp(260,225,lift),reach);storyHand(h,0,346,230,storyWindow(t,.4,.68));
    f.props.push(t<.28?{id:'scroll',x:322,y:260,angle:.12,size:.43}:{id:'scroll',holder:'hero',size:.56});
    f.restraints={owner:'hero',anchors:[{x:365,y:202},{x:324,y:200}],release:0};
    f.prisonAction={kind:'read',phase:t};f.camera={x:360,y:203,zoom:1.56};
  }
  if(page.forgeAction)cinemaForge(f,page.forgeAction);
}
function cinemaForge(f,action){
  const t=f.t,h=f.actors.get('hero');f.props=[];delete h.handTargets;h.armed=false;h.face=1;h.mood='calm';f.actors.delete('byte');
  discardStoryEffect(f,'forge','scroll');f.prisonAction={kind:action,phase:t};
  if(action==='inspect'){
    h.x=335;h.face=-1;directPose(h,'prison',0);
    const pry=storyWindow(t,.3,.62);storyHand(h,0,347,231);storyHand(h,1,347-pry*5,228-pry*5,storyWindow(t,.09,.3));
    f.props.push({id:'dagger',holder:'hero',angle:-1.1+pry*.4});
    f.restraints={owner:'hero',anchors:[{x:365,y:202},{x:324,y:200}],release:storyWindow(t,.58,.76)};
    if(t>.58)f.props.push({id:'rivet',x:348,y:lerp(229,260,storyWindow(t,.58,.76))});
    f.camera={x:349,y:205,zoom:1.58};return;
  }
  h.x=485;h.face=1;f.restraints={owner:'hero',anchors:[{x:365,y:202},{x:324,y:200}],release:1};
  if(action==='heat'){
    directPose(h,'kneel',0,'idle',storyWindow(t,0,.2),0);
    const dip=cinemaPulse(t,.12,.42,.92);storyHand(h,1,lerp(499,488,dip),lerp(217,240,dip));
    f.props.push({id:'dagger',holder:'hero',angle:Math.PI/2,temperature:storyWindow(t,.35,.72)});
    f.prisonAction.heat=storyWindow(t,.35,.72);
  }else if(action==='hammer'){
    // Three deliberate strokes, starting and ending with the same resting grip.
    const phase=t<.14?0:t>.86?1:(t-.14)/.24%1;
    directPose(h,'forge',phase);h.x=447;
    f.props.push({id:'dagger',x:502,y:211,angle:Math.PI/2,temperature:1});
    f.props.push({id:'hammer',holder:'hero',followAngle:true});
    f.prisonAction.contacts=[.272,.512,.752];
  }else if(action==='quench'){
    const walk=storyWindow(t,0,.25);h.x=lerp(465,507,walk);
    directPose(h,t<.25?'walk':'kneel',t<.25?(h.x-465)/42:0,'idle',t<.25?Math.sin(walk*Math.PI):storyWindow(t,.25,.39),0);
    const dip=storyWindow(t,.37,.57),rise=storyWindow(t,.65,.91);storyHand(h,1,533,lerp(lerp(215,229,dip),217,rise),storyWindow(t,.25,.36));
    f.props.push({id:t<.91?'dagger':'key',holder:'hero',angle:t<.91?Math.PI:0,temperature:1-storyWindow(t,.53,.7)});
    f.prisonAction.steam=cinemaPulse(t,.53,.62,.88);
  }
  f.camera={x:474,y:204,zoom:1.56};
}
function cinemaEscape(f){
  const t=f.t,n=f.page.escapeBeat,h=f.actors.get('hero');if(n===undefined||!h)return;
  if(n===0){
    f.props=[];h.x=242;h.face=-1;h.armed=false;delete h.handTargets;
    directPose(h,'reach',1);storyHand(h,1,216,212);
    const turn=storyWindow(t,.12,.29);f.gate.open=storyWindow(t,.3,.6);
    if(t<.6)f.props.push({id:'key',x:216,y:212,angle:Math.sin(turn*Math.PI)*.65});
    else{const u=storyWindow(t,.6,1);h.x=lerp(242,155,u);directPose(h,'walk',(242-h.x)/42%1,'reach',storyWindow(t,.6,.73),1);
      storyHand(h,1,216+(h.x-242),212,1-storyWindow(t,.6,.75));f.props.push({id:'key',holder:'hero'});}
    f.prisonAction={kind:'open',phase:t};
  }
  if(n===1){h.face=-1;cinemaPose(h,'offer',t,.54,.95);f.props.push({id:'key',holder:'hero'});}
  if(n===2){
    // BYTE blocks the corridor. The hero approaches; BYTE yields before the
    // protagonist crosses his position. Bodies never walk through each other.
    const b=f.actors.get('byte');h.x=lerp(155,123,storyWindow(t,.06,.35));h.face=-1;
    if(t<.35)directPose(h,'walk',(155-h.x)/42%1,'idle',Math.sin(storyWindow(t,.06,.35)*Math.PI));else cinemaPose(h,'speak',t,.36,.8);
    b.x=78-storyWindow(t,.65,.92)*18;b.foot=264;b.face=1;cinemaPose(b,'guard',t,.04,.62);b.mood='angry';
    f.props.push({id:'key',holder:'hero'});f.camera={x:155,y:197,zoom:1.52};
  }
}
function cinemaFusion(f){
  const stage=f.page.fusionStage,t=f.t;if(stage===undefined)return;
  const h=f.actors.get('hero'),d=f.actors.get('demon');if(!h||!d)return;
  discardStoryEffect(f,'merging');h.face=1;h.armed=true;h.x=395;
  d.x=541;d.foot=264;d.scale=1.2;
  f.fusion={stage,charge:0,absorb:0,seal:0,crown:{x:541,y:155},heart:{x:541,y:199}};
  if(stage<5){
    const b=stageActor(f,'byte',{x:476,foot:264,scale:1.14,face:stage<2?1:-1,motion:'listen',phase:.4,armed:false,mood:stage<2?'shock':'angry'});
    if(stage===0){b.x=lerp(685,476,storyWindow(t,.05,.65));directPose(b,'run',(685-b.x)/42%1,'listen',cinemaPulse(t,.05,.2,.75),.4);h.x=395-12*storyWindow(t,.3,.57);cinemaPose(h,'guard',t,.2,.85);}
    else if(stage===1){cinemaPose(b,'speak',t,.05,.83);b.face=1;}
    else if(stage===2){cinemaPose(h,'speak',t,.1,.82);h.armed=false;cinemaPose(b,'guard',t,.25,.8);}
    else if(stage===3){cinemaPose(b,'speak',t,.04,.88);const point=cinemaPulse(t,.12,.45,.79);storyHand(b,1,447,206,point);}
    else if(stage===4){cinemaPose(h,'speak',t,.02,.65);h.armed=false;b.mood=t>.5?'shock':'angry';cinemaPose(b,'guard',t,.5,.95);}
    d.kneel=8;d.headDip=.05;f.fusion.crown.y+=8;
    f.camera={x:490,y:182,zoom:1.21};return;
  }
  if(stage===5){
    // The king kneels first. BYTE climbs a stair, puts both hands ON the crown,
    // then dissolves from the contact point into the chest. One body throughout.
    d.kneel=18;f.fusion.crown={x:541,y:173};
    const b=stageActor(f,'byte',{x:lerp(476,525,storyWindow(t,0,.28)),foot:264-storyWindow(t,.2,.31)*7,scale:1.14,face:1,motion:'walk',armed:false,mood:'angry'});
    delete b.handTargets;
    directPose(b,t<.28?'walk':'brace',t<.28?(b.x-476)/42:0,'listen',t<.28?Math.sin(storyWindow(t,0,.28)*Math.PI):storyWindow(t,.28,.39),.4);
    b.depth=310;const grip=storyWindow(t,.29,.43);storyHand(b,0,533,172,grip);storyHand(b,1,549,172,grip);
    const absorb=storyWindow(t,.52,.85),seal=storyWindow(t,.84,.96);
    b.dissolve=absorb;b.opacity=1-absorb*.25;f.fusion.charge=storyWindow(t,.4,.53);f.fusion.absorb=absorb;f.fusion.seal=seal;
    if(absorb>=1)f.actors.delete('byte');
    d.fusionReveal=seal;d.kneel=18*(1-seal);if(seal>=1)d.boss='fused';
    directPose(h,'guard',0);h.x=395-8*storyWindow(t,.54,.79);
    f.camera={x:lerp(475,494,storyWindow(t,.05,.43)),y:177,zoom:1.2+cinemaPulse(t,.24,.58,1)*.16};
  }else{
    f.actors.delete('byte');d.boss='fused';d.kneel=0;
    // Warning -> claw impact -> exposed crown -> recovery uses ONE clock.
    const wind=storyWindow(t,.13,.42),impact=storyWindow(t,.42,.48),recover=storyWindow(t,.61,.9);
    d.motion='attack';d.actionPhase=wind*.45+impact*.42+recover*.13;
    d.attackWeight=wind*(1-recover);d.clawImpact=impact*(1-recover);
    h.x=395-24*storyWindow(t,.17,.45);cinemaPose(h,'guard',t,.08,.98);f.fusion.seal=1;
    f.fusion.warning=cinemaPulse(t,.1,.32,.46);
    f.fusion.strike=cinemaPulse(t,.45,.48,.62);
    f.fusion.impactPoint=demonClawSocket(d);
    f.fusion.demo=cinemaPulse(t,.48,.65,.91);
    f.camera={x:484+Math.sin(t*170)*f.fusion.strike*1.6,y:171,zoom:1.16};
  }
}
function cinemaGroupActing(f){
  const t=f.t,p=f.page,h=f.actors.get('hero');if(!h)return;
  // Every spoken page gets a listening response, but props keep full authority
  // over their hands. No character rotates halfway through a handover.
  const subject=p.speaker==='{name}'?'hero':p.speaker==='BYTE'?'byte':STORY_CAST_IDS.find(id=>id===String(p.speaker).toLowerCase());
  for(const a of f.actors.values()){
    if(a.kind==='boss'||a.rotation||a.id==='byte'&&p.byteExit)continue;
    const target=f.actors.get(subject);
    a.lookTilt=target&&target!==a?clamp((target.x-a.x)/700,-.06,.06)*cinemaPulse(t,.06,.43,.94):0;
    if(!a.handTargets&&!a.armed&&['idle','listen'].includes(a.motion)){
      a.idleTime=t*4+(ACTOR_PHASE[a.id]||0); // small breathing, no repeated wave.
      if(a.id===subject)cinemaPose(a,'speak',t,.1,.88);
    }
  }
  if(p.beat==='battlePlan'||p.beat==='promiseMeal'){
    const id=p.beat==='battlePlan'?'mira':'aster',a=f.actors.get(id);
    if(a&&t>.26){const u=cinemaPulse(t,.29,.62,.94);storyHand(a,1,266,248,u);storyHand(h,1,239,246,u*.8);}
    f.mapRoute={reveal:storyWindow(t,.3,.75),keep:p.beat==='promiseMeal'};
  }
  if(p.beat==='invite'){const u=cinemaPulse(t,.49,.68,.96);h.lookTilt=-.055*u;}
  if(p.beat==='knuckles'){const a=f.actors.get('rook');if(a&&t>.27){const u=cinemaPulse(t,.3,.55,.89);storyHand(a,0,a.x,214,u);storyHand(a,1,a.x,214,u);}}
  if(p.beat==='cups'){
    const a=f.actors.get('mira');if(a){
      f.props=f.props.filter(x=>x.id!=='cup');a.x=284;a.face=-1;storyRest(a,'kneel');
      f.props.push({id:'cupStone',x:256,y:253});
      const base=rigSocket({...a,handTargets:undefined});
      const slot=Math.min(4,Math.max(0,Math.floor((t-.04)/.18))),start=.04+slot*.18,place=start+.11,end=start+.18;
      const positions=[249,259,269,279,289],x=positions[slot];
      const u=storyWindow(t,start,place)*(1-storyWindow(t,place,end));
      storyHand(a,1,x,240,u);
      for(let i=0;i<5;i++){
        if(t>=.04+i*.18+.11)f.props.push({id:'cup',x:positions[i],y:245,size:.38});
        else if(i===slot&&t>=start){f.props.push({id:'cup',holder:'mira',offset:{x:0,y:5},size:.38});}
      }
    }
  }
  if(p.beat==='coldCaptain'){const a=f.actors.get('aster');cinemaPose(a,'speak',t);h.mood='sad';}
  if(p.beat==='gateRegret'&&f.stage!=='dungeon'){/* memory owns its cast */}
  if(p.beat==='abandon')for(const a of f.actors.values())if(a.kind==='ally')a.opacity=1-storyWindow(Math.max(0,a.x-650),0,80);
  const n=p.rivalBeat;
  if(n===2||n===3||n===5){const id=n===2?'rook':n===3?'mira':'aster',a=f.actors.get(id);if(a){a.face=1;cinemaPose(a,n===3?'guard':'speak',t);a.armed=n!==5;}}
  if(n===6){for(const a of f.actors.values())if(a.kind==='ally'){cinemaPose(a,'guard',t,.05,.91);a.mood=t>.5?'shock':'calm';}f.crownCharge=storyWindow(t,.12,.85);}
  if(n===7){for(const a of f.actors.values())if(a.kind==='ally'){cinemaPose(a,'guard',t,.06,.88);a.mood='shock';}f.crownCharge=1;}
  if(n===10){const a=f.actors.get('aster');cinemaPose(a,'speak',t);a.mood='angry';a.armed=true;}
  if(n===11){const a=f.actors.get('aster');cinemaPose(a,'guard',t);h.face=-1;cinemaPose(h,'guard',t,.15,.97);}
  if(p.shotId==='paladinFall:0'){
    const a=f.actors.get('aster');a.rotation=0;a.x=336;directPose(a,'kneel',0,'guard',storyWindow(t,.13,.66),0);a.armed=false;a.mood='sad';
    removeStoryProps(f,'fallenGear');for(const id of ['mira','rook','fern']){const ally=f.actors.get(id);if(ally)f.props.push({id:'fallenGear',index:ally.index,x:ally.x-20,y:261,angle:Math.PI/2});}
    f.props.push({id:'brokenShield',x:335,y:263});
    f.oathLight=storyWindow(t,.24,.82);
  }
  if(p.shotId==='barrier:1'){h.x=lerp(380,411,storyWindow(t,.1,.8));cinemaPose(h,'walk',t);h.armed=false;}
  if(p.shotId==='barrier:2'){cinemaPose(h,'guard',t);f.bossWarning=cinemaPulse(t,.12,.46,.9);}
  if(p.shotId==='ending:1'){cinemaPose(h,'brace',t,.02,.85);h.armed=false;}
  if(p.shotId==='ending:2'){h.x=lerp(410,450,storyWindow(t,.05,.6));cinemaPose(h,'walk',t,.05,.6);}
  if(p.shotId==='ending:8'){cinemaPose(h,'wave',t,.12,.93);h.motion='jump';h.phase=0;storyHand(h,1,h.x+30,h.foot-73,cinemaPulse(t,.18,.55,.94));}
}
function directCinematicStory(f){
  const p=f.page,t=f.t;
  cinemaPrison(f);cinemaEscape(f);cinemaGroupActing(f);cinemaFusion(f);
  if(p.shotId){
    const scene=p.shotId.split(':')[0];f.shotId=p.shotId;f.location=p.location;
    if(f.stage==='camp')cinemaSet(f,scene==='camp2'?'cavernCamp':scene==='camp3'?'keepCamp':scene==='rescue'?'valley':'camp');
    if(scene==='origin')cinemaSet(f,'valley');
    // Each shot has an authored target and lens. Existing close interaction
    // framing remains authoritative; memory cuts retain their original timing.
    if(!f.camera&&p.camera){const c=p.camera,u=storyWindow(t,.02,.88);f.camera={x:lerp(320,c.x,u),y:lerp(150,c.y,u),zoom:lerp(1,c.zoom,u)};}
  }
  if(f.gate&&f.prisonAction?.kind!=='open')f.gate.open=f.gate.open||0;
  return f;
}
function drawCinemaBack(g,f){
  if(f.environment==='cavernCamp'||f.environment==='keepCamp'){
    const x=348;g.save();g.globalAlpha=.09;g.fillStyle='#ffc87f';g.beginPath();g.ellipse(x,259,120,75,0,0,Math.PI*2);g.fill();g.restore();
  }
  if(f.fusion?.stage===5){const v=f.fusion;g.save();g.globalAlpha=v.charge*(1-v.seal)*.22;g.fillStyle='#222941';g.fillRect(0,0,640,300);g.restore();}
}
function drawChain(g,start,end,sag=8){
  const n=12;
  for(let i=0;i<n;i++){const u=i/n,x=lerp(start.x,end.x,u),y=lerp(start.y,end.y,u)+Math.sin(u*Math.PI)*sag;
    g.strokeStyle=i%2?'#73878e':'#a3b1af';g.lineWidth=1;g.beginPath();g.ellipse(x,y,i%2?2:3,i%2?3:2,0,0,Math.PI*2);g.stroke();}
}
function drawCinemaProps(g,f){
  const t=f.t,h=f.actors.get('hero');
  if(f.restraints&&h){const r=f.restraints;
    for(let side=0;side<2;side++){const hand=rigSocket(h,side),anchor=r.anchors[side],end={x:lerp(hand.x,anchor.x+4,r.release),y:lerp(hand.y,259,r.release)};
      storyRect(g,'#73858a',anchor.x-4,anchor.y-3,8,7);storyRect(g,'#142732',anchor.x-1,anchor.y-1,2,3);drawChain(g,anchor,end,7+5*r.release);
      storyLine(g,'#b5bdb1',3,[[end.x-4,end.y-2],[end.x+3,end.y-2],[end.x+4,end.y+3],[end.x-3,end.y+4]]);
    }
  }
  const action=f.prisonAction;
  if(action?.kind==='hammer')for(const at of action.contacts){const u=(t-at)/.075;if(u>0&&u<1)for(let i=0;i<8;i++){
    const ang=-Math.PI*.95+i*.35;storyLine(g,'#ffdc8e',1,[[502+Math.cos(ang)*u*20,210+Math.sin(ang)*u*20+u*u*11],[502+Math.cos(ang)*(u*20+3),210+Math.sin(ang)*(u*20+3)+u*u*11]]);
  }}
  if(action?.steam){g.save();g.globalAlpha=action.steam*.45;for(let i=0;i<7;i++)storyLine(g,'#cee3dd',2,[[530+i*2,251],[528+i*3,240-i%3*4],[533+i*2,229-i%3*4]]);g.restore();}
  if(f.mapRoute){const u=f.mapRoute.reveal;storyLine(g,'#d7a765',1,[[228,257],[238,253],[248,255],[248+u*20,255-u*7]]);}
  if(f.bossWarning){g.save();g.globalAlpha=f.bossWarning;storyPoly(g,'#c7486555',[[410,266],[459,266],[471,277],[400,277]]);storyLine(g,'#ecad8b',1,[[405,273],[462,273]]);g.restore();}
  if(f.oathLight)for(let i=0;i<7;i++){const u=clamp((f.oathLight-i*.04)/.72,0,1);if(u>0&&u<1)storyRect(g,'#f6dbae',lerp(336,403,u),215-Math.sin(u*Math.PI)*26,2,3);}
  drawFusionCinema(g,f);
}
function drawFusionCinema(g,f){
  const v=f.fusion;if(!v)return;const t=f.t,c=v.crown,heart=v.heart;
  if(v.stage<5){storyLine(g,'#f1d394',1,[[c.x-1,c.y-16],[c.x+3,c.y-10],[c.x-2,c.y-4],[c.x+1,c.y+1]]);return;}
  if(v.stage===5){
    if(v.charge>0&&v.seal<1){
      const b=f.actors.get('byte');
      if(b)for(let side=0;side<2;side++){const palm=rigSocket(b,side);storyLine(g,'#a1eedf',1.5,[[palm.x,palm.y],[c.x+(side?3:-3),c.y-5]]);}
      const count=16;for(let i=0;i<count;i++){
        const start=i*.016,end=start+.64,u=clamp((v.absorb-start)/(end-start),0,1);if(u<=0||u>=1)continue;
        const angle=i*2.4+u*4,x=lerp(c.x,heart.x,u)+Math.sin(angle)*Math.sin(u*Math.PI)*(17+i%4*3),y=lerp(c.y-8,heart.y,u);
        storyLine(g,i%2?'#94dacc':'#6488d3',1.5,[[x-2*Math.cos(angle),y-3],[x,y],[x+2*Math.cos(angle),y+3]]);
      }
      for(let i=0;i<9;i++){const u=v.absorb,a=i*Math.PI*2/9;storyLine(g,'#7bb6c3',1,[[heart.x+Math.cos(a)*(45*(1-u)+5),heart.y+Math.sin(a)*(40*(1-u)+5)],[heart.x+Math.cos(a)*7,heart.y+Math.sin(a)*7]]);}
    }
    const burst=cinemaPulse(t,.85,.88,.97);if(burst){g.save();g.globalAlpha=burst*.64;g.strokeStyle='#e2fff0';g.lineWidth=2;g.beginPath();g.ellipse(541,201,16+(1-burst)*75,24+(1-burst)*30,0,0,Math.PI*2);g.stroke();g.restore();}
  }
  if(v.stage===6){
    if(v.warning){g.save();g.globalAlpha=v.warning*.7;storyLine(g,'#e66a7f',2,[[512,267],[570,267]]);g.restore();}
    if(v.strike){const hit=v.impactPoint;g.save();g.globalAlpha=v.strike;storyLine(g,'#fff0c1',2,[[hit.x-7,264],[hit.x-17,267],[hit.x,270],[hit.x+9,266],[hit.x+24,273]]);
      for(let i=0;i<10;i++){const u=1-v.strike,x=hit.x+(i-5)*u*12,y=hit.y-Math.sin(u*Math.PI)*(8+i%3*6);storyRect(g,i%2?'#d8b88b':'#776783',x,y,2+i%2,3);}g.restore();}
  }
  if(v.stage===6&&v.demo>0){g.save();g.globalAlpha=v.demo*.7;g.strokeStyle='#f7d78a';g.lineWidth=2;g.beginPath();g.arc(541,145,24,-2.7,-.4);g.stroke();g.restore();}
}
