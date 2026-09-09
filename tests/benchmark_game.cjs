/** Local JS/drawing-command benchmark; does not measure GPU, device heat or browser FPS. */
const fs=require('node:fs');
const path=require('node:path');
const {performance}=require('node:perf_hooks');
const {buildContext}=require('./helpers/game-harness.cjs');
const frames=600;
function measure(scroll=false,cacheEnabled=true){
  const {sandbox,drawCalls}=buildContext('?quality=low');
  const game=sandbox.TestAPI;
  if(!cacheEnabled)game.terrainCache.draw=()=>false;
  let aggregateCalls=0,totalMs=0,maxCacheBytes=0;
  const worlds=[];
  game.state.started=true;
  for(let level=0;level<game.worlds.length;level++){
    game.state.level=level;game.generateWorld(level);
    game.state.camera.x=800;game.state.camera.y=480;
    for(let i=0;i<10;i++)game.draw();
    for(const key of Object.keys(drawCalls))drawCalls[key]=0;
    const initialBuilds=game.terrainCache.stats.builds;
    const started=performance.now();
    for(let i=0;i<frames;i++){
      game.state.gameTime=i/30;
      if(scroll)game.state.camera.x=800+i*6.6; // 198 px/sec at 30 FPS, normal run speed.
      game.draw();
    }
    const elapsed=performance.now()-started,calls=Object.values(drawCalls).reduce((a,b)=>a+b,0);
    worlds.push({world:level+1,meanCpuMs:elapsed/frames,canvasCommandsPerFrame:calls/frames,chunkBuilds:game.terrainCache.stats.builds-initialBuilds});
    aggregateCalls+=calls;totalMs+=elapsed;maxCacheBytes=Math.max(maxCacheBytes,game.terrainCache.bytes);
  }
  return {framesPerWorld:frames,worlds,meanCpuMs:totalMs/(frames*game.worlds.length),canvasCommandsPerFrame:aggregateCalls/(frames*game.worlds.length),maxCacheBytes};
}
const result={environment:'Node VM + mocked Canvas. Measures JS time and drawing commands only; no physical device, browser, GPU or temperature measurement.',
  stationary:measure(),scrolling:measure(true),scrollingWithoutCache:measure(true,false)};
const label=process.argv[2];
if(label){fs.writeFileSync(path.join(__dirname,'..','docs','game-benchmark-'+label+'.json'),JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify(result,null,2));
