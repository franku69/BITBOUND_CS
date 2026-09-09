/* Cinematic composition only. Sprites and architecture live in separate modules.
   Every shot declares its cast; an opening scene cannot accidentally expose the guild. */
const STORY_SHOTS=Object.freeze({
  rock:{stage:'trail',cast:[],action:'rock'},birth:{stage:'trail',cast:['hero'],action:'birth'},
  byte:{stage:'trail',cast:['hero','byte']},trail:{stage:'trail',cast:['hero','byte']},
  cage:{stage:'cell',cast:['hero','party'],action:'cage'},rescue:{stage:'cell',cast:['hero','party'],action:'rescue'},
  party:{stage:'trail',cast:['hero','party']},camp:{stage:'camp',cast:['hero','party'],action:'camp'},
  betrayal:{stage:'camp',cast:['hero','party'],action:'betrayal'},
  prison:{stage:'cell',cast:['hero','byte'],action:'prison'},escape:{stage:'cell',cast:['hero','byte'],action:'escape'},
  arrival:{stage:'hall',cast:['hero','demon'],action:'arrival'},
  reunion:{stage:'hall',cast:['hero','party','demon'],action:'reunion',elite:true},
  throne:{stage:'hall',cast:['hero','party','demon'],elite:true},
  crown:{stage:'hall',cast:['hero','party','demon'],action:'crown',elite:true},
  greed:{stage:'hall',cast:['hero','party','demon'],action:'greed',elite:true},
  fallen:{stage:'hall',cast:['hero','party','demon'],action:'fallen',elite:true},
  paladin:{stage:'hall',cast:['hero','party','demon'],action:'paladin',elite:true},
  oathEnd:{stage:'hall',cast:['hero','party','demon'],action:'oathEnd',elite:true},
  barrier:{stage:'hall',cast:['hero','demon'],action:'barrier'},
  barrierBreak:{stage:'hall',cast:['hero','demon'],action:'barrierBreak'},
  demon:{stage:'hall',cast:['hero','demon']},
  fusion:{stage:'hall',cast:['hero','demon','byte'],action:'fusion'},
  fused:{stage:'hall',cast:['hero','fused']},
  victory:{stage:'hall',cast:['hero'],action:'victory'},treasure:{stage:'hall',cast:['hero'],action:'treasure'},
  impact:{stage:'hall',cast:['hero'],action:'impact'},leap:{stage:'hall',cast:['hero'],action:'leap'},
  collapse:{stage:'trail',cast:['hero'],action:'collapse'},dawn:{stage:'trail',cast:['hero'],action:'dawn'}
});
function paintDemon(g,fused,part=null){
  const r=(c,x,y,w,h)=>storyRect(g,c,x,y,w,h),p=(c,pts)=>storyPoly(g,c,pts),gold=fused?'#b9e7d5':'#e2b481';
  // Jagged bat wings, layered ceremonial armor, long crown and a distinct fused mask.
  for(let side=0;side<2;side++){
    g.save();if(side){g.translate(96,0);g.scale(-1,1);}
    if(!part||part==='wings'){
    p('#100f23',[[44,37],[30,28],[9,13],[14,38],[0,36],[8,56],[1,66],[21,64],[22,84],[39,67]]);
    p('#4e2b49',[[37,37],[17,23],[21,42],[8,41],[16,55],[10,61],[26,58],[27,71]]);
    storyLine(g,'#a46372',1,[[35,40],[18,27],[26,56],[15,50]]);storyLine(g,'#74344f',2,[[33,44],[14,44],[23,58]]);
    }
    if(!part||part==='arms'){
    p('#171724',[[31,47],[23,52],[19,76],[25,86],[34,78],[38,58]]);p('#8a566b',[[29,52],[25,61],[25,74],[30,78],[33,60]]);
    p(gold,[[21,71],[19,81],[23,89],[25,80],[28,88],[29,77]]);}
    g.restore();
  }
  if(part==='wings'||part==='arms')return;
  p('#131520',[[33,29],[64,29],[72,50],[65,78],[75,102],[59,110],[46,102],[30,109],[21,102],[31,77],[25,49]]);
  p('#563951',[[34,33],[47,41],[62,33],[67,53],[62,74],[67,94],[56,101],[47,97],[35,102],[28,94],[35,71],[30,53]]);
  for(let i=0;i<5;i++){p(i%2?'#78455d':'#493248',[[33-i,61+i*7],[47,66+i*7],[62+i,61+i*7],[60+i,69+i*7],[47,75+i*7],[35-i,69+i*7]]);}
  p('#ad7786',[[31,37],[43,41],[47,52],[39,57],[32,50]]);p('#6b405d',[[49,43],[63,37],[64,51],[56,57],[49,53]]);
  p(gold,[[46,44],[53,52],[48,64],[41,53]]);p('#fff0cb',[[46,49],[49,53],[47,58],[44,53]]);
  p('#13151e',[[32,10],[43,5],[59,9],[65,21],[61,33],[51,38],[39,34],[32,25]]);
  p('#926c72',[[36,15],[47,11],[58,15],[61,23],[56,31],[47,34],[39,29],[35,22]]);
  p('#c18e89',[[39,17],[50,15],[58,20],[55,28],[48,31],[40,26]]);
  p('#303042',[[29,17],[25,0],[35,9],[40,4],[45,12],[49,0],[54,12],[63,3],[63,13],[72,2],[66,23],[58,17],[50,21],[40,17],[33,23]]);
  storyLine(g,gold,2,[[29,3],[34,14],[40,10],[47,17],[49,5],[53,17],[60,11],[65,15],[70,5]]);
  r('#271b2b',39,22,6,3);r('#271b2b',52,22,6,3);r('#fff1b6',40,22,5,1);r('#fff1b6',52,22,5,1);r('#784453',47,27,3,2);
  storyLine(g,'#583043',2,[[40,29],[49,31],[57,28]]);r('#e5b2a0',46,31,5,1);
  r('#26283a',28,99,13,12);r('#26283a',57,99,14,12);r(gold,26,108,17,3);r(gold,56,108,18,3);
  if(fused){
    // BYTE's second face emerges in the breastplate over Veyr's heart.
    p('#19383e',[[35,44],[47,38],[60,44],[60,60],[48,69],[35,61]]);p('#71a99a',[[38,46],[48,42],[57,47],[56,59],[48,65],[39,59]]);
    p('#213f40',[[37,47],[38,42],[42,44],[44,40],[48,44],[52,41],[57,44],[58,49],[52,46],[49,48],[45,45],[41,49]]);
    r('#122d39',40,49,5,6);r('#122d39',50,49,4,6);r('#fff1c2',41,49,3,2);r('#fff1c2',51,49,2,2);
    storyLine(g,'#163741',2,[[40,58],[47,62],[54,57]]);r('#d6f1cb',44,59,7,1);
    for(let i=0;i<3;i++){storyLine(g,'#8bdccb',1,[[29,49+i*7],[33,47+i*6],[36,49+i*5]]);storyLine(g,'#8bdccb',1,[[60,49+i*5],[64,47+i*6],[68,49+i*7]]);}
  }
}
const storyBossFrames={
  paladin:createStorySurface(62,80,g=>g.drawImage(partySprite(0,'angry',true),0,0,62,80)),
  demon:createStorySurface(96,112,g=>paintDemon(g,false)),fused:createStorySurface(96,112,g=>paintDemon(g,true))
};
function drawPlotBoss(b,x,y){
  const sprite=storyBossFrames[b.storyKind];if(!sprite)return false;
  if(b.storyKind==='paladin'){
    const motion=b.action==='recover'?'hurt':String(b.action).startsWith('telegraph')?'guard':b.action==='slam-rise'?'jump':['slam-fall','crush-fall'].includes(b.action)?'fall':Math.abs(b.vx||0)>6?'dash':Math.abs(b.vx||0)>.15?'walk':'idle';
    drawRigActor(ctx,{kind:'ally',index:0,elite:true,x:x+b.w/2,foot:y+b.h,scale:(b.h+10)/94,face:player.x<b.x?-1:1,motion,phase:(state.gameTime*2)%1,mood:'angry',armed:true});
  }else drawDemonActor(ctx,{x:x+b.w/2,foot:y+b.h,scale:(b.h+14)/112,boss:b.storyKind,motion:b.action||'idle',phase:(state.gameTime*.75)%1});
  if(b.storyKind==='fused'){
    const open=b.action==='recover';ctx.strokeStyle=open?'#ffe58b':'#a6f0e8';ctx.lineWidth=2;ctx.strokeRect(x-5,y-5,b.w+10,b.h+10);
    ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillStyle=ctx.strokeStyle;ctx.fillText(open?'CROWN OPEN — STRIKE!':'SHIELDED — DODGE',x+b.w/2,y-28);
  }return true;
}
function drawStoryRock(g,t,birth){
  const spread=birth?12+smoothStory(t)*88:smoothStory(t)*7;
  g.save();g.translate(315,0);
  for(let side=0;side<2;side++){g.save();g.scale(side?-1:1,1);g.translate(spread,0);storyPoly(g,'#243641',[[4,261],[3,79],[40,63],[72,89],[91,126],[98,204],[81,264]]);storyPoly(g,'#6c817d',[[6,87],[39,69],[58,98],[35,126],[6,136]]);storyPoly(g,'#475e60',[[7,137],[37,126],[75,112],[88,176],[78,232],[8,258]]);storyLine(g,'#a3afa0',2,[[6,88],[38,72],[57,98],[33,128],[7,136]]);storyLine(g,'#203641',3,[[56,144],[30,168],[49,208],[8,235]]);g.restore();}
  storyRect(g,'#ffe4a9',-2,83-smoothStory(t)*22,4,181+smoothStory(t)*22);g.restore();
  for(let i=0;i<20;i++)storyRect(g,i%3?'#b8b089':'#ffe3a7',287+(i*17)%60+(i%2?1:-1)*t*80,220-(i*37)%145-t*22,2+i%3,3);
}
function drawCastleCollapse(g,t){
  const castle=getCastleExterior(),fall=smoothStory(t);
  // Intact facade at t=0; roofs rotate off, masonry drops, dust gathers at t=1.
  for(let row=0;row<5;row++)for(let col=0;col<7;col++){
    const sx=col*43,sy=row*44,sign=col<3?-1:1;
    const delay=(4-row)*.06,amount=clamp((fall-delay)/(1-delay),0,1);
    const x=197+sx+sign*amount*(12+Math.abs(col-3)*17),y=49+sy+amount*amount*(170-row*18)-Math.sin(amount*Math.PI)*(row===0?50:12);
    g.save();g.translate(x+21,y+22);g.rotate(sign*amount*(row===0?.9:.24));
    g.drawImage(castle,sx,sy,43,44,-21,-22,43,44);g.restore();
  }
  for(let i=0;i<30;i++){
    const span=fall*(30+(i*47)%211),x=344+(i%2?1:-1)*span;
    g.globalAlpha=fall*(.18+(i%4)*.05);storyRect(g,i%3?'#867080':'#d5b79c',x,269-(i%6)*7,30+i%7*7,10+i%5*4);
  }g.globalAlpha=1;
}
function drawCellFront(g,gate){
  const open=gate.open||0,doorX=208,doorWidth=111;
  // Fixed bars and the sliding door are separate: opening never erases the cell.
  for(let i=0;i<11;i++){const x=332+i*27;storyRect(g,'#0b1620',x,52,5,211);storyRect(g,'#72848b',x+1,54,1,205);}
  g.save();g.beginPath();g.rect(205,47,420,219);g.clip();
  const x=doorX+open*116;
  for(let n=0;n<4;n++){storyRect(g,'#0b1620',x+n*31,52,6,211);storyRect(g,'#9da5a2',x+n*31+1,54,2,207);}
  storyRect(g,'#536975',x-1,54,doorWidth,5);storyRect(g,'#91a19f',x-1,54,doorWidth,1);
  storyRect(g,'#536975',x-1,258,doorWidth,5);storyRect(g,'#c1a772',x+1,201,14,21);storyRect(g,'#1a2935',x+6,208,4,7);
  g.restore();
  storyRect(g,'#172732',205,46,420,8);storyRect(g,'#8e9b98',205,46,420,2);
  storyRect(g,'#263b47',616,48,9,217);storyRect(g,'#697e85',617,49,2,214);
}
function drawSceneProp(g,p){
  if(p.size&&p.size!==1){g.save();g.translate(p.x,p.y);g.scale(p.size,p.size);drawSceneProp(g,{...p,x:0,y:0,size:1});g.restore();return;}
  if(p.id==='cupStone'){storyPoly(g,'#59514c',[[p.x-18,p.y],[p.x+45,p.y],[p.x+48,p.y-5],[p.x+38,p.y-7],[p.x-13,p.y-6]]);return;}
  if(p.id==='rivet'){storyRect(g,'#b0aaa0',p.x-2,p.y-1,5,3);return;}
  if(p.id==='brokenShield'){storyPoly(g,'#6d8994',[[p.x-17,p.y],[p.x-20,p.y-18],[p.x-5,p.y-24],[p.x+1,p.y-12],[p.x-5,p.y-5]]);storyPoly(g,'#9d8f70',[[p.x+3,p.y-13],[p.x+10,p.y-20],[p.x+17,p.y-13],[p.x+15,p.y],[p.x+7,p.y-1]]);return;}
  if(p.id==='ribbon'){paintWristRibbon(g,p,{wrap:0,tie:0,loose:true});return;}
  if(p.id==='pebble'){storyPoly(g,'#aa9685',[[p.x-4,p.y],[p.x-2,p.y-4],[p.x+3,p.y-3],[p.x+5,p.y],[p.x+2,p.y+3],[p.x-3,p.y+2]]);return;}
  if(p.id==='hammer'){g.save();g.translate(p.x,p.y);g.rotate(p.angle);storyRect(g,'#98734e',-2,-2,28,4);storyRect(g,'#b8c1bd',22,-7,10,14);storyRect(g,'#e1dfcf',22,-7,9,2);g.restore();return;}
  if(p.id==='fallenGear'){g.save();g.translate(p.x,p.y);g.rotate(p.angle);g.scale(.8,.8);paintAllyWeapon(g,p.index);g.restore();return;}

  if(['scroll','key','map','snack'].includes(p.id)){
    g.save();g.translate(p.x,p.y);g.rotate(p.angle||0);
    if(p.id==='scroll'){
      storyRect(g,'#7a634b',-17,-16,34,32);storyRect(g,'#d8c494',-15,-15,30,28);storyRect(g,'#f1dfad',-18,-17,36,5);storyRect(g,'#b89b72',-18,12,36,4);
      for(let i=0;i<4;i++)storyRect(g,'#7a5d4a',-10,-8+i*4,20-i%2*4,1);
    }
    if(p.id==='key'){g.strokeStyle='#e1c184';g.lineWidth=3;g.beginPath();g.arc(-9,0,5,0,Math.PI*2);g.stroke();storyLine(g,'#dec58e',3,[[-4,0],[16,0],[16,6],[11,6],[11,3]]);}
    if(p.id==='map'){storyPoly(g,'#bda981',[[-36,-9],[33,-9],[43,3],[-43,3]]);storyLine(g,'#645641',1,[[-26,-5],[-15,-2],[4,-6],[26,-2]]);for(let i=0;i<4;i++)storyRect(g,DAWN_COMPANY[i].color,-26+i*17,-6,4,4);}
    if(p.id==='snack'){storyPoly(g,'#bc8152',[[-8,-5],[3,-8],[10,-3],[8,5],[-6,6],[-10,1]]);storyLine(g,'#eed09a',2,[[-5,-4],[-2,2],[1,-5],[4,2]]);}
    g.restore();
  }else{
    // Daggers are authored around the blade, so align the grip to the palm.
    const angle=p.angle||0,offset=p.holder&&p.id==='dagger'?13:0;
    sceneProp(g,p.id,p.x+Math.sin(angle)*offset,p.y-Math.cos(angle)*offset,angle);
    if(p.id==='dagger'&&p.temperature){g.save();g.translate(p.x,p.y);g.rotate(angle);g.globalAlpha=p.temperature;storyLine(g,'#ffbb65',2,[[0,-offset-12],[0,-offset+3]]);g.restore();}
  }
}
function drawSceneAtmosphere(g,f,front=false){
  const t=f.t,has=id=>f.effects.includes(id);
  if(!front){
    if(has('campfire')){g.save();g.translate(43,0);sceneFire(g,f.visualTime??t);g.restore();}
    if(has('rock')||has('birth'))drawStoryRock(g,f.page.originBeat===3?1:t,has('birth'));
    if(has('collapse')||has('dawn'))drawCastleCollapse(g,has('dawn')?1:t);
    if(f.page.originBeat===0||f.page.originBeat===1)drawOriginGoat(g,t,f.page.originBeat===1);
    if(f.page.originBeat===3)drawOriginBird(g,t);
    if(has('troll')){
      const hit=rigEase((t-.55)/.3),x=413+hit*24,y=264;
      g.save();g.translate(x,y);g.rotate(hit*.24);
      storyPoly(g,'#0e1c26',[[-29,0],[-34,-59],[-27,-103],[-12,-118],[15,-114],[32,-89],[30,-7],[19,0]]);
      storyPoly(g,'#638160',[[-24,-15],[-25,-86],[-13,-105],[13,-102],[25,-82],[23,-20]]);
      storyPoly(g,'#9cae80',[[-22,-84],[-19,-98],[12,-103],[24,-89],[22,-72],[-16,-72]]);
      storyRect(g,'#172a28',-16,-91,9,4);storyRect(g,'#f3edc9',-13,-90,3,2);storyRect(g,'#b8c097',8,-77,6,5);
      storyRect(g,'#314941',-27,-11,19,10);storyRect(g,'#314941',7,-11,22,10);g.restore();
    }
    if(has('victory')||has('treasure'))for(let i=0;i<35;i++){const u=has('treasure')?storyWindow(t,i%5*.055,.75):1;storyRect(g,i%3?'#c89656':'#f1d184',lerp(490,260+(i*43)%315,u),lerp(232,260-i%5*4,u)-Math.sin(u*Math.PI)*15,7,3);}
    if(has('treasure'))for(let i=0;i<4;i++){const y=221-storyWindow(t,.2,.8)*32+Math.sin((f.visualTime??t)*7+i)*2;storyPoly(g,'#ecc789',[[433+i*29,y-6],[439+i*29,y],[433+i*29,y+6],[427+i*29,y]]);}
    return;
  }
  const hero=f.actors.get('hero'),leftHand=hero&&rigSocket(hero,0);
  if(has('healing')&&leftHand)sceneHealing(g,leftHand.x,leftHand.y,t);
  drawPhysicalInteraction(g,f);
  if(has('lockSpark'))for(let n=0;n<8;n++){const p=t*3%1;storyRect(g,'#d8b5f8',216+Math.cos(n*2.4)*p*24,210+Math.sin(n*2.4)*p*24,2,2);}
  if(has('gateRecall')){
    // The held beam rests above the raised palms; crawling companions pass below.
    for(let n=0;n<8;n++)storyRect(g,'#536975',244+n*17,30,4,150);storyRect(g,'#9da9a8',236,180,149,8);
    for(let n=0;n<12;n++)storyRect(g,'#b9aa88',247+n*11,192+(t*80+n*7)%39,2,2);
  }
  if(has('forge')){
    const step=f.page.forgeStep||0;
    if(step===0){g.globalAlpha=.25+.15*Math.sin(t*20);storyRect(g,'#ffc675',482,210,34,14);g.globalAlpha=1;}
    if(step===1){
      const p=f.actors.get('hero')?.phase||0;
      if(p>.51&&p<.69)for(let i=0;i<7;i++)storyRect(g,'#ffd797',492+i*3,210-(p-.51)*(110+i*25),2,2);
    }
    if(step===2)for(let i=0;i<5;i++){g.globalAlpha=.24;storyRect(g,'#c8d8d3',501+i*4,244-(t*38+i*11)%30,2,6);}g.globalAlpha=1;
  }
  if(has('crown')&&(f.crownCharge??1)>0)for(const a of f.actors.values())if(a.kind==='ally'){
    const y=a.foot-107;storyPoly(g,'#e8bce9',[[a.x-12,y],[a.x-10,y-13],[a.x-3,y-5],[a.x+2,y-17],[a.x+7,y-5],[a.x+13,y-12],[a.x+11,y]]);
    for(let n=0;n<4;n++)storyRect(g,'#c599ed77',a.x-18+n*12,258-(t*130+n*21)%110,2,5);
  }
  if(has('barrier')||has('barrierBreak'))drawArcaneBarrier(g,469,155,104,t*6,has('barrierBreak')?rigEase(t):0);
  if(has('merging')){drawArcaneBarrier(g,544,184,75,t*6,0);for(let i=0;i<7;i++)storyLine(g,'#bef2df',1,[[590,190],[560,157+i*9],[541,155]]);}
  if(has('victory'))for(let i=0;i<16;i++){const p=(t+i/16)%1;storyRect(g,'#ffe4a6',lerp(556,382,p),lerp(185+i%5*8,208,p)-Math.sin(p*Math.PI)*22,2,4);}
  if(has('impact')||has('leap'))drawSceneDestruction(g,t,has('leap'),f);
}
function drawSceneDestruction(g,t,leap,frame){
  // Masonry reacts when the fist lands; the launch breaks the ceiling later.
  const contact=leap?.23:.562;
  if(t<=contact)return;
  const p=rigEase((t-contact)/(1-contact));
  const actor=frame.actors.get('hero'),strikeHand=actor&&rigSocket({...actor,motion:'punch',phase:.48,fromMotion:null});
  g.save();g.translate(!leap&&strikeHand?strikeHand.x-343:0,0);
  for(let i=0;i<7;i++){
    const dx=(i-3)*37*p,points=[[343,264],[343+dx*.45,264+(3+i%2*4)*p],[343+dx*.8,264+(2+i%3*5)*p],[343+dx*1.7,264+(8+i%3*8)*p]];
    storyLine(g,'#060b16',4,points);storyLine(g,'#e5bd8a',1,points);
  }
  if(!leap&&p>.35)for(const side of [-1,1]){
    const u=rigEase((p-.35)/.65),x=343+side*113;
    storyLine(g,'#111221',3,[[x,263],[x-side*5,263-24*u],[x+side*7,263-45*u],[x-side*4,263-71*u],[x+side*8,263-94*u]]);
  }
  const latest=!leap&&t>=.8492?.8492:contact;
  const flash=Math.max(0,1-(t-latest)/.065);
  if(flash>0){g.save();g.globalAlpha=flash*.55;g.fillStyle='#fff0c4';g.beginPath();g.ellipse(343,262,7+flash*17,4+flash*9,0,0,Math.PI*2);g.fill();g.restore();}
  if(!leap){g.strokeStyle='#eddab0';g.lineWidth=2;g.beginPath();g.ellipse(343,264,1+p*150,1+p*22,0,0,Math.PI*2);g.stroke();}
  for(let i=0;i<24;i++){
    const dx=(i*53)%204-102,y=259-p*(leap?210:84)+p*p*((i*73)%159);
    g.save();g.translate(343+dx*p*2,y);g.rotate((i%2?1:-1)*p*2);storyRect(g,i%3?'#706474':'#baa08e',0,0,4+i%6,3+i%5);g.restore();
  }
  if(leap)for(let side=0;side<2;side++){
    g.save();g.translate(320+(side?1:-1)*p*165,-p*38);g.rotate((side?1:-1)*p*.3);
    storyPoly(g,'#3c3044',side?[[8,0],[320,0],[320,35],[43,28],[11,43]]:[[-320,0],[-8,0],[-15,44],[-61,28],[-320,36]]);g.restore();
  }
  g.restore();
}
function renderStoryGraph(g,f){
  g.save();
  if(f.camera){const c=f.camera;g.translate(320,150);g.scale(c.zoom,c.zoom);g.translate(-c.x,-c.y);}
  g.drawImage(getStoryBackdrop(f.environment||f.stage),0,0);drawCinemaBack(g,f);drawSceneAtmosphere(g,f,false);
  f.rendered=[];
  // Stable depth ordering. A single draw site is the only place an actor is painted.
  const actors=[...f.actors.values()].sort((a,b)=>(a.depth??a.foot)-(b.depth??b.foot));
  for(const actor of actors){
    if(actor.x<-110||actor.x>745||actor.foot<-130||actor.opacity===0)continue;
    g.save();g.globalAlpha=actor.opacity??1;
    if(actor.dissolve>0){
      // Pixel breakup clips the single actor draw; no ghost body or extra sprite.
      g.beginPath();for(let row=0;row<24;row++)for(let col=0;col<16;col++){
        const threshold=((row*37+col*61)%101)/100;
        if(threshold>actor.dissolve)g.rect(actor.x-40+col*5,actor.foot-120+row*5,5,5);
      }g.clip();
    }
    g.fillStyle='#00000038';g.beginPath();g.ellipse(actor.x,actor.ground??(actor.motion==='jump'||actor.foot<230?264:actor.foot),actor.scale*20,3,0,0,Math.PI*2);g.fill();
    if(actor.kind==='boss'){
      drawDemonActor(g,{...actor,phase:actor.actionPhase??((f.visualTime??f.t)*2)%1});
    }else drawRigActor(g,{...actor,precise:true});
    f.rendered.push(actor.id);g.restore();
  }
  for(const prop of f.props){
    const owner=prop.holder&&f.actors.get(prop.holder);
    const point=owner?rigSocket(owner,prop.hand??1,prop.offset):prop;
    drawSceneProp(g,{...prop,...point,angle:prop.followAngle?point.angle:prop.angle});
    if(owner){storyRect(g,rigPalette(owner).skin,point.x-2,point.y-2,4,3);}
  }
  drawSceneAtmosphere(g,f,true);drawCinemaProps(g,f);
  if(f.gate)drawCellFront(g,f.gate);
  drawDuelEffects(g,f);g.restore();
  drawStoryLight(g,f);
  if(f.transition)storyRect(g,`rgba(7,14,24,${f.transition})`,0,0,640,300);
  const caption=f.caption||f.location;if(caption){storyRect(g,'#0a1429e8',16,18,Math.min(350,caption.length*6.3+18),24);g.fillStyle='#ead6b0';g.font='10px monospace';g.fillText(caption,25,34);}
}
function drawStoryPicture(g,art,t=1,page={},ambientSeconds=0){
  const frame=applyStoryAmbient(buildStoryFrame(art,t,page),ambientSeconds);
  g.save();g.beginPath();g.rect(0,0,640,300);g.clip();g.imageSmoothingEnabled=false;
  g.clearRect(0,0,640,300);renderStoryGraph(g,frame);
  storyRect(g,'#08101c',0,0,640,7);storyRect(g,'#08101c',0,293,640,7);storyRect(g,'#b5977855',0,7,640,1);g.restore();return frame;
}

