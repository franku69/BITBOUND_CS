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

vm.runInContext('window.body=(g,i,pose)=>paintAlly(g,i,pose,false,"body");',s);
// A static torso must not bob separately from the limbs when the face changes mood.
for(let i=0;i<4;i++){
 const c=createCanvas(64,96),g=c.getContext('2d');s.body(g,i,'calm');const expected=Buffer.from(g.getImageData(0,0,64,96).data);
 for(const pose of ['shock','grin','angry','cheer','sad']){g.clearRect(0,0,64,96);s.body(g,i,pose);assert.deepEqual(Buffer.from(g.getImageData(0,0,64,96).data),expected);}
}
let sampled=0;
const all=createCanvas(960,420),g=all.getContext('2d');
for(const motion of a.RIG_ACTIONS){
 g.fillStyle='#102431';g.fillRect(0,0,960,420);
 for(let i=0;i<6;i++){
  for(let n=0;n<=20;n++){
   const c=createCanvas(120,128),cx=c.getContext('2d');s.rig(cx,{kind:i===0?'hero':i===5?'byte':'ally',index:i-1,x:56,foot:118,scale:1,motion,phase:n/20,precise:true,armed:i<5});sampled++;
  }
  s.rig(g,{kind:i===0?'hero':i===5?'byte':'ally',index:i-1,x:i*160+65,foot:320,scale:2.3,motion,phase:.55,precise:true,armed:i<5});
  g.fillStyle='#dce9e7';g.font='15px sans-serif';g.fillText(['Stoneborn','Aster','Mira','Rook','Fern','BYTE'][i],i*160+25,354);
 }
 g.fillStyle='#f1d8a1';g.font='24px sans-serif';g.fillText(motion,24,38);
 fs.writeFileSync(path.join(out,'rig-'+motion+'.png'),all.toBuffer('image/png'));
}
const book=JSON.parse(fs.readFileSync(path.join(root,'adventure/story.json')));
const selections=[['origin',4],['rescue',1],['camp1',3],['camp2',1],['camp2',3],['betrayal',0],['betrayal',6],['prison departure',-1],['forge',-1],['rivals',9],['fusion',5],['ending',4]];
const dest=path.join(out,'preview-frames');fs.mkdirSync(dest,{recursive:true});let serial=0;
const frame=createCanvas(640,370),fg=frame.getContext('2d');
function save(label){fg.fillStyle='#0b1924';fg.fillRect(0,300,640,70);fg.fillStyle='#d9e9e6';fg.font='18px sans-serif';fg.fillText(label,18,330);fg.fillStyle='#8eafbb';fg.font='13px sans-serif';fg.fillText('BITBOUND v24 · Actual game renderer · Silent preview',18,353);fs.writeFileSync(path.join(dest,String(serial++).padStart(5,'0')+'.png'),frame.toBuffer('image/png'));}
for(const motion of ['listen','walk','run','jump','dash','attack','wave'])for(let n=0;n<60;n++){
 fg.fillStyle='#142938';fg.fillRect(0,0,640,300);fg.fillStyle='#233e4c';fg.fillRect(0,254,640,46);
 for(let i=0;i<6;i++){
  const phase=n/59,x=55+i*106+(motion==='walk'||motion==='run'?phase*30-15:0);
  s.rig(fg,{kind:i===0?'hero':i===5?'byte':'ally',index:i-1,x,foot:253-(motion==='jump'?Math.sin(phase*Math.PI)*55:0),scale:1.6,face:1,motion,phase,precise:true,armed:['walk','run','dash','attack'].includes(motion)&&i<5,expression:motion==='listen'?{speaking:n%30<20,syllable:n%4}:undefined});
 }
 save('Shared character rig · '+motion);
}
for(const [scene,i] of selections){
 const p=scene==='prison departure'?{art:'prison',byteExit:true,durationMs:12000}:scene==='forge'?{art:'prison',beat:'forge',forgeAction:'hammer',forgeStep:1,hideByte:true,durationMs:8000}:book.scenes[scene].pages[i];
 const duration=p.durationMs||8000,count=Math.ceil(duration/50)+21;
 for(let n=0;n<count;n++){
  fg.clearRect(0,0,640,370);s.paint(fg,p.art,Math.min(1,n*50/duration),p,Math.max(0,(n*50-duration)/1000));save(scene+' · '+(p.title||p.beat||p.art));
 }
}
const report={sourceSHA256:reviewedHash,rigFrames:sampled,actions:a.RIG_ACTIONS.length,characters:6,previewFrames:serial,previewFPS:20,staticTorsoChecks:20};fs.writeFileSync(path.join(out,'character-review.json'),JSON.stringify(report,null,2));console.log(report);
