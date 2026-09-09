/* ------------------------ World Generation ------------------ */
function generateWorld(level){
  skillFlash=null;

  const seed=911+level*997;
  // Compact typed arrays improve cache locality and reduce memory overhead.
  const tiles=Array.from({length:ROWS},()=>new Uint8Array(COLS));
  const surface=new Int16Array(COLS);surface.fill(20);
  let h=19+level%2;
  for(let c=0;c<COLS;c++){
    if(c%6===0){const rr=randHash(c,level,seed); if(rr<.3)h--; else if(rr>.72)h++; h=clamp(h,16,22);}
    surface[c]=h;
  }
  // Make all key areas comfortably walkable.
  const flats=[4,...SHRINE_COLS,TERMINAL_COL,PORTAL_COL];
  for(const fc of flats){
    const target=surface[clamp(fc,0,COLS-1)];
    for(let c=Math.max(0,fc-5);c<=Math.min(COLS-1,fc+5);c++) surface[c]=target;
  }
  // Boss arena.
  const arenaY=surface[TERMINAL_COL];
  for(let c=TERMINAL_COL-10;c<COLS;c++) surface[c]=arenaY;

  for(let c=0;c<COLS;c++){
    for(let r=surface[c];r<ROWS;r++){
      const depth=r-surface[c];
      let id=depth<3?Tile.DIRT:Tile.STONE;
      if(level===1 && depth>6 && randHash(c,r,seed)<.08) id=Tile.ASH;
      if(level===4 && depth>3 && randHash(c,r,seed)<.06) id=Tile.METAL;
      if(depth>4 && randHash(c,r,seed)<.035) id=Tile.ORE;
      tiles[r][c]=id;
    }
  }
  // Carve underground caves while leaving a solid top walkway.
  for(let i=0;i<55;i++){
    const cx=10+Math.floor(randHash(i,seed,2)*(COLS-25));
    const cy=24+Math.floor(randHash(i,seed,3)*13);
    const rx=2+Math.floor(randHash(i,seed,4)*6), ry=1+Math.floor(randHash(i,seed,5)*3);
    for(let r=cy-ry;r<=cy+ry;r++)for(let c=cx-rx;c<=cx+rx;c++){
      const d=((c-cx)*(c-cx))/(rx*rx)+((r-cy)*(r-cy))/(ry*ry);
      if(d<1 && r>surface[clamp(c,0,COLS-1)]+3) tiles[r][c]=Tile.AIR;
    }
  }
  // Landmark architecture and traversal platforms.
  const put=(c,r,id)=>{if(c>=0&&c<COLS&&r>=0&&r<ROWS)tiles[r][c]=id;};
  for(const sc of SHRINE_COLS){
    const sy=surface[sc];
    for(let c=sc-3;c<=sc+3;c++) put(c,sy-1,Tile.BRICK);
    for(let r=sy-5;r<sy-1;r++){put(sc-3,r,Tile.BRICK);put(sc+3,r,Tile.BRICK);}
    put(sc-2,sy-5,Tile.CRYSTAL); put(sc+2,sy-5,Tile.CRYSTAL);
  }
  // terminal citadel
  const ty=surface[TERMINAL_COL];
  for(let c=TERMINAL_COL-5;c<=TERMINAL_COL+5;c++) put(c,ty-1,Tile.METAL);
  for(let r=ty-7;r<ty-1;r++){put(TERMINAL_COL-5,r,Tile.METAL);put(TERMINAL_COL+5,r,Tile.METAL);}
  for(let c=TERMINAL_COL-4;c<=TERMINAL_COL+4;c+=2) put(c,ty-7,Tile.METAL);
  // Tactical boss arena: three one-way platforms create high ground, cover, and drop-through routes.
  const battlePlatforms=[{start:195,len:5,lift:4},{start:202,len:5,lift:7},{start:209,len:4,lift:4}];
  for(const p of battlePlatforms){for(let c=p.start;c<p.start+p.len;c++)put(c,arenaY-p.lift,Tile.PLATFORM);}
  // portal pedestal
  const py=surface[PORTAL_COL];
  for(let c=PORTAL_COL-3;c<=PORTAL_COL+3;c++) put(c,py-1,Tile.BRICK);
  // Suspended platforms every so often
  for(let c=18;c<COLS-20;c+=22){
    const sy=surface[c];
    if(randHash(c,level,8)>.35){for(let x=c;x<c+5;x++)put(x,sy-4,Tile.PLATFORM);}
  }
  // Optional ore pockets sit below the route. The required mission path never needs mining.
  const tunnel=98+level*3;
  for(let c=tunnel;c<tunnel+10;c++){
    const sy=surface[c];
    if(c===tunnel+4||c===tunnel+5) put(c,sy+2,Tile.ORE);
  }

  // Reliability rule: keep a two-tile-high walking corridor clear across the entire surface.
  // This prevents decorative citadel/shrine tiles from accidentally trapping students.
  for(let c=0;c<COLS;c++){
    for(let r=Math.max(0,surface[c]-2);r<surface[c];r++) tiles[r][c]=Tile.AIR;
  }
  state.world={tiles,surface,seed};
  terrainCache.reset(state.world);
  state.torchesPlaced=[];
  state.chests=[];
  state.loot=[];
  for(let i=0;i<8;i++){
    const c=24+i*23+(i%2)*4; if(c>=TERMINAL_COL-8) continue;
    state.chests.push({x:c*TILE+4,y:surface[c]*TILE-22,w:26,h:22,opened:false,type:'chest'});
  }
  spawnEnemies();
  state.boss=null;
  state.bossUnlocked=state.assessmentPassed[level]||(level===7&&['paladin','demon','fused'].includes(plotState().finalPhase));
  if(state.bossUnlocked && !state.bossDefeated[level]) spawnBoss();
  else if(state.bossDefeated[level]&&!ownsWeapon(bossWeaponId(level))){const c=205,sy=surfaceAt(c);spawnWeaponDrop(bossWeaponId(level),c*TILE,sy*TILE-28,{guaranteed:true,source:'BOSS DROP'});}
}