const demonParts=new Map();
function demonClawSocket(a,side=0){
  const phase=a.actionPhase??a.phase??0,scale=a.scale||1;
  const angle=lerp(Math.sin(phase*Math.PI*2)*.06,-.4-Math.sin(phase*Math.PI)*.4,a.attackWeight??1);
  const impact=a.clawImpact||0,x=32-impact*4-9*Math.cos(angle)-40*Math.sin(angle),y=49+impact*24-9*Math.sin(angle)+40*Math.cos(angle);
  return {x:a.x+((side?96-x:x)-48)*scale,y:a.foot-112*scale+(a.kneel||0)+y*scale*(1-(a.kneel||0)/(112*scale))};
}
function drawDemonActor(g,a){
  const fused=a.boss==='fused',key=fused?'fused':'demon';
  if(!demonParts.has(key))demonParts.set(key,Object.fromEntries(['wings','arms','body'].map(part=>[part,createStorySurface(96,112,c=>paintDemon(c,fused,part))])));
  const parts=demonParts.get(key),phase=a.phase||0,attack=['attack','execute','windup','slam-rise'].includes(a.motion)||String(a.motion).startsWith('telegraph'),scale=a.scale||1;
  g.save();g.translate(a.x-48*scale,a.foot-112*scale+(a.kneel||0));g.scale(scale,scale*(1-(a.kneel||0)/(112*scale)));
  for(const part of ['wings','arms'])for(let side=0;side<2;side++){
    g.save();if(side){g.translate(96,0);g.scale(-1,1);}
    const pivot=part==='wings'?{x:39,y:44}:{x:32,y:49};
    g.translate(pivot.x+(part==='arms'?(a.clawImpact||0)*-4:0),pivot.y+(part==='arms'?(a.clawImpact||0)*24:0));g.rotate(part==='wings'?-.06+Math.sin(phase*Math.PI*2)*.12:attack?lerp(Math.sin(phase*Math.PI*2)*.06,-.4-Math.sin(phase*Math.PI)*.4,a.attackWeight??1):Math.sin(phase*Math.PI*2)*.06);
    g.drawImage(parts[part],0,0,48,112,-pivot.x,-pivot.y,48,112);g.restore();
  }
  g.drawImage(parts.body,0,0);
  if(a.fusionReveal>0&&a.boss!=='fused'){g.save();g.globalAlpha=a.fusionReveal;paintDemon(g,true,'body');g.restore();}
  g.restore();
}

