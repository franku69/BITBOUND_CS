/* Native raster review. Optional QA dependency: @napi-rs/canvas.
 * Run NODE_PATH=/path/to/node_modules node tests/render_animation_review.cjs /tmp/review
 * Writes filmstrips and 20 FPS source frames; nothing is shipped to game clients. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const {createCanvas}=require('@napi-rs/canvas');
const writeFiles=!process.argv.includes('--check');
const onlyScene=process.argv.find(a=>a.startsWith('--scene='))?.slice(8);
const root=path.resolve(__dirname,'..'),out=process.argv[2];if(!out)throw Error('Provide an output directory');fs.mkdirSync(out,{recursive:true});
const reviewedHash=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'adventure/game.js'))).digest('hex');
const a=require('./helpers/game-harness.cjs').buildContext('?quality=standard').sandbox.TestAPI;
const s={console,document:{createElement:()=>createCanvas(1,1)},state:{appearance:a.state.appearance,gameTime:0},clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,t)=>a+(b-a)*t,reduceMentorMotion:()=>false,mentorMotionQuery:{matches:false},pet:{cheer:0},cloneAppearance:a=>({...a}),currentWeapon:()=>a.WEAPONS.data_blade,CONCEPT_POWERS:a.CONCEPT_POWERS,PERF:{richFx:true}};
s.window=s;vm.createContext(s);
for(const file of ['adventure/core.js','adventure/encounter-catalog.js','adventure/mentor-sprite.js','adventure/creature-sprites.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s);
vm.runInContext('const LruCache=BitboundCore.LruCache; const MOBS=BitboundEncounters.MOBS;',s);
for(const file of JSON.parse(fs.readFileSync(path.join(root,'adventure/systems/order.json'))).filter(f=>f.startsWith('07-')))vm.runInContext(fs.readFileSync(path.join(root,'adventure/systems',file),'utf8'),s);
vm.runInContext(`const mentorFrames=BitboundMentorSprite.create(document);cacheStoryHero();
const originalRigDraw=drawRigActor,originalDemonDraw=drawDemonActor;
let actualDraws=[];
drawRigActor=function(g,a){if(a.id)actualDraws.push(a.id);return originalRigDraw(g,a);};
drawDemonActor=function(g,a){if(a.id)actualDraws.push(a.id);return originalDemonDraw(g,a);};
window.paint=function(g,art,t,p,ambient=0){actualDraws=[];const f=drawStoryPicture(g,art,t,p,ambient);return {f,actualDraws};};window.rig=drawRigActor;window.battle=drawEncounterBattle;`,s);
const book=JSON.parse(fs.readFileSync(path.join(root,'adventure/story.json')));
const entries=Object.entries(book.scenes).flatMap(([scene,def])=>def.pages.map((page,i)=>({scene,i,page})));
const pictures=createCanvas(640,300),stripCanvas=createCanvas(1280,975),sequenceCanvas=createCanvas(640,330),g=pictures.getContext('2d');let frames=0;const times=[];
for(const entry of entries){
 if(onlyScene&&entry.scene!==onlyScene)continue;
 const strip=stripCanvas,p=strip.getContext('2d');p.fillStyle='#10212e';p.fillRect(0,0,1280,975);
 for(let n=0;n<=60;n++){
  const start=performance.now(),result=s.paint(g,entry.page.art,n/60,entry.page);times.push(performance.now()-start);
  assert.equal(new Set(result.actualDraws).size,result.actualDraws.length,'renderer called only once per actor');
  assert.deepEqual([...result.actualDraws].sort(),[...result.f.rendered].sort(),'scene graph matches actual draw calls');
  if([0,20,40,60].includes(n)){const k=n/20;p.drawImage(pictures,k%2*640,Math.floor(k/2)*325+25);p.fillStyle='#e5e9cf';p.font='14px monospace';p.fillText(`${entry.scene} ${entry.i+1} · ${entry.page.beat} · ${Math.round(n/60*100)}%`,k%2*640+10,Math.floor(k/2)*325+18);}
  frames++;
 }
 for(const [i,seconds] of [2,8].entries()){s.paint(g,entry.page.art,1,entry.page,seconds);p.drawImage(pictures,i*640,675);p.fillStyle='#e5e9cf';p.fillText(`Reading idle +${seconds}s`,i*640+10,668);}
 if(writeFiles)fs.writeFileSync(path.join(out,`${entry.scene}-${String(entry.i+1).padStart(2,'0')}.png`),strip.toBuffer('image/png'));
}
// Full continuous sequences for the reported failures, not selected stills alone.
const clips=entries.map(e=>[e.scene,e.i]).concat([['cell-exit',0],['cell-scroll',0],['forge',0],['forge',1],['forge',2],['forge',3]]);
fs.mkdirSync(path.join(out,'frames'),{recursive:true});let serial=0,sequenceFrames=0;
for(const [scene,i] of clips){
 const page=scene==='cell-exit'?{art:'prison',byteExit:true}:scene==='cell-scroll'?{art:'prison',beat:'scroll',hideByte:true}:scene==='forge'?{art:'prison',beat:'forge',forgeStep:i,forgeAction:['inspect','heat','hammer','quench'][i],hideByte:true}:book.scenes[scene].pages[i];
 const count=scene==='rivals'&&i===9?240:90;
 if(onlyScene&&scene!==onlyScene){serial+=count;continue;}
 for(let n=0;n<count;n++){
  const c=sequenceCanvas,cx=c.getContext('2d');cx.fillStyle='#0d1d2a';cx.fillRect(0,0,640,330);s.paint(cx,page.art,n/(count-1),page);cx.fillStyle='#d3e7e8';cx.font='15px monospace';cx.fillText(scene+' · '+(i+1),16,320);
  if(writeFiles)fs.writeFileSync(path.join(out,'frames',String(serial).padStart(5,'0')+'.png'),c.toBuffer('image/png'));serial++;sequenceFrames++;
 }
}
// Real encounter battle art across every creature type and each world palette.
let battleFrames=0;
const battleStrip=createCanvas(1280,9*249),bg=battleStrip.getContext('2d');bg.fillStyle='#0b1c2a';bg.fillRect(0,0,1280,9*249);
for(const [index,type] of Object.keys(s.BitboundEncounters.MOBS).entries()){
 const session={world:index%8,appearance:a.state.appearance,enemy:{type},visual:'intro'};
 const picture=createCanvas(640,224),pg=picture.getContext('2d');
 for(const mode of ['intro','retry','win'])for(let n=0;n<=30;n++){
   session.visual=mode;s.battle(pg,session,n/30);battleFrames++;
   if(mode==='intro'&&n===30)bg.drawImage(picture,0,index*249+25);
   if(mode==='win'&&n===20)bg.drawImage(picture,640,index*249+25);
 }
 bg.fillStyle='#d3e8df';bg.font='14px monospace';bg.fillText(type+' · encounter / seal broken',12,index*249+18);
}
if(writeFiles)fs.writeFileSync(path.join(out,'encounter-battles.png'),battleStrip.toBuffer('image/png'));
for(const mode of ['intro','retry','win'])for(let n=0;n<30;n++){
 const c=sequenceCanvas,cx=c.getContext('2d');cx.fillStyle='#0d1d2a';cx.fillRect(0,0,640,330);
 s.battle(cx,{world:0,appearance:a.state.appearance,enemy:{type:'slime'},visual:mode},n/29);
 cx.fillStyle='#d3e7e8';cx.font='15px monospace';cx.fillText('Required rune battle · '+mode,16,310);
 if(writeFiles)fs.writeFileSync(path.join(out,'frames',String(serial).padStart(5,'0')+'.png'),c.toBuffer('image/png'));serial++;sequenceFrames++;
}
// Action contact sheet: all four party members, BYTE and player, at game and story scales.
const actions=['walk','jump','dash','attack','kneel','wave'];
const atlas=createCanvas(1280,1080),ag=atlas.getContext('2d');ag.fillStyle='#132b39';ag.fillRect(0,0,1280,1080);
for(let row=0;row<6;row++)for(let col=0;col<6;col++){
 const actor={kind:row===0?'hero':row===5?'byte':'ally',index:row-1,x:col*210+96,foot:row*180+153,scale:1.4,motion:actions[col],phase:.55,mood:'calm',armed:['walk','jump','dash','attack'].includes(actions[col])};
 s.rig(ag,actor);ag.fillStyle='#b8d2d3';ag.font='14px monospace';ag.fillText(actions[col],col*210+68,row*180+173);
}
if(writeFiles)fs.writeFileSync(path.join(out,'action-poses.png'),atlas.toBuffer('image/png'));
times.sort((a,b)=>a-b);const report={sourceSHA256:reviewedHash,rasterFrames:frames,battleFrames,pages:onlyScene?entries.filter(e=>e.scene===onlyScene).length:entries.length,sequenceFrames,renderMs:{median:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],max:times.at(-1)},renderer:'Node + native Canvas on this machine; not browser FPS or device heat',checks:['actual draw calls match unique actor IDs',onlyScene?'selected story pages render without exceptions':'all story pages render without exceptions','all 81 story pages plus cell/forge sequences exported; ambient sampled at +2 and +8 seconds']};
fs.writeFileSync(path.join(out,onlyScene?'report-'+onlyScene+'.json':'report.json'),JSON.stringify(report,null,2));console.log(report);
