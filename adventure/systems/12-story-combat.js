/* Plot-aware boss phases. Core collision and attack scheduling stay in combat. */
const STORY_BOSS_PROFILES=Object.freeze({
  paladin:{move:1.25,movement:'duelist',volley:'storageFan',shotSpeed:3.2,volleyCd:1.9,specials:['nandSlam','afterimageRush'],firstSpecial:1.5,specialCd:2.7,tip:'ASTER: jump his ground wave, dash past his charge, then counterattack while he recovers.'},
  demon:{move:1.18,movement:'kite',volley:'chronoAim',shotSpeed:3.4,volleyCd:1.7,specials:['dataRain','bladeStorm','crushingDescent'],firstSpecial:1.5,specialCd:2.4,tip:'VEYR: leave marked columns, jump the blades, and strike between attacks.'},
  fused:{move:1.32,movement:'duelist',volley:'xorSplit',shotSpeed:3.7,volleyCd:1.7,specials:['timeLock','crushingDescent','afterimageRush','bladeStorm'],firstSpecial:1.5,specialCd:1.9,tip:'FUSED CROWN: shielded while attacking. Dodge the marks; attack when its gold crown opens during recovery.'}
});
function storyBossName(){const phase=plotState().finalPhase;return state.level===7?({paladin:'Aster, the Fallen Paladin',demon:'Demon Lord Veyr',fused:'Veyr + BYTE • The Fused Crown'}[phase]||worldData().boss):worldData().boss;}
function plotTerminalAllowed(level,index){
  const p=plotState();
  if(level===0&&!p.prisonersMet){showPlotScene('prisoners');return false;}
  if(level===7&&index===1&&!p.paladinDefeated){toast('Defeat the Fallen Paladin before challenging the barrier.','#ffe199');return false;}
  return true;
}
function beginByteFusion(){
  const p=plotState();if(p.finalPhase!=='demon')return;
  state.boss.active=false;state.projectiles.length=0;UI.bossBar.classList.add('hidden');
  p.finalPhase='fused';markStoryChanged();showPlotScene('fusion');
}
function handlePlotBossDefeat(b){
  if(b.storyKind==='paladin'){
    b.dead=true;b.active=false;state.projectiles.length=0;UI.bossBar.classList.add('hidden');
    const p=plotState();p.paladinDefeated=true;p.finalPhase='barrier';
    addPowerXp(4,'PALADIN');grantWeapon('graph_trident',{source:'PALADIN CROWN'});state.powerBuff=30;player.health=MAX_HEALTH;
    setCheckpoint(TERMINAL_COL-2,'Shortest-route barrier');resetPlayer(true,3);sfx.bossDefeat();markStoryChanged();showPlotScene('paladinFall');return true;
  }
  if(b.storyKind==='demon'){beginByteFusion();return true;}
  return false;
}
function afterPlotBossDefeat(){
  const p=plotState();
  if(state.level===0){p.cageKey=true;toast('WARDEN KEY OBTAINED — return to the prisoners and press E / Use.','#ffe297');}
  if(state.level===7){p.finalPhase='complete';state.projectiles.length=0;showPlotScene('ending');}
  markStoryChanged();
}
