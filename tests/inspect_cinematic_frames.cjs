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

const sheets=[['fusion','fusion',book.scenes.fusion.pages[5]],['prison-exit','prison',{art:'prison',byteExit:true}],['read','prison',{art:'prison',beat:'scroll',hideByte:true}],...['inspect','heat','hammer','quench'].map((forgeAction,forgeStep)=>[forgeAction,'prison',{art:'prison',beat:'forge',forgeStep,forgeAction,hideByte:true}])];
for(const [name,art,page] of sheets){const sheet=createCanvas(1280,990),g=sheet.getContext('2d'),picture=createCanvas(640,300),p=picture.getContext('2d');g.fillStyle='#10212e';g.fillRect(0,0,1280,990);
for(const [i,t] of [0,.25,.45,.6,.82,1].entries()){s.paint(p,art,t,page);g.drawImage(picture,i%2*640,Math.floor(i/2)*330+25);g.fillStyle='#e5e9cf';g.font='16px monospace';g.fillText(name+' '+Math.round(t*100)+'%',i%2*640+10,Math.floor(i/2)*330+18);}
fs.writeFileSync(path.join(out,name+'.png'),sheet.toBuffer('image/png'));}