// Bounded foreground atmosphere: one cached overlay and at most twelve motes.
const storyLightCache=new Map();
function drawStoryLight(g,f){
  const warm=['camp','trail','valley'].includes(f.stage),key=warm?'warm':'cold';
  if(!storyLightCache.has(key))storyLightCache.set(key,createStorySurface(640,300,c=>{
    const shade=c.createLinearGradient(0,0,0,300);shade.addColorStop(0,'#030b1740');shade.addColorStop(.58,'#06121c00');shade.addColorStop(1,'#07111b38');c.fillStyle=shade;c.fillRect(0,0,640,300);
    const ray=c.createLinearGradient(0,0,420,300);ray.addColorStop(0,warm?'#ffe2a90d':'#9bc6ea0b');ray.addColorStop(1,'#00000000');c.fillStyle=ray;c.beginPath();c.moveTo(350,0);c.lineTo(445,0);c.lineTo(265,300);c.lineTo(32,300);c.closePath();c.fill();
  }));
  g.drawImage(storyLightCache.get(key),0,0);
  for(let i=0;i<12;i++){const x=27+(i*127)%610+Math.sin((f.visualTime??f.t)*2+i)*5,y=37+((i*47-(f.visualTime??f.t)*9)%215+215)%215;storyRect(g,warm?'#ead3a428':'#abcddd24',x,y,1,2);}
}
