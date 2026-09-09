/* Pet support is session-only gameplay state, never an autonomous save.
   A 5 Hz scan shares the existing bounded loot/projectile arrays. */
const petSupport={scan:0,cooldown:0,pulse:0,overclock:0,target:null,label:'Ready'};
function resetPetSupport(){Object.assign(petSupport,{scan:0,cooldown:3,pulse:0,overclock:0,target:null,label:'Warming up'});}
function petSignal(label,color){petSupport.label=label;petSupport.pulse=1.2;pet.cheer=1.2;burst(pet.x+17,pet.y+12,color,6);}
function updatePetSupport(dt){
  petSupport.cooldown=Math.max(0,petSupport.cooldown-dt);petSupport.overclock=Math.max(0,petSupport.overclock-dt);petSupport.pulse=Math.max(0,petSupport.pulse-dt);
  petSupport.scan-=dt;if(petSupport.scan>0)return;petSupport.scan=.2;
  const id=state.petId;
  if(id==='index_fox'){
    let target=null,best=300*300;
    for(const item of state.loot){if(!item.alive)continue;const dx=item.x-player.x,dy=item.y-player.y,d=dx*dx+dy*dy;if(d<best){best=d;target=item;}}
    petSupport.target=target;
    if(target){petSupport.label='Fetching loot';const dx=target.x-pet.x,dy=target.y-pet.y;if(dx*dx+dy*dy<30*30){target.alive=false;grantWeapon(target.weaponId,{equip:false,announce:true,source:'INDEX FOX'});petSupport.target=null;petSignal('Loot delivered','#99e4ed');}}
    else if(!petSupport.pulse)petSupport.label='Fetch range: 300';
  }else if(id==='append_slime'){
    if(!petSupport.cooldown&&player.health>0&&player.health<MAX_HEALTH){player.health=Math.min(MAX_HEALTH,player.health+1);petSupport.cooldown=16;petSignal('+1 heart','#a6e8b0');playActionCue('petHeal');}
    else if(!petSupport.pulse)petSupport.label=player.health>=MAX_HEALTH?'Healing ready':`Heal in ${Math.ceil(petSupport.cooldown)}s`;
  }else if(id==='slice_owl'){
    if(!petSupport.cooldown){for(const q of state.projectiles){if(!q.alive||q.friendly)continue;const dx=q.x-player.x,dy=q.y-player.y;if(dx*dx+dy*dy>110*110)continue;
      q.alive=false;pet.x=q.x;pet.y=q.y;petSupport.cooldown=8;petSignal('Shot intercepted','#d6bef4');playActionCue('petHeal');break;}}
    if(!petSupport.pulse)petSupport.label=petSupport.cooldown?`Guard in ${Math.ceil(petSupport.cooldown)}s`:'Projectile guard ready';
  }else if(id==='sort_bot'){
    const inCombat=!!(state.boss?.active&&!state.boss.dead)||enemyIndex.some(player.x-220,player.x+220,e=>e.alive&&Math.abs(e.y-player.y)<150);
    if(!petSupport.cooldown&&inCombat){petSupport.overclock=3;petSupport.cooldown=12;petSignal('Overclock: 3 seconds','#ffe4a0');playActionCue('petHeal');}
    if(!petSupport.pulse)petSupport.label=petSupport.overclock?`Overclock ${Math.ceil(petSupport.overclock)}s`:petSupport.cooldown?`Charge ${Math.ceil(petSupport.cooldown)}s`:'Overclock ready';
  }
}
function drawPetSupport(){
  if(petSupport.pulse<=0)return;
  const x=pet.x+17,y=pet.y+16;ctx.save();ctx.strokeStyle=currentPet().color;ctx.lineWidth=1.5;
  const age=1-petSupport.pulse/1.2;ctx.globalAlpha=1-age;ctx.beginPath();ctx.ellipse(x,y,17+age*14,10+age*8,0,0,Math.PI*2);ctx.stroke();
  if(state.petId==='sort_bot')storyLine(ctx,'#ffe1a5',1,[[x,y],[x+10,y-12],[player.x+12,player.y+22]]);
  if(state.petId==='append_slime'){ctx.fillStyle='#dcffd6';ctx.fillRect(x-1,y-20,3,11);ctx.fillRect(x-5,y-16,11,3);}
  ctx.restore();
}
