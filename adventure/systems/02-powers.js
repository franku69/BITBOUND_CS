/* ------------------------ List Basics Concept Powers ------- */
const POWER_LEVEL_XP = Object.freeze([0,4,10,18]);
const CONCEPT_POWERS = Object.freeze({
  ...EXTRA_POWER_DEFINITIONS,
  binary_beam:{id:'binary_beam',name:'List Beam',concept:'List = Ordered Sequence',icon:'[]',color:'#65e7ff',cooldown:4.6,description:'Launches a sequence of list-element bolts.'},
  xor_burst:{id:'xor_burst',name:'Slice Burst',concept:'Start Included • Stop Excluded',icon:'[:]',color:'#b67cff',cooldown:4.8,description:'Fires a selected slice of mirrored bolts.'},
  ram_overclock:{id:'ram_overclock',name:'Dynamic Boost',concept:'Lists Can Grow or Shrink',icon:'DYN',color:'#7dffae',cooldown:5.0,description:'Boosts movement to represent a dynamic list.'},
  ascii_array:{id:'ascii_array',name:'Character List',concept:'list("abcd") Splits Characters',icon:'a,b',color:'#ffe274',cooldown:4.7,description:'Launches elements from a character list.'},
  rle_compressor:{id:'rle_compressor',name:'Count Crusher',concept:'count(x) = How Many',icon:'CNT',color:'#ffad55',cooldown:5.1,description:'Compresses repeated matches into a heavy packet.'},
  parity_pulse:{id:'parity_pulse',name:'Membership Pulse',concept:'in / not in',icon:'IN',color:'#ff8fd8',cooldown:5.4,description:'Checks every direction for matching targets.'},
  alu_surge:{id:'alu_surge',name:'Sum Surge',concept:'sum(list) = Total',icon:'SUM',color:'#ffcf5a',cooldown:4.8,description:'Releases a ring powered by the sum of its elements.'},
  control_command:{id:'control_command',name:'Index Command',concept:'Index = Numbered Position',icon:'[0]',color:'#74b9ff',cooldown:5.0,description:'Directs indexed bolts toward the target.'},
  bus_barrage:{id:'bus_barrage',name:'Range Barrage',concept:'range() Visits Positions',icon:'RNG',color:'#46e0d1',cooldown:4.7,description:'Sends loop packets through selected positions.'},
  register_restore:{id:'register_restore',name:'Mutable Restore',concept:'Mutable = Can Change',icon:'MUT',color:'#7dff9b',cooldown:6.4,description:'Changes the explorer’s state by restoring health and readiness.'},
  branch_warp:{id:'branch_warp',name:'Negative Index Warp',concept:'-1 = Last Element',icon:'-1',color:'#c58cff',cooldown:5.2,description:'Warps from the end of the current path.'},
  shift_cannon:{id:'shift_cannon',name:'Append Cannon',concept:'append() Adds One Object',icon:'APP',color:'#91c8ff',cooldown:5.0,description:'Appends one heavy projectile to the battle.'},
  load_store_link:{id:'load_store_link',name:'Extend Link',concept:'extend() Adds Every Object',icon:'EXT',color:'#ff9f68',cooldown:4.9,description:'Extends one attack into several projectiles.'},
  while_loop_volley:{id:'while_loop_volley',name:'Traversal Volley',concept:'for Visits Each Element',icon:'FOR',color:'#ff75ad',cooldown:5.1,description:'Traverses a list of repeated attack paths.'},
  function_call:{id:'function_call',name:'Sort Call',concept:'sort() = Smallest to Largest',icon:'SRT',color:'#a8e063',cooldown:4.8,description:'Sorts reusable attack packets toward the target.'}
});
const CONCEPT_POWER_IDS = Object.freeze([...Object.keys(CONCEPT_POWERS).filter(id=>!EXTRA_POWER_DEFINITIONS[id]),...Object.keys(EXTRA_POWER_DEFINITIONS)]);
// Procedural, locally rendered regions: no photographic downloads or decode work.
const WORLD_BACKGROUND_IDS=Object.freeze(['valley','forest','cavern','dungeon','catacombs','approach','interior','hall']);
const BACKGROUND_ASSETS=Object.freeze(WORLD_BACKGROUND_IDS.map(id=>Object.freeze({id,name:id,procedural:true})));
window.BitboundGameCatalog = Object.freeze({
  conceptPowers:Object.freeze(CONCEPT_POWER_IDS.map(id=>Object.freeze({id,name:CONCEPT_POWERS[id].name,concept:CONCEPT_POWERS[id].concept}))),
  backgrounds:Object.freeze(BACKGROUND_ASSETS.map(asset=>Object.freeze({...asset}))),
  worldBackgrounds:WORLD_BACKGROUND_IDS,
  bossDesigns:Object.freeze(['control_specter','opcode_colossus','cycle_warden','signal_titan','abstraction_master','link_keeper','call_guardian','graph_guardian']),
  mobDesigns:Object.freeze(Object.values(window.BitboundEncounters.MOBS).map(mob=>mob.design)),
  weaponDesigns:Object.freeze(Object.values(WEAPONS).map(w=>Object.freeze({id:w.id,design:w.design}))),
  pets:Object.freeze(PET_IDS.map(id=>Object.freeze({...PETS[id]}))),
  masteryWeapons:MASTERY_WEAPON_REWARDS
});
function currentPower(){return CONCEPT_POWERS[state.powerId]||CONCEPT_POWERS.binary_beam;}
function powerLevelFromXp(xp=state.powerXp){let level=1;for(let i=1;i<POWER_LEVEL_XP.length;i++)if(xp>=POWER_LEVEL_XP[i])level=i+1;return level;}
function powerLevel(){return powerLevelFromXp();}
function nextPowerXp(){const lv=powerLevel();return lv>=POWER_LEVEL_XP.length?null:POWER_LEVEL_XP[lv];}
function powerCooldownMax(){return currentPower().cooldown*[1,.90,.82,.74][powerLevel()-1];}
function randomConceptPowerId(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return CONCEPT_POWER_IDS[a[0]%CONCEPT_POWER_IDS.length];}catch(e){return CONCEPT_POWER_IDS[Math.floor(Math.random()*CONCEPT_POWER_IDS.length)];}}
function addPowerXp(amount,source='MOB'){const before=powerLevel();state.powerXp+=Math.max(0,amount|0);const after=powerLevel();if(after>before){sfx.powerUp();setTimeout(()=>toast(`CONCEPT POWER UPGRADED — ${currentPower().name.toUpperCase()} LV ${after}!`,'#ffd166'),160);}updateHotbar();return after>before;}
function nearestPowerTarget(maxRange=760){return nearestHostileTarget(maxRange);}
function pushPowerProjectile({angle,speed=8.5,damage=1,life=1.7,size=10,color,glyph='',kind='conceptPower',noTile=false}){const p=playerCenter(),projectile={alive:true,friendly:true,power:true,powerId:currentPower().id,kind,x:p.x-size/2+player.dir*12,y:p.y-size/2,w:size,h:size,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,damage,life,color,glyph,noTile};return queueProjectile(projectile);}
function powerAimAngle(){const p=playerCenter(),target=nearestPowerTarget();if(target)return Math.atan2((target.y+target.h/2)-p.y,(target.x+target.w/2)-p.x);return player.dir>0?0:Math.PI;}
function safeBranchWarp(distance){
  const direction=player.dir||1,target=clamp(player.x+direction*distance,0,COLS*TILE-player.w);let next=player.x;
  while(Math.abs(target-next)>1){const step=Math.sign(target-next)*Math.min(3,Math.abs(target-next));if(tileCollisionRect(next+step,player.y,player.w,player.h,true))break;next+=step;}
  player.x=next;player.vx=direction*2.4;player.invuln=Math.max(player.invuln,.38);state.camera.shake=Math.max(state.camera.shake,3);
}
function castConceptPower(){
  if(state.paused||!state.started)return;
  if(state.powerCooldown>0){toast(`${currentPower().name}: ${state.powerCooldown.toFixed(1)}s cooldown.`,'#9bb6ca');return;}
  if(state.boss&&state.boss.active&&!state.boss.dead)dismissRespawnBanner();
  const power=currentPower(),lv=powerLevel(),base=powerAimAngle();state.powerCooldown=powerCooldownMax();updateHotbar();sfx.powerCast();
  const p=playerCenter();beginSkillFlash(power);
  burst(p.x,p.y,power.color,12+lv*3);
  if(castExtraPower(power,lv,base))return;
  if(power.id==='binary_beam'){
    const count=1+lv;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.045;pushPowerProjectile({angle:base+off,speed:9.4,damage:1,life:1.55,size:11,color:power.color,glyph:i%2?'1':'0',kind:'binaryPower'});}
    toast(`LIST BEAM LV ${lv} — ORDERED ELEMENTS DEPLOYED!`,power.color);
  }else if(power.id==='xor_burst'){
    const offsets=lv===1?[-.22,.22]:lv===2?[-.30,-.08,.08,.30]:lv===3?[-.36,-.16,.16,.36]:[-.42,-.22,0,.22,.42];for(const off of offsets)pushPowerProjectile({angle:base+off,speed:8.5,damage:1,life:1.8,size:11,color:power.color,glyph:'⊕',kind:'xorPower'});
    toast(`SLICE BURST LV ${lv} — START IN, STOP OUT!`,power.color);
  }else if(power.id==='ram_overclock'){
    state.powerBuff=2.0+lv*.55;player.dashCd=0;player.attackCd=0;player.invuln=Math.max(player.invuln,.20+lv*.08);burst(p.x,p.y,power.color,18+lv*3);
    toast(`DYNAMIC BOOST LV ${lv} — GROW, SHRINK, MOVE!`,power.color);
  }else if(power.id==='ascii_array'){
    const letters=['A','B','C','D','E','F'];const count=1+lv;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.11;pushPowerProjectile({angle:base+off,speed:8.8,damage:1,life:1.9,size:12,color:power.color,glyph:letters[i],kind:'asciiPower'});}
    toast(`CHARACTER LIST LV ${lv} — ELEMENTS LAUNCHED!`,power.color);
  }else if(power.id==='rle_compressor'){
    const damage=1+Math.ceil(lv/2),size=16+lv*3;pushPowerProjectile({angle:base,speed:7.2+lv*.35,damage,life:2.0,size,color:power.color,glyph:`${lv+2}A`,kind:'rlePower'});
    toast(`COUNT CRUSHER LV ${lv} — MATCHES COUNTED!`,power.color);
  }else if(power.id==='parity_pulse'){
    const count=4+lv*2;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;pushPowerProjectile({angle:a,speed:6.6+lv*.25,damage:1,life:1.15,size:10,color:power.color,glyph:i%2?'1':'0',kind:'parityPower',noTile:true});}player.invuln=Math.max(player.invuln,.24+lv*.08);
    toast(`MEMBERSHIP PULSE LV ${lv} — TARGET IN RANGE!`,power.color);
  }else if(power.id==='alu_surge'){
    const count=4+lv*2;for(let i=0;i<count;i++){const a=i*Math.PI*2/count;pushPowerProjectile({angle:a,speed:6.8+lv*.3,damage:1,life:1.35,size:11,color:power.color,glyph:i%2?'+':'∧',kind:'aluPower',noTile:true});}
    toast(`SUM SURGE LV ${lv} — ELEMENTS TOTALED!`,power.color);
  }else if(power.id==='control_command'){
    const count=1+lv;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.09;pushPowerProjectile({angle:base+off,speed:9.0,damage:1,life:1.75,size:12,color:power.color,glyph:'CU',kind:'controlPower'});}player.invuln=Math.max(player.invuln,.16+lv*.06);
    toast(`INDEX COMMAND LV ${lv} — POSITION LOCKED!`,power.color);
  }else if(power.id==='bus_barrage'){
    const labels=['A','D','C'],passes=1+Math.floor((lv-1)/2);for(let pass=0;pass<passes;pass++)for(let i=0;i<labels.length;i++){const off=(i-1)*(.12+pass*.05);pushPowerProjectile({angle:base+off,speed:8.4+pass*.5,damage:1,life:1.85,size:11,color:power.color,glyph:labels[i],kind:'busPower'});}
    toast(`RANGE BARRAGE LV ${lv} — POSITIONS VISITED!`,power.color);
  }else if(power.id==='register_restore'){
    const heal=1+(lv>=3?1:0),before=player.health;player.health=Math.min(MAX_HEALTH,player.health+heal);player.dashCd=0;player.attackCd=0;player.invuln=Math.max(player.invuln,.28+lv*.06);state.powerBuff=Math.max(state.powerBuff,.7+lv*.18);burst(p.x,p.y,power.color,18+lv*3);
    toast(`MUTABLE RESTORE LV ${lv} — ${player.health>before?`+${player.health-before} HEALTH • `:''}STATE CHANGED!`,power.color);
  }else if(power.id==='branch_warp'){
    safeBranchWarp(72+lv*22);const after=playerCenter();burst(after.x,after.y,power.color,18+lv*2);
    toast(`NEGATIVE INDEX WARP LV ${lv} — -1 FROM THE END!`,power.color);
  }else if(power.id==='shift_cannon'){
    pushPowerProjectile({angle:base,speed:8.1+lv*.35,damage:1+Math.ceil(lv/2),life:2.05,size:15+lv*2,color:power.color,glyph:'>>',kind:'shiftPower'});
    toast(`APPEND CANNON LV ${lv} — ONE OBJECT ADDED!`,power.color);
  }else if(power.id==='load_store_link'){
    const count=2+lv;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.10;pushPowerProjectile({angle:base+off,speed:8.6,damage:1,life:1.8,size:12,color:power.color,glyph:i%2?'ST':'LD',kind:'ioPower'});}
    toast(`EXTEND LINK LV ${lv} — EVERY OBJECT ADDED!`,power.color);
  }else if(power.id==='while_loop_volley'){
    const count=3+lv*2;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.085;pushPowerProjectile({angle:base+off,speed:7.8+(i%2)*.5,damage:1,life:1.9,size:10,color:power.color,glyph:'W',kind:'loopPower'});}
    toast(`TRAVERSAL VOLLEY LV ${lv} — VISIT EACH ELEMENT!`,power.color);
  }else{
    const count=1+lv;for(let i=0;i<count;i++){const off=(i-(count-1)/2)*.13;pushPowerProjectile({angle:base+off,speed:8.9,damage:1,life:1.85,size:12,color:power.color,glyph:'f()',kind:'functionPower'});}
    toast(`SORT CALL LV ${lv} — SMALLEST TO LARGEST!`,power.color);
  }
}

