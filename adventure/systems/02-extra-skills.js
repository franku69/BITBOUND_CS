/* Additional skill effects form a dispatch table, separate from the original powers.
   These are playful combat names; Byte's lessons teach the actual Python concepts. */
const EXTRA_POWER_DEFINITIONS=Object.freeze({
  stack_guard:{id:'stack_guard',name:'Stack Guard',concept:'Stack • Last In, First Out',icon:'STK',color:'#8fcfff',cooldown:6.8,description:'A brief protective guard and a close-range counter bolt.'},
  queue_lance:{id:'queue_lance',name:'Queue Lance',concept:'Queue • First In, First Out',icon:'QUE',color:'#8bf0d1',cooldown:5.4,description:'A focused lance that pierces a line of enemies.'},
  set_nova:{id:'set_nova',name:'Set Nova',concept:'Sets • Unique Elements',icon:'SET',color:'#ffbf83',cooldown:5.6,description:'A short, wide fan for clearing nearby threats.'},
  recursive_echo:{id:'recursive_echo',name:'Recursive Echo',concept:'Recursion • Base Case',icon:'REC',color:'#dca2ff',cooldown:6.1,description:'Three nested arcs of smaller, slower echo bolts.'},
  graph_star:{id:'graph_star',name:'Graph Star',concept:'Graphs • Vertices and Edges',icon:'GPH',color:'#91e89b',cooldown:5.8,description:'Six connected-looking paths radiate around you.'},
  heap_comet:{id:'heap_comet',name:'Heap Comet',concept:'Heap • Priority Queue',icon:'HEAP',color:'#ffe38a',cooldown:6.2,description:'A heavy, fast projectile with a short protective launch.'}
});
function skillShot(power,spec){return pushPowerProjectile({color:power.color,glyph:power.icon,...spec});}
const EXTRA_POWER_CASTS=Object.freeze({
  stack_guard(power,lv,base){
    player.invuln=Math.max(player.invuln,.9+lv*.25);
    skillShot(power,{angle:base,speed:5,damage:2,life:.4,size:22});playActionCue('shield');
  },
  queue_lance(power,lv,base){
    const q=skillShot(power,{angle:base,speed:10.5,damage:1+Math.floor(lv/2),life:1.25,size:13});
    if(q){q.pierce=2+lv;q.lastHitEnemyId=-1;}playActionCue('arc');
  },
  set_nova(power,lv,base){
    for(let i=0;i<5+lv;i++)skillShot(power,{angle:base+(i-(4+lv)/2)*.24,speed:6,damage:1,life:.7,size:12});
  },
  recursive_echo(power,lv,base){
    // A fixed, shallow loop: no recursive runtime work or unbounded projectile tree.
    for(let depth=0;depth<3;depth++)for(const sign of [-1,1])skillShot(power,{
      angle:base+sign*(.08+depth*.14),speed:9-depth*1.5,damage:1,life:1.4,size:17-depth*3});
  },
  graph_star(power,lv,base){
    for(let i=0;i<6;i++)skillShot(power,{angle:base+i*Math.PI/3,speed:7,damage:1+Math.floor(lv/3),life:.8,size:13});
  },
  heap_comet(power,lv,base){
    skillShot(power,{angle:base,speed:11,damage:2+Math.floor(lv/2),life:1.1,size:20+lv});
    player.invuln=Math.max(player.invuln,.3);playActionCue('heavy');
  }
});
function castExtraPower(power,level,angle){
  const cast=EXTRA_POWER_CASTS[power.id];if(!cast)return false;
  cast(power,level,angle);toast(`${power.name.toUpperCase()} · LEVEL ${level}`,power.color);return true;
}
function equipSkill(id){
  if(!state.started||!Object.hasOwn(CONCEPT_POWERS,id))return false;
  if(state.powerId===id)return true;
  state.powerId=id;
  // Switching cannot bypass a cooldown or leave an old speed boost running.
  state.powerCooldown=Math.max(state.powerCooldown,powerCooldownMax());state.powerBuff=0;
  updateHotbar();markStoryChanged();sfx.equip();return true;
}
function renderSkillPicker(){
  const select=$('skillSelect'),description=$('skillDescription');
  if(!select||!description)return;
  if(!select.children.length)for(const power of Object.values(CONCEPT_POWERS)){
    const option=document.createElement('option');option.value=power.id;option.textContent=power.name;select.appendChild(option);
  }
  select.value=currentPower().id;
  const explain=()=>{description.textContent=`${currentPower().description} Cooldown: ${currentPower().cooldown}s before upgrades. Press K or tap Skill to cast.`;};
  select.onchange=()=>{if(equipSkill(select.value))explain();};explain();
}
