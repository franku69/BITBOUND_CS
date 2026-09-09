/* Four bounded ally state machines. Target selection O(enemies), at most 18.
   Windup, release and recovery share one clock with the visible rig animation. */
const PARTY_ROLES=Object.freeze([
  {range:64,reach:62,cooldown:2.5,duration:.7,release:.52,damage:2,motion:'attack'},
  {range:285,cooldown:2.8,duration:.85,release:.48,damage:2,motion:'cast'},
  {range:64,reach:72,cooldown:2.1,duration:.78,release:.52,damage:3,motion:'attack'},
  {range:240,cooldown:3.8,duration:1,release:.48,damage:1,motion:'cast'}
]);
const partyActors=DAWN_COMPANY.map((member,index)=>({...member,index,x:0,y:0,vx:0,vy:0,face:1,onGround:true,motion:'idle',phase:0,actionTime:0,cooldown:2+index,heal:0,attack:null}));
function partyActive(){return plotState().partyFreed&&!plotState().betrayed&&state.level<4;}
function resetParty(){for(const a of partyActors){Object.assign(a,{x:player.x-40-a.index*30,vx:0,vy:0,onGround:true,motion:'idle',phase:0,actionTime:0,cooldown:.7+a.index*.3,heal:0,attack:null});a.y=surfaceAt(clamp(Math.floor(a.x/TILE),0,COLS-1))*TILE-48;}}
function partyTarget(a){
  const b=state.boss;if(b&&b.active&&!b.dead&&Math.abs(b.x-player.x)<650)return b;
  let target=null,best=420*420;
  for(const e of state.enemies){if(!e.alive||e.questionMob||Math.abs(e.x-player.x)>400)continue;
    const d=(e.x-a.x)**2+(e.y-a.y)**2;if(d<best){best=d;target=e;}}
  return target;
}
function movePartyActor(a,target,dt){
  const distance=target-a.x;
  if(Math.abs(distance)>W&&!onScreen(a.x,a.y,32,48)){a.x=target;a.y=surfaceAt(clamp(Math.floor(a.x/TILE),0,COLS-1))*TILE-48;a.vy=0;}
  a.vx=a.attack?0:Math.abs(distance)<6?0:clamp(distance*3,-330,330);
  if(a.vx)a.face=Math.sign(a.vx);
  const nx=clamp(a.x+a.vx*dt,0,COLS*TILE-32),floor=surfaceAt(clamp(Math.floor((nx+16)/TILE),0,COLS-1))*TILE,rise=a.y+48-floor;
  const blocked=tileCollisionRect(nx,a.y+2,24,44);
  if(a.onGround&&(rise>4||blocked)){a.vy=-Math.min(570,Math.sqrt(2*1050*(Math.max(rise,blocked?64:0)+24)));a.onGround=false;}
  if(!blocked&&(rise<5||a.y+48<=floor+5))a.x=nx;
  const actual=surfaceAt(clamp(Math.floor((a.x+16)/TILE),0,COLS-1))*TILE;
  if(a.y+48<actual-1)a.onGround=false;
  if(!a.onGround){a.vy+=1050*dt;a.y+=a.vy*dt;if(a.y+48>=actual&&a.vy>=0){a.y=actual-48;a.vy=0;a.onGround=true;}}
}
function partyRig(a){return {kind:'ally',index:a.index,x:a.x+16,foot:a.y+48,scale:.5,face:a.face,motion:a.motion,phase:a.phase,armed:true,precise:!!a.attack};}
function partySpellOrigin(a){
  const actor=partyRig(a),p=sampleRig(a.motion,a.phase),angle=p.weapon*.3+.08,h=rigSocket(actor);
  return {x:h.x+Math.sin(angle)*34*.5*a.face,y:h.y-Math.cos(angle)*34*.5};
}
function releasePartyAttack(a,action){
  const role=PARTY_ROLES[a.index];
  if(action.heal){
    if(player.health<MAX_HEALTH){player.health=Math.min(MAX_HEALTH,player.health+1);a.heal=10;burst(player.x+12,player.y+22,'#a6e0b3',9);playActionCue('petHeal');}return;
  }
  const target=action.target;if(!target||target.dead||target.alive===false)return;
  if(a.index===1||a.index===3){
    const origin=partySpellOrigin(a),angle=Math.atan2(target.y+(target.h||40)/2-origin.y,target.x+(target.w||24)/2-origin.x);
    queueProjectile({kind:'allySpell',ally:a.index,x:origin.x-4,y:origin.y-4,w:8,h:8,vx:Math.cos(angle)*5.8,vy:Math.sin(angle)*5.8,
      friendly:true,damage:role.damage,color:a.color,life:1.6,alive:true,pierce:0});
    sfx.enemyShoot();
  }else{
    const box={x:a.face>0?a.x+16:a.x+16-role.reach,y:a.y-4,w:role.reach,h:56};
    for(const e of state.enemies)if(e.alive&&!e.questionMob&&rects(box,e)){e.hp-=role.damage;e.vx+=a.face*1.5;burst(e.x,e.y+15,a.color,6);if(e.hp<=0)killEnemy(e);}
    if(state.boss&&rects(box,state.boss))applyBossDamage(state.boss,role.damage,a.face*.35,a.color);
    if(a.index===0&&Math.abs(player.x-a.x)<190){player.invuln=Math.max(player.invuln,.35);burst(player.x+12,player.y+18,a.color,4);}
    sfx.swing();
  }
}
function updateParty(dt){
  if(!partyActive()){for(const a of partyActors)a.attack=null;return;}
  for(const a of partyActors){
    if(state.paused)return;
    const role=PARTY_ROLES[a.index],target=a.attack?.target||partyTarget(a),follow=player.x-player.dir*(44+a.index*30);
    let destination=follow;
    if(target){const side=Math.sign(a.x-target.x)||-1;destination=target.x+side*(role.range-12)-16;}
    movePartyActor(a,destination,dt);a.cooldown=Math.max(0,a.cooldown-dt);a.heal=Math.max(0,a.heal-dt);
    if(a.attack){
      const action=a.attack;action.elapsed=Math.min(role.duration,action.elapsed+dt);a.phase=action.elapsed/role.duration;a.motion=role.motion;a.actionTime=role.duration-action.elapsed;
      if(!action.released&&a.phase>=role.release){action.released=true;releasePartyAttack(a,action);}
      if(action.elapsed>=role.duration){a.attack=null;a.cooldown=role.cooldown;a.actionTime=0;}
      continue;
    }
    a.motion=!a.onGround?(a.vy<0?'jump':'fall'):Math.abs(a.vx)>260?'run':Math.abs(a.vx)>4?'walk':'idle';
    a.phase=(a.phase+dt*(a.motion==='walk'||a.motion==='run'?Math.abs(a.vx)/72:.7))%1;
    const heal=a.index===3&&!a.heal&&player.health<MAX_HEALTH&&Math.abs(player.x-a.x)<300;
    const inRange=target&&Math.abs(target.x+target.w/2-a.x-16)<=role.range+16&&Math.abs(target.y-a.y)<(a.index===1?220:90);
    if(a.onGround&&!a.cooldown&&(heal||inRange)){
      a.attack={target:heal?null:target,elapsed:0,released:false,heal};a.phase=0;a.motion=role.motion;a.actionTime=role.duration;
      a.face=Math.sign((heal?player.x:target.x)-a.x)||a.face;
    }
  }
}
function drawPartyCombatEffect(a){
  if(!a.attack)return;const p=a.phase,origin=rigSocket(partyRig(a));
  ctx.save();
  if(a.index===0||a.index===2){
    if(p>.38&&p<.7){ctx.globalAlpha=Math.sin((p-.38)/.32*Math.PI)*.75;ctx.strokeStyle=a.color;ctx.lineWidth=2;
      ctx.translate(origin.x,origin.y);ctx.scale(a.face,1);ctx.beginPath();ctx.arc(0,0,a.index===2?31:24,-1.7+(p-.38)*3,.15+(p-.38)*3);ctx.stroke();}
  }else if(p<.48){const tip=partySpellOrigin(a);ctx.strokeStyle=a.color;ctx.lineWidth=1;ctx.beginPath();ctx.arc(tip.x,tip.y,2+p*10,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}