const WORLD_PALETTES = Object.freeze([
  Object.freeze({sky:["#6d73d6","#d9e6ff"],accent:"#65e7ff",accent2:"#b67cff",ground:"#5b4a39",stone:"#4a4f59",dirt:"#6d5845",brick:"#4d463e",ore:"#61e6ff",fog:"#243056"}),
  Object.freeze({sky:["#101d32","#274a53"],accent:"#a3d2a3",accent2:"#cfb983",ground:"#364b3f",stone:"#34474a",dirt:"#485745",brick:"#42514a",ore:"#9ae8cc",fog:"#142b32"}),
  Object.freeze({sky:["#10152d","#333968"],accent:"#c77dff",accent2:"#ff83ec",ground:"#45405b",stone:"#363449",dirt:"#514762",brick:"#3f3754",ore:"#b990ff",fog:"#101024"}),
  Object.freeze({sky:["#102f2a","#4c7866"],accent:"#7dffae",accent2:"#7ec8ff",ground:"#4b4938",stone:"#3f4a43",dirt:"#58604b",brick:"#3f554b",ore:"#8fffc0",fog:"#0c2421"}),
  Object.freeze({sky:["#08121e","#193b59"],accent:"#8db8ff",accent2:"#ff8fd8",ground:"#3b4b5b",stone:"#263443",dirt:"#3e5364",brick:"#263e57",ore:"#ff93df",fog:"#050b12"}),
  Object.freeze({sky:["#0c2730","#24646b"],accent:"#69f0d0",accent2:"#ffcf83",ground:"#35544b",stone:"#274249",dirt:"#47634e",brick:"#355959",ore:"#8ff5d7",fog:"#082126"}),
  Object.freeze({sky:["#261334","#654a8c"],accent:"#dab0ff",accent2:"#ffb89b",ground:"#574563",stone:"#3f344c",dirt:"#6a5364",brick:"#504065",ore:"#dbacff",fog:"#20122f"}),
  Object.freeze({sky:["#062a25","#30796a"],accent:"#9ef3a6",accent2:"#9bddff",ground:"#425b38",stone:"#2d4847",dirt:"#566948",brick:"#356259",ore:"#a3f8cb",fog:"#082923"})
]);
