/* Physical story interactions. Each action has anticipation, approach, contact,
 * release and a settled pose. These functions only author the scene graph.
 * Props read the same final hand sockets as the renderer; they own no clocks. */
function storyWindow(t,a,b){return rigEase((t-a)/(b-a));}
function storyHand(actor,side,x,y,weight=1){
  actor.handTargets??={};actor.handTargets[side]={x,y,weight:clamp(weight,0,1)};
}
function storyRest(actor,motion='sit',phase=0){directPose(actor,motion,phase,'idle',actor.approachEnd!==undefined?storyWindow(actor.sceneT,actor.approachEnd,actor.approachEnd+.16):1);actor.armed=false;delete actor.handTargets;}
function storyApproach(f,id,to,end=.3,start=0,from=310){
  const a=stageWalk(f,id,from,to,start,end,{face:-1,armed:false,mood:'smile'});
  a.approachEnd=end;a.sceneT=f.t;if(f.t>=end)storyRest(a,'kneel');return a;
}
function removeStoryProps(f,...ids){f.props=f.props.filter(p=>!ids.includes(p.id));}
function discardStoryEffect(f,...ids){f.effects=f.effects.filter(x=>!ids.includes(x));}
function actCloak(f){
  const t=f.t,h=f.actors.get('hero'),a=storyApproach(f,'aster',267,.3);
  storyRest(h);discardStoryEffect(f,'cloak');
  for(const id of ['mira','rook','fern']){const actor=f.actors.get(id);if(actor){storyRest(actor,'sleep');actor.mood='blink';}}
  const lift=storyWindow(t,.34,.6),settle=storyWindow(t,.7,.94);
  if(t>=.3){storyRest(a,'sit');const hand=rigSocket({...a,handTargets:undefined}),shoulder=rigBodySocket(h,45,34),own=rigBodySocket(a,22,34);
    storyHand(a,1,lerp(hand.x,shoulder.x,lift),lerp(hand.y,shoulder.y,lift));
    storyHand(a,0,own.x,own.y,lift);
    if(t>.72){a.handTargets[1].weight=1-settle;a.handTargets[0].weight=1-settle;}
  }
  f.interaction={kind:'cloak',actor:'aster',phase:t<.6?'carried':t<.75?'draping':'settled',unfold:lift,settle};
}
function actSew(f){
  const t=f.t,h=f.actors.get('hero'),together=f.page.beat==='mendTogether',id=together?'mira':'rook';
  discardStoryEffect(f,'sewing');storyRest(h,'idle');h.x=220;
  const a=storyApproach(f,id,266,.26);if(t>=.26)storyRest(a,'kneel');
  // The offered sleeve is the near forearm, never a rope across two bodies.
  const present=storyWindow(t,.08,.28);storyHand(h,1,242,220,present);
  const sleeve=rigBodySocket(h,45,46),touch=storyWindow(t,.29,.43);
  const work=clamp((t-.44)/.37,0,1),stitch=Math.sin(work*Math.PI*10)*Math.sin(Math.PI*work);
  if(t>=.26){storyHand(a,0,sleeve.x+5,sleeve.y+5,touch);storyHand(a,1,sleeve.x+3+stitch*2,sleeve.y+1-stitch*3,touch);}
  if(t>.85){const release=1-storyWindow(t,.85,1);a.handTargets[0].weight=release;a.handTargets[1].weight=release;}
  if(together){const rook=f.actors.get('rook');rook.x=333;rook.foot=258;rook.face=-1;storyRest(rook,'kneel');rook.mood=t>.55?'shock':'smile';}
  f.interaction={kind:'sew',actor:id,work,contact:t>.42&&t<.86};
}
function actRibbon(f){
  const t=f.t,h=f.actors.get('hero'),a=storyApproach(f,'fern',269,.28);
  storyRest(h);removeStoryProps(f,'ribbon');discardStoryEffect(f,'healing');
  storyHand(h,1,244,226,storyWindow(t,.1,.27));
  const touch=storyWindow(t,.29,.42),wrap=clamp((t-.56)/.25,0,1),tie=storyWindow(t,.8,.92);
  if(t>=.28){storyRest(a,'kneel');const wrist=rigSocket(h);storyHand(a,0,wrist.x-3,wrist.y+3,touch);storyHand(a,1,wrist.x+4+Math.sin(wrap*Math.PI*4)*3,wrist.y-3-Math.sin(wrap*Math.PI*4)*2,touch);}
  if(t>.92){const u=1-storyWindow(t,.92,1);a.handTargets[0].weight=u;a.handTargets[1].weight=u;}
  f.interaction={kind:'ribbon',actor:'fern',wrap,tie,healing:t>.36&&t<.58,phase:t<.56?'held':t<.81?'wrapping':t<.92?'tying':'secured'};
}
function actHesitation(f){
  const t=f.t,h=f.actors.get('hero'),a=storyApproach(f,'fern',272,.28);
  storyRest(h);removeStoryProps(f,'ribbon');storyHand(h,1,244,228);
  if(t>=.28){storyRest(a,'kneel');const w=rigSocket(h),reach=storyWindow(t,.3,.57)*(1-storyWindow(t,.62,.95));storyHand(a,1,w.x+4,w.y-2,reach);a.mood=t>.6?'sad':'calm';}
  f.interaction={kind:'wristRibbon',owner:'hero',side:1};
  const captain=f.actors.get('aster');captain.face=-1;captain.mood='calm';
}
function actHandContact(f,id,{both=false,release=true,sitting=false}={}){
  const t=f.t,h=f.actors.get('hero'),a=storyApproach(f,id,267,.27);
  storyRest(h,sitting?'sit':'idle');if(t>=.27)storyRest(a,sitting?'kneel':'idle');
  const u=storyWindow(t,.28,.45)*(release?1-storyWindow(t,.78,.98):1),y=sitting?225:214;
  storyHand(h,1,244,y,u);storyHand(a,1,244,y,u);
  if(both){h.interactionProfile=true;a.interactionProfile=true;a.x=264;storyHand(h,0,241,y-4,u);storyHand(a,0,241,y-4,u);}
  f.interaction={kind:'hands',actor:id,contact:t>.45&&t<.78,healing:both};
}
function actPlacedCup(f){
  const t=f.t,h=f.actors.get('hero'),a=storyApproach(f,'mira',266,.3);
  storyRest(h);removeStoryProps(f,'cup');
  // Mira places HER cup beside the player's on a stone; neither teleports to a palm.
  f.props.push({id:'cup',x:243,y:258});
  if(t>=.3){storyRest(a,'kneel');storyHand(a,1,261,247,storyWindow(t,.3,.66)*(1-storyWindow(t,.72,.97)));}
  if(t<.67)f.props.push({id:'cup',holder:'mira',offset:{x:0,y:5}});else f.props.push({id:'cup',x:261,y:253});
}
function actGreeting(f){
  const t=f.t,h=f.actors.get('hero'),b=f.actors.get('byte'),origin=f.page.originBeat;
  if(origin===2){
    h.opacity=storyWindow(t,.1,.2);h.foot=t>=.2&&t<.75?264-Math.sin((t-.2)/.55*Math.PI)*25:264;
    directPose(h,t<.2?'guard':t<.75?'jump':'land',t<.75?0:(t-.75)/.25,t<.75?'guard':'jump',t<.2?1:t<.75?storyWindow(t,.2,.29):storyWindow(t,.75,.85),0);
  }
  if(origin===3){directPose(h,t<.75?'wave':'listen',t<.75?t/.75:(t-.75)/.25);h.mood='smile';}
  if(origin===4){h.x=290;h.face=1;const a=stageWalk(f,'byte',620,392,0,.55,{scale:1.14,face:-1,mood:'smile'});if(t>=.55)directPose(a,'wave',(t-.55)/.45);}
  if(origin===5){
    h.x=290;h.face=1;b.x=349;b.face=-1;storyRest(h,'idle');storyRest(b,'idle');b.scale=1.14;
    const u=storyWindow(t,.12,.47),release=storyWindow(t,.68,.95);
    storyHand(h,1,315,214,u*(1-release));storyHand(b,1,315,214,u*(1-release));
    f.props.push({id:'pebble',holder:t<.55?'hero':'byte'});b.mood=t>.55?'shock':'calm';
  }
  if(origin===6){h.x=290;b.face=1;b.x=379;directPose(b,'speak',t);h.face=1;}
}
function actPrisonMeeting(f){
  if(f.stage!=='holding')return;
  const t=f.t,h=f.actors.get('hero'),beat=f.page.beat,id=STORY_CAST_IDS[STORY_BEATS[beat]?.actor??0];
  if(beat==='openGate')return;
  const a=f.actors.get(id);a.x=251;a.face=-1;
  let slot=0;for(const other of f.actors.values())if(other.kind==='ally'&&other.id!==id){other.x=352+slot++*83;other.face=-1;}
  if(beat==='wave'){directPose(a,'wave',t);if(t>.45)directPose(h,'wave',(t-.45)/.55);}
  if(beat==='salute')directPose(a,'salute',t,'idle',Math.sin(t*Math.PI));
  if(beat==='lockSpark'){a.armed=true;directPose(a,'cast',t);}
  if(beat==='warning'){
    h.x=187;const u=storyWindow(t,.16,.4)*(1-storyWindow(t,.7,.95));
    storyHand(h,1,215,215,u);storyHand(a,1,215,215,u);
  }
}
function actPoison(f){
  const t=f.t,h=f.actors.get('hero'),a=f.actors.get('aster');removeStoryProps(f,'cup');
  a.x=268;a.face=-1;storyRest(a,'idle');h.x=213;h.rotation=0;
  const handoff=storyWindow(t,.06,.3),release=storyWindow(t,.34,.43);
  if(t<.36){storyRest(h,'idle');storyHand(h,1,240,217,handoff);storyHand(a,1,240,217,handoff);storyHand(a,0,241,224,handoff);f.props.push({id:'cup',holder:t<.32?'aster':'hero'});}
  else if(t<.7){directPose(h,'drink',(t-.36)/.34);storyHand(h,1,240,217,1-storyWindow(t,.36,.44));f.props.push({id:'cup',holder:'hero'});}
  else{const fall=storyWindow(t,.7,.91);directPose(h,'hurt',fall,'idle',fall);h.rotation=-fall*Math.PI/2;h.mood='shock';const p=rigSocket({...h,rotation:0,motion:'drink',phase:1,blend:1});f.props.push({id:'cup',x:p.x+fall*24,y:lerp(p.y,260,fall),angle:fall*2.2});}
  if(t>=.32&&t<.43){storyHand(a,1,240,217,1-release);storyHand(a,0,241,224,1-release);}
}
function actTakenRibbon(f){
  const t=f.t,h=f.actors.get('hero'),a=f.actors.get('fern');removeStoryProps(f,'ribbon');
  a.x=218;a.face=-1;storyRest(a,'kneel');
  const wrist=rigSocket(h,1),touch=storyWindow(t,.06,.25),pull=storyWindow(t,.57,.87);
  storyHand(a,0,wrist.x-2,wrist.y,touch*(1-pull));storyHand(a,1,wrist.x+3+pull*9,wrist.y-4-pull*19,touch);
  f.interaction={kind:'untie',owner:'hero',actor:'fern',side:1,untie:storyWindow(t,.27,.57),pull};
}
function actClosingRibbon(f){
  const h=f.actors.get('hero'),t=f.t;
  f.stage='hall';f.effects=[];f.actors.clear();f.props=[];f.caption=null;
  stageActor(f,'hero',{x:361,motion:'idle',mood:'calm'});
  const a=f.actors.get('hero');storyHand(a,0,367,224);const work=storyWindow(t,.12,.84);
  storyHand(a,1,367+Math.sin(work*Math.PI*8)*5,222+Math.cos(work*Math.PI*8)*4,1-storyWindow(t,.88,1));
  f.interaction={kind:'selfRibbon',owner:'hero',side:0,wrap:work,tie:storyWindow(t,.8,.93)};
  for(let i=0;i<4;i++)stageActor(f,STORY_CAST_IDS[i],{x:FALLEN_PARTY_X[i],foot:264,rotation:-Math.PI/2,motion:'hurt',elite:true,armed:false,mood:'sad'});
}
function directPhysicalInteractions(f){
  const beat=f.page.beat;
  if(beat==='cloak')actCloak(f);
  else if(beat==='mend'||beat==='mendTogether')actSew(f);
  else if(beat==='ribbon')actRibbon(f);
  else if(beat==='hesitation')actHesitation(f);
  else if(beat==='healHands'){discardStoryEffect(f,'healing');removeStoryProps(f,'ribbon');actHandContact(f,'fern',{both:true,sitting:true});}
  else if(beat==='handshake'||beat==='joinHands')actHandContact(f,'aster',{release:beat==='joinHands'});
  else if(beat==='tremblingCup')actPlacedCup(f);
  else if(beat==='poison')actPoison(f);
  else if(beat==='ribbonTaken')actTakenRibbon(f);
  else if(beat==='falseForever'&&f.page.endingBeat===3)actClosingRibbon(f);
  if(beat==='keepRibbon')actRecoveredRibbon(f);
  actGreeting(f);actPrisonMeeting(f);actThroneAndEnding(f);directShotFocus(f);
  if(f.page.ribbonSide!==undefined&&!['ribbon','selfRibbon','wristRibbon','untie'].includes(f.interaction?.kind))f.wornRibbon=f.page.ribbonSide;
  return f;
}
// Ambient time never advances plot time or repeats a transfer, strike or death.
function applyStoryAmbient(f,seconds=0){
  f.ambientTime=seconds;f.visualTime=f.t+seconds*.08;
  if(!seconds)return f;
  for(const a of f.actors.values()){
    if(a.rotation||a.opacity===0||a.foot<220||a.kind==='boss'&&a.motion==='recover')continue;
    a.idleTime=seconds;
    const speaking=a.id==='hero'?f.page.speaker==='{name}':a.id==='byte'?f.page.speaker==='BYTE':a.kind==='ally'&&f.page.speaker===DAWN_COMPANY[a.index].name;
    // Facial performance keeps the authored emotion during speech.
    const blink=(seconds+(ACTOR_PHASE[a.id]||0)*5)%5.4;
    if(blink>5.19&&blink<5.32&&a.motion!=='sleep')a.mood='blink';
  }
  return directStoryPerformance(f);
}
// Small foreground props. A knot is wrist-sized; loose ends stay in the
// giver's hands until the tying phase. Cloth folds move without body copies.
function paintWristRibbon(g,w,{wrap=1,tie=1,flow=0,loose=false}={}){
  const x=w.x,y=w.y;
  if(wrap>0){storyLine(g,'#307991',3,[[x-4,y-1],[x+3,y-1],[x+4,y+2],[x-3,y+3]]);storyLine(g,'#a4e5eb',1,[[x-4,y-2],[x+3,y-2]]);}
  if(tie>0){const k=tie;storyLine(g,'#82d4e4',1.5,[[x,y],[x-4*k,y-3*k],[x-5*k,y],[x,y+1],[x+4*k,y-2*k],[x+4*k,y+1],[x,y+1]]);storyLine(g,'#86dce8',2,[[x,y+2],[x-2+Math.sin(flow)*.8,y+7*k],[x-3,y+9*k]]);storyLine(g,'#56a6c2',1.5,[[x+1,y+2],[x+3,y+6*k]]);}
  if(loose)storyLine(g,'#83d9ed',2,[[x-2,y],[x-3,y+6],[x+2,y+10]]);
}
function drawPhysicalInteraction(g,f){
  if(f.wornRibbon!==undefined&&f.actors.has('hero'))paintWristRibbon(g,rigSocket(f.actors.get('hero'),f.wornRibbon),{flow:(f.visualTime??f.t)*2});
  const it=f.interaction;if(!it)return;const h=f.actors.get(it.owner||'hero'),a=f.actors.get(it.actor),t=f.t,clock=f.visualTime??t;
  if(it.kind==='restraint'){const palm=rigSocket(a),target=rigBodySocket(f.actors.get(it.target),18,47);g.globalAlpha=it.strength;storyLine(g,'#a0efbd',2,[[palm.x,palm.y],[target.x,target.y]]);g.globalAlpha=1;}
  if(it.kind==='cloak'){
    const near=rigBodySocket(h,45,34),far=rigBodySocket(h,18,34);
    // Once released, the loose half settles across the explorer's shoulders,
    // rather than hanging entirely in the gap between the two characters.
    const edge=t<.6?rigSocket(a):{x:lerp(near.x,far.x,it.settle),y:lerp(near.y,far.y,it.settle)},
      anchor=t<.34?rigSocket(a,0):rigBodySocket(a,22,34),u=it.unfold;
    const right={x:lerp(edge.x+12,anchor.x,u),y:lerp(edge.y+2,anchor.y,u)},sway=Math.sin(clock*9)*.7;
    // Weighted fabric: anchored corners, a sagging top edge, curved hem and
    // converging folds. The cloth is held first and draped only on contact.
    const mid={x:(edge.x+right.x)/2,y:(edge.y+right.y)/2},sag=3+Math.min(5,Math.abs(right.x-edge.x)*.06);
    g.fillStyle='#774858';g.strokeStyle='#382a3c';g.lineWidth=1.5;
    g.beginPath();g.moveTo(edge.x-2,edge.y-2);
    g.quadraticCurveTo(mid.x,mid.y+sag,right.x+2,right.y-1);
    g.quadraticCurveTo(right.x+1,right.y+12,right.x-1,right.y+22);
    g.quadraticCurveTo(mid.x+sway,mid.y+30,edge.x-3+sway,edge.y+23);
    g.quadraticCurveTo(edge.x+1,edge.y+10,edge.x-2,edge.y-2);g.fill();g.stroke();
    storyPoly(g,'#654050',[[edge.x,edge.y+2],[mid.x,mid.y+sag+1],[mid.x+4+sway,mid.y+28],[edge.x+1+sway,edge.y+23]]);
    g.strokeStyle='#b47b83';g.lineWidth=1;g.beginPath();g.moveTo(edge.x,edge.y);
    g.quadraticCurveTo(mid.x,mid.y+sag+2,right.x,right.y+1);g.stroke();
    for(let i=1;i<4;i++){
      const x=lerp(edge.x,right.x,i/4),y=lerp(edge.y,right.y,i/4)+sag*Math.sin(i/4*Math.PI);
      g.strokeStyle=i%2?'#583649':'#96606e';g.lineWidth=i===2?2:1;
      g.beginPath();g.moveTo(x,y+2);g.quadraticCurveTo(lerp(x,mid.x,.22)+sway,y+12,x+sway+(i-2)*2,y+21);g.stroke();
    }
    if(t<.75){const palm=rigSocket(a);storyRect(g,rigPalette(a).skin,palm.x-2,palm.y-2,5,4);}
  }
  if(it.kind==='sew'){
    const sleeve=rigBodySocket(h,45,46),needle=rigSocket(a),work=it.work;
    storyPoly(g,'#475b65',[[sleeve.x-2,sleeve.y-2],[sleeve.x+6,sleeve.y+1],[sleeve.x+4,sleeve.y+8],[sleeve.x-3,sleeve.y+5]]);
    for(let n=0;n<5;n++)if(work>(n+1)/6)storyLine(g,'#d8d2ae',1,[[sleeve.x+n,sleeve.y+n*.7],[sleeve.x+n-1,sleeve.y+n*.7+3]]);
    if(it.contact){
      // A short curved loop next to the cloth, never a straight line across the scene.
      const d=Math.hypot(needle.x-sleeve.x,needle.y-sleeve.y);
      if(d<18){g.strokeStyle='#ddcaa3';g.lineWidth=1;g.beginPath();g.moveTo(sleeve.x+3,sleeve.y+3);g.quadraticCurveTo(sleeve.x+8,sleeve.y+8,needle.x,needle.y);g.stroke();storyLine(g,'#f2e7c5',1,[[needle.x-1,needle.y-2],[needle.x+2,needle.y+2]]);}
    }
  }
  if(it.kind==='ribbon'){
    const w=rigSocket(h);if(it.healing)sceneHealing(g,w.x,w.y,clock);
    if(it.phase==='held'){const r=rigSocket(a);paintWristRibbon(g,r,{wrap:0,tie:0,loose:true});}
    else{paintWristRibbon(g,w,{wrap:it.wrap,tie:it.tie,flow:clock*2});if(it.phase!=='secured'){const p=rigSocket(a);storyLine(g,'#84dce7',1.5,[[w.x-3,w.y+1],[p.x,p.y]]);}}
  }
  if(it.kind==='wristRibbon'||it.kind==='selfRibbon')paintWristRibbon(g,rigSocket(h,it.side),{wrap:it.wrap??1,tie:it.tie??1,flow:clock*2});
  if(it.kind==='hands'&&it.contact&&it.healing){const w=rigSocket(h);sceneHealing(g,w.x,w.y,clock);}
  if(it.kind==='untie'){
    if(it.untie<1)paintWristRibbon(g,rigSocket(h,it.side),{wrap:1,tie:1-it.untie});
    else paintWristRibbon(g,rigSocket(a),{wrap:0,tie:0,loose:true});
  }
}
function actRecoveredRibbon(f){
  const t=f.t,h=f.actors.get('hero');removeStoryProps(f,'ribbon');h.face=-1;h.x=124;
  directPose(h,t<.32?'stoop':'read',storyWindow(t,.32,.65),'stoop',storyWindow(t,.32,.54));
  if(t<.32){storyHand(h,1,100,260,storyWindow(t,0,.19));f.props.push(t<.2?{id:'ribbon',x:100,y:260}:{id:'ribbon',holder:'hero'});}
  else{
    if(t<.5)storyHand(h,1,100,260,1-storyWindow(t,.32,.5));
    if(t<.54)f.props.push({id:'ribbon',holder:'hero'});
    const wrist=rigSocket(h,0);if(t>=.5)storyHand(h,1,wrist.x+Math.sin(t*45)*3,wrist.y-2,storyWindow(t,.5,.62)*(1-storyWindow(t,.9,1)));
    f.interaction={kind:'selfRibbon',owner:'hero',side:0,wrap:storyWindow(t,.53,.72),tie:storyWindow(t,.72,.9)};
  }
}
function actThroneAndEnding(f){
  const t=f.t,h=f.actors.get('hero');if(!h)return;
  if(f.page.rivalBeat===4){const a=f.actors.get('fern');a.x=HALL_PARTY_X[3]+storyWindow(t,.05,.4)*9-storyWindow(t,.55,.9)*4;a.mood=t>.55?'sad':'shock';}
  if(f.page.rivalBeat===8){
    const a=f.actors.get('fern'),r=f.actors.get('rook');a.x=98;a.armed=false;const sleeve=rigBodySocket(r,18,47);storyHand(a,1,sleeve.x,sleeve.y,storyWindow(t,.15,.42));
    f.interaction={kind:'restraint',actor:'fern',target:'rook',strength:storyWindow(t,.34,.65)};
  }
  if(f.page.fusionStage===5){
    const b=f.actors.get('byte');if(b){const grip=storyWindow(t,.1,.36);storyHand(b,1,549,139,grip);storyHand(b,0,533,142,grip);}
  }
  if(f.page.art==='impact'){
    // Two complete wind-up/contact/recovery cycles. The first foot braces on
    // the lowest stair; both contacts use the same foundation position.
    h.x=lerp(370,400,storyWindow(t,0,.25));h.footLift=[7*storyWindow(t,.17,.25),0];
    let phase=t<.65?(t-.25)/.65:t<.71?lerp((.65-.25)/.65,1,storyWindow(t,.65,.71)):(t-.71)/.29;
    directPose(h,t<.25?'walk':'punch',t<.25?Math.abs(h.x-370)/42%1:clamp(phase,0,1));
    if(t<.25){h.fromMotion='idle';h.fromPhase=0;h.blend=clamp((.25-t)/.08,0,1);}
    f.strikes=[.562,.8492];
  }
  if(f.page.art==='leap'&&t>=.23){h.fromMotion='land';h.fromPhase=0;h.blend=storyWindow(t,.23,.34);}
  if(f.page.art==='impact'&&t>=.25&&t<.34){h.fromMotion='idle';h.fromPhase=0;h.blend=storyWindow(t,.25,.34);}
  if(f.page.endingBeat===8||f.page.endingBeat===7)f.interaction={kind:'wristRibbon',owner:'hero',side:0};
}
function directShotFocus(f){
  const close=['cloak','mend','mendTogether','ribbon','healHands','handshake','joinHands','tremblingCup','hesitation'].includes(f.page.beat);
  if(close){const push=storyWindow(f.t,.08,.38);f.camera={x:lerp(320,268,push),y:lerp(150,198,push),zoom:1+.52*push};}
  if(f.page.originBeat===5){const push=storyWindow(f.t,0,.25);f.camera={x:320,y:150+push*30,zoom:1+.35*push};}
}
