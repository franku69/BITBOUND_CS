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

const c=createCanvas(1200,710),g=c.getContext('2d');g.fillStyle='#102431';g.fillRect(0,0,1200,710);
const names=['Stoneborn','Aster','Mira','Rook','Fern','BYTE'];
for(let i=0;i<6;i++){
 g.fillStyle='#172f3e';g.fillRect(i*200+5,38,190,638);
 s.rig(g,{id:names[i],kind:i===0?'hero':i===5?'byte':'ally',index:i-1,x:i*200+100,foot:332,scale:2.5,face:1,motion:'listen',phase:0,mood:'calm',precise:true,expression:{speaking:false}});
 s.rig(g,{id:names[i],kind:i===0?'hero':i===5?'byte':'ally',index:i-1,x:i*200+100,foot:640,scale:2.5,face:1,motion:'speak',phase:.5,mood:'smile',precise:true,expression:{speaking:true,syllable:2}});
 g.fillStyle='#d1e4df';g.font='18px sans-serif';g.fillText(names[i],i*200+50,26);
}
fs.writeFileSync(path.join(out,'characters.png'),c.toBuffer('image/png'));
