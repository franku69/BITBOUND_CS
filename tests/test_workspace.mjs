/** Controller integration without a browser: parent messages, mode changes, saved code. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as storage from '../app/storage.js';
const html=await readFile(new URL('../app/lab.html',import.meta.url),'utf8');
const source=await readFile(new URL('../app/main.js',import.meta.url),'utf8');
const curriculum=JSON.parse(await readFile(new URL('../app/curriculum.json',import.meta.url),'utf8'));
const standalone=process.argv.includes('--standalone');
const elements=new Map(),events=new Map(),messages=[];let editor,runner,offlineStarts=0,fileOptions;
class Classes{constructor(){this.set=new Set();}add(n){this.set.add(n);}remove(n){this.set.delete(n);}contains(n){return this.set.has(n);}toggle(n,v){if(v??!this.set.has(n))this.set.add(n);else this.set.delete(n);}}
class Element{constructor(id=''){this.id=id;this.classList=new Classes();this.value='';this.children=[];this.dataset={};this.tagName='DIV';this.hidden=false;this.open=false;this.parentElement={hidden:false};}replaceChildren(...children){this.children=children;}setAttribute(){}showModal(){this.open=true;}close(){this.open=false;}scrollIntoView(){}addEventListener(type,fn){(this.listeners||={})[type]=fn;}focus(){}}
for(const match of html.matchAll(/id="([^"]+)"/g))elements.set(match[1],new Element(match[1]));
elements.get('timeLimit').value='15';
const workbench=new Element();
const document={body:new Element(),getElementById:id=>elements.get(id),createElement:()=>new Element(),querySelector:query=>query==='.workbench'?workbench:query==='dialog[open]'?[...elements.values()].find(e=>e.open)||null:null,querySelectorAll:query=>query==='dialog[open]'?[...elements.values()].filter(e=>e.open):[]};
const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
class FakeEditor{constructor(textarea,onChange){editor=this;this.change=onChange;this.value='';}getValue(){return this.value;}setValue(value){this.value=value;}clearTrace(){}refresh(){}highlight(){}insert(){}command(){}indent(){}outdent(){}complete(){}}
class FakeRunner{constructor(){runner=this;this.stops=0;}prepare(){return Promise.resolve();}async run(payload){this.lastPayload=payload;return {passed:true,tests:(payload.task?.tests||[]).map(()=>({passed:true,actual:'Hello, BITBOUND!'})),guidance:[],stdout:'',stderr:'',error:null,elapsedMs:1};}stop(){this.stops++;}}
const parent={postMessage:message=>messages.push(message)};
const window={parent,innerWidth:1280,addEventListener:(type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn);}};
if(standalone){
 window.parent=window;
 const saved=new storage.ProgressStore(new Set(curriculum.items.map(task=>task.id)));
 saved.state.active='q02';
 saved.state.workspaces.free={files:{'main.py':'print("Saved free code")'},current:'main.py',stdin:''};
 memory.set('bitbound-python-dsa-v1',JSON.stringify(saved.state));
}
const context=vm.createContext({window,document,location:{search:'',hash:'',origin:'https://class.example'},history:{replaceState(){}},console,URL,URLSearchParams,TextEncoder,structuredClone,performance,setTimeout,clearTimeout,localStorage:globalThis.localStorage,fetch:async()=>({ok:true,json:async()=>curriculum}),prompt:()=>null,confirm:()=>true});
const providers={'./page-music.js':{startPageMusic(){return {select(){}};}},'./session-controls.js':{installSessionControls(options){fileOptions=options;return {};}},'./offline-session.js':{startOfflineSession(options){offlineStarts++;assert.equal(typeof options.preparePython,'function');}},'./runner.js':{PythonRunner:FakeRunner},'./editor.js':{PythonEditor:FakeEditor},'./storage.js':storage,'./report.js':{escapeHtml:String,exportTeacherReport(){}}};
const module=new vm.SourceTextModule(source,{context,identifier:'https://class.example/app/main.js',initializeImportMeta:meta=>{meta.url='https://class.example/app/main.js';}});
await module.link(async specifier=>{const exports=providers[specifier.split('?')[0]];return new vm.SyntheticModule(Object.keys(exports),function(){for(const [key,value]of Object.entries(exports))this.setExport(key,value);},{context});});
await module.evaluate();
const send=async data=>{for(const listener of events.get('message')||[])await listener({source:parent,origin:'https://class.example',data});};
if(standalone){
 assert.equal(offlineStarts,1,'direct lab starts its own offline session');
 assert.equal(messages.length,0,'standalone lab sends no parent messages');
 assert.notEqual(editor.value,'print("Saved free code")','new lab does not restore another student’s draft');
 assert.equal(editor.value.includes('My own program'),false);
 assert.equal(document.body.classList.contains('free-workspace'),true);
 assert.equal(workbench.dataset.mobileView,'editor');
 editor.value='print("Direct IDE")';editor.change(editor.value);
 await elements.get('runBtn').onclick();
 assert.equal(runner.lastPayload.mode,'run');
 assert.equal(runner.lastPayload.files['main.py'],editor.value);
 // Parent-only commands cannot switch or lock a standalone editor.
 for(const listener of events.get('message')||[])await listener({source:window,origin:'https://class.example',data:{type:'bitbound:open-workspace',taskId:'q01',locked:true}});
 assert.equal(document.body.classList.contains('locked-mission'),false);
 elements.get('missionsBtn').onclick();assert.equal(elements.get('missionDialog').open,true);
 elements.get('chapterList').onclick({target:{closest:()=>({dataset:{task:'q01'}})}});
 assert.equal(document.body.classList.contains('free-workspace'),false);
 elements.get('freeBtn').onclick();assert.equal(editor.value,'print("Direct IDE")','practice keeps free draft separate');
 editor.value='print("Saved before leaving")';editor.change(editor.value);
 elements.get('chooseModeLink').listeners.click();
 const fresh=new storage.ProgressStore(new Set(curriculum.items.map(task=>task.id)));
 assert.equal(fresh.state.workspaces.free,undefined,'navigating away writes no student data');
 const packed=await fileOptions.getSnapshot();assert.equal(packed.python.workspaces.free.files['main.py'],editor.value);
 assert.equal(fileOptions.hasUnsaved(),true);fileOptions.onSaved(packed);assert.equal(fileOptions.hasUnsaved(),false);
 const imported=structuredClone(packed);imported.python.workspaces.free.files['main.py']='print("My chosen file")';imported.story={version:1,team:'My expedition'};
 await fileOptions.applySnapshot(imported);assert.equal(editor.value,'print("My chosen file")');
 assert.equal((await fileOptions.getSnapshot()).story.team,'My expedition','a Story file retains its checkpoint through Lab saves');
 assert.equal(events.has('storage'),false,'no cross-tab student synchronization');
 assert.equal(runner.stops,1,'leaving the mode stops active execution');
 console.log('PASS standalone lab: immediate free IDE, fresh drafts, Run, separate mission work, ignored parent commands, no autosave and explicit file restore.');
}else{
 assert.equal(offlineStarts,0,'story parent owns offline setup');
assert.ok(messages.some(message=>message.type==='bitbound:workspace-ready'));
await send({type:'bitbound:open-workspace',taskId:'free',view:'task',locked:false,session:1});
assert.equal(document.body.classList.contains('free-workspace'),true);assert.equal(workbench.dataset.mobileView,'editor');
editor.value='print("My own program")';editor.change(editor.value);
await send({type:'bitbound:hide-workspace'});assert.equal(runner.stops,0,'closing an idle workspace retains Python');
await send({type:'bitbound:open-workspace',taskId:'q01',view:'task',locked:true,session:2});
assert.equal(document.body.classList.contains('locked-mission'),true);assert.equal(elements.get('chooseTask').hidden,true);
editor.value='print("Hello, BITBOUND!")';editor.change(editor.value);await elements.get('checkBtn').onclick();
assert.ok(messages.some(message=>message.type==='bitbound:challenge-passed'&&message.taskId==='q01'&&message.session===2));
await send({type:'bitbound:open-workspace',taskId:'free',view:'task',locked:false,session:3});
assert.equal(editor.value,'print("My own program")','free coding survives challenge switches');
await send({type:'bitbound:open-workspace',taskId:null,view:'missions',locked:false,session:4});
assert.equal(elements.get('missionDialog').open,true);assert.equal(elements.get('chooseTask').hidden,false);
await send({type:'bitbound:hide-workspace'});assert.equal(elements.get('missionDialog').open,false);
await send({type:'bitbound:session-snapshot',requestId:55});
const snapshot=messages.find(message=>message.type==='bitbound:session-reply'&&message.requestId===55);
assert.equal(snapshot.python.workspaces.free.files['main.py'],'print("My own program")');
await send({type:'bitbound:load-session',requestId:56,python:storage.blankProgress()});
assert.ok(messages.some(message=>message.type==='bitbound:session-reply'&&message.requestId===56&&!message.error));
await send({type:'bitbound:open-workspace',taskId:'free',session:57});
assert.notEqual(editor.value,'print("My own program")','manual load replaces the old in-memory workspaces');
assert.equal(memory.size,0,'embedded editor never saves to browser storage');
console.log('PASS: game-owned workspace startup, free coding, locked missions, completion session IDs, editor reuse and persistent independent drafts.');

}
