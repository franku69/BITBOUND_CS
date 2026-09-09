/* Bounded terrain textures. Dynamic actors, landmarks and effects render separately. */
(() => {
'use strict';
class TerrainCache {
  constructor({tileSize=32,chunkTiles=8,limit=28,createSurface,paintTile}) {
    Object.assign(this,{tileSize,chunkTiles,limit,createSurface,paintTile});
    this.pixels=tileSize*chunkTiles;
    this.entries=new Map();
    this.pool=[];
    this.world=null;
    this.unavailable=false;
    this.stats={builds:0,hits:0,invalidations:0};
  }
  reset(world=null) {
    for(const entry of this.entries.values())this.pool.push(entry);
    this.entries.clear();
    this.world=world;
    this.trimPool();
  }
  trimPool() {
    while(this.pool.length>this.limit){const entry=this.pool.pop();entry.surface.width=0;entry.surface.height=0;}
  }
  key(column,row) { return row*this.columns+column; }
  invalidate(column,row) {
    if(!this.world || row<0 || column<0)return;
    const key=this.key(Math.floor(column/this.chunkTiles),Math.floor(row/this.chunkTiles));
    const entry=this.entries.get(key);
    if(entry){this.entries.delete(key);this.pool.push(entry);this.stats.invalidations++;}
  }
  get(column,row,theme) {
    const key=this.key(column,row);
    let entry=this.entries.get(key);
    if(entry){this.entries.delete(key);this.entries.set(key,entry);this.stats.hits++;return entry;}
    if(this.entries.size>=this.limit){const first=this.entries.keys().next().value;entry=this.entries.get(first);this.entries.delete(first);}
    else entry=this.pool.pop();
    if(!entry){
      try{
        const surface=this.createSurface(this.pixels,this.pixels);
        const context=surface.getContext('2d',{alpha:true});
        if(!context){this.unavailable=true;return null;}
        entry={surface,context};
      }catch{this.unavailable=true;return null;}
    }
    const {context}=entry,x=column*this.pixels,y=row*this.pixels;
    context.setTransform(1,0,0,1,0,0);
    context.clearRect(0,0,this.pixels,this.pixels);
    context.imageSmoothingEnabled=false;
    context.lineWidth=1;
    context.translate(-x,-y);
    const firstColumn=column*this.chunkTiles,firstRow=row*this.chunkTiles;
    for(let r=firstRow;r<Math.min(firstRow+this.chunkTiles,this.world.tiles.length);r++){
      const tiles=this.world.tiles[r];
      for(let c=firstColumn;c<Math.min(firstColumn+this.chunkTiles,tiles.length);c++){
        if(tiles[c])this.paintTile(context,c,r,tiles[c],theme);
      }
    }
    context.setTransform(1,0,0,1,0,0);
    this.entries.set(key,entry);
    this.stats.builds++;
    return entry;
  }
  draw(target,world,theme,x,y,width,height) {
    if(this.unavailable)return false;
    if(this.world!==world)this.reset(world);
    this.columns=Math.ceil(world.tiles[0].length/this.chunkTiles);
    const rows=Math.ceil(world.tiles.length/this.chunkTiles);
    const c0=Math.max(0,Math.floor(x/this.pixels)),r0=Math.max(0,Math.floor(y/this.pixels));
    const c1=Math.min(this.columns-1,Math.floor((x+width-1)/this.pixels));
    const r1=Math.min(rows-1,Math.floor((y+height-1)/this.pixels));
    for(let row=r0;row<=r1;row++)for(let col=c0;col<=c1;col++){
      const entry=this.get(col,row,theme);
      if(!entry)return false;
      target.drawImage(entry.surface,col*this.pixels,row*this.pixels);
    }
    return true;
  }
  get bytes() { return (this.entries.size+this.pool.length)*this.pixels*this.pixels*4; }
}
window.BitboundTerrain=Object.freeze({TerrainCache});
})();
