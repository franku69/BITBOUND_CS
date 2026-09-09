import {startPageMusic} from './page-music.js?v=a47c8ef5bc66';
import {startOfflineSession} from './offline-session.js?v=69f8d0e7c57b';
import {installSessionControls} from './session-controls.js?v=d5a34d7e028d';
import {PythonRunner} from './runner.js?v=73a651e0d5c6';
import {PythonEditor} from './editor.js?v=2ea6d0875b3f';
import {ProgressStore,download,validName,MAX_FILE_BYTES,MAX_FILES} from './storage.js?v=8749b2c7cc4b';
import {escapeHtml as esc,exportTeacherReport} from './report.js?v=30ec6c13058c';

const $=id=>document.getElementById(id);
const embedded=window.parent!==window;
const labMusic=startPageMusic('lab');
if(embedded){const musicButton=document.querySelector('[data-music-toggle]');if(musicButton)musicButton.hidden=true;}
if(embedded)document.body.classList.add('embedded');
const notice=message=>{$('notice').textContent=message;$('notice').hidden=!message;};
let curriculum;
try {
  const response=await fetch(new URL('./curriculum.json',import.meta.url));
  if(!response.ok)throw new Error();
  curriculum=await response.json();
} catch {
  notice('The missions could not load. Open the class website while connected, or start the downloaded folder with START_WINDOWS.bat. ');
  throw new Error('Curriculum unavailable');
}
const {items,chapters}=curriculum;
const byId=new Map(items.map(item=>[item.id,item]));
const chaptersById=new Map(chapters.map(chapter=>[chapter.id,chapter]));
const chapterItems=new Map(chapters.map(chapter=>[chapter.id,items.filter(item=>item.chapter===chapter.id)]));
const progress=new ProgressStore(new Set(byId.keys()));
const freeTask={id:'free',number:0,title:'Your Python playground',chapter:'python',concept:'Experiment with Python. Write small programs, test an idea, or solve an exercise your teacher gives you.',prompt:'Run main.py to start your program. You can create helper files and import them. For input(), supply answers in Program input before running.',starter:'# Your own Python experiments\nfrom collections import deque\n\nqueue = deque(["Ana", "Ben"])\nqueue.append("Cid")\nprint("Next:", queue.popleft())\nprint("Waiting:", list(queue))\n',stdin:'',tests:[],hints:[],complexity:'Trace a short example to see how variables change.',xp:0};
let active=freeTask,workspace,changing=false,busy=false,trace=[],traceIndex=0;
let workspaceSession=0,lockedMission=false,streamedOutput='',streamTimer=0;
const tellGame=message=>{if(embedded)window.parent.postMessage(message,location.origin);};
const runner=new PythonRunner(message=>{$('runtimeStatus').textContent=message;},text=>{
  streamedOutput=(streamedOutput+text).slice(0,24000);
  if(!streamTimer)streamTimer=setTimeout(()=>{$('output').textContent=streamedOutput;streamTimer=0;},40);
});
function warmPython(){
  return runner.prepare().then(()=>tellGame({type:'bitbound:python-ready'})).catch(()=>tellGame({type:'bitbound:python-unavailable'}));
}
const editor=new PythonEditor($('codeEditor'),value=>{
  if(changing || !workspace)return;
  if(new TextEncoder().encode(value).length>MAX_FILE_BYTES){notice('This file exceeds 60 KB. Shorten it before running or saving a backup.');return;}
  workspace.files[workspace.current]=value;
  editor.clearTrace();
  markChanged();
},notice);
let carriedStory=null,sessionReady=false;
function updateSessionStatus(){
  $('saveStatus').textContent=progress.dirty?'Unsaved session · choose Save file before leaving.':'Manual saves only · new visits start fresh. Load your file to continue.';
}
function markChanged(){
  progress.changed();updateSessionStatus();
  if(sessionReady)tellGame({type:'bitbound:session-changed',revision:progress.revision});
}
function snapshotPython(){
  if(workspace)workspace.files[workspace.current]=editor.getValue();
  return progress.state;
}
function getWorkspace(task){
  return progress.state.workspaces[task.id] ||= {files:{'main.py':task.starter},current:'main.py',stdin:task.stdin||''};
}
function selectFile(name){
  changing=true;workspace.current=name;editor.setValue(workspace.files[name]);$('fileSelect').value=name;$('deleteFile').disabled=name==='main.py';changing=false;markChanged();
}
function renderFiles(){
  $('fileSelect').replaceChildren(...Object.keys(workspace.files).map(name=>{const o=document.createElement('option');o.value=o.textContent=name;return o;}));
  selectFile(Object.hasOwn(workspace.files,workspace.current)?workspace.current:'main.py');
}
function setMobileView(view){
  document.querySelector('.workbench').dataset.mobileView=view;
  document.querySelectorAll('[data-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.view===view)));
  if(view==='editor')editor.refresh();
}
function clearResults(){
  $('output').textContent='Your output appears here.';$('testResults').replaceChildren();$('errorHelp').hidden=true;$('tracePanel').hidden=true;trace=[];editor.clearTrace();
  $('runSummary').textContent=active.id==='free'?'Experiment, then Run. Free lab has no automatic score.':'Run a sample, then Check challenge to test several inputs.';
}
function renderHints(){
  const count=progress.state.hints[active.id]||0;
  $('hintContent').innerHTML=active.hints.slice(0,count).map((hint,i)=>`<p><b>Hint ${i+1}:</b> ${esc(hint)}</p>`).join('');
  $('hintBtn').disabled=count>=active.hints.length;
  $('hintBtn').textContent=count>=active.hints.length?'All hints shown':'Need a hint?';
}
function renderCompletion(){
  const result=progress.state.completed[active.id];
  $('taskCompletion').textContent=result?'✓ Mission complete. You can keep practicing.':'';
  const done=Object.keys(progress.state.completed).length;
  $('totalDone').textContent=`${done}/${items.length}`;
}
function selectTask(id,{push=true}={}){
  if(busy){notice('Stop the running program before switching missions.');return;}
  if(workspace)markChanged();
  active=byId.get(id)||freeTask;labMusic.select(active.id==='free'?'lab':'practice');
  progress.state.active=active.id;
  workspace=getWorkspace(active);
  const isFree=active.id==='free';
  document.body.classList.toggle('free-workspace',isFree);
  $('chapterLabel').textContent=isFree?'FREE LAB':chaptersById.get(active.chapter).title.toUpperCase();
  $('missionNumber').textContent=isFree?'∞':String(active.number).padStart(2,'0');
  $('taskTitle').textContent=active.title;
  $('taskConcept').textContent=active.concept;
  $('taskPrompt').textContent=active.prompt;
  $('xpLabel').textContent=isFree?'EXPLORE':`${active.xp} XP`;
  $('functionTip').hidden=isFree||active.number<5;
  $('complexityText').textContent=active.complexity;
  $('workspaceLabel').textContent=isFree?'Free lab':`Mission ${String(active.number).padStart(2,'0')}`;
  $('checkBtn').disabled=isFree;
  $('hintBtn').parentElement.hidden=isFree;
  $('examples').hidden=isFree;
  $('solutionCode').hidden=true;
  $('exampleList').innerHTML=active.tests.map((test,i)=>`<p class="small"><b>Case ${i+1}</b></p><pre>${esc(test.setup?test.setup+'\n':'')}${esc(test.expression || 'Input: '+JSON.stringify(test.stdin||''))}\nExpected: ${esc('stdout' in test?test.stdout:JSON.stringify(test.expected))}${test.type?' ('+esc(test.type)+')':''}</pre>`).join('');
  $('stdin').value=workspace.stdin;
  $('stdinBox').open=!!workspace.stdin;
  $('previousBtn').disabled=isFree||active.number===1;
  $('nextBtn').disabled=isFree||active.number===items.length;
  $('missionsBtn').classList.toggle('nav-current',!isFree);
  $('freeBtn').classList.toggle('nav-current',isFree);
  renderFiles();renderHints();renderCompletion();clearResults();
  if(push&&!embedded)history.replaceState(null,'',`#${active.id}`);
  markChanged();
}
function openDialog(id){$(id).showModal();}
function renderMissionList(){
  $('chapterList').innerHTML=chapters.map((chapter,i)=>{
    const tasks=chapterItems.get(chapter.id),count=tasks.filter(task=>progress.state.completed[task.id]).length;
    return `<details class="chapter" ${chapter.id===active.chapter?'open':''}><summary><span>${String(i+1).padStart(2,'0')} · ${esc(chapter.title)}</span><span>${count}/6</span></summary><p>${esc(chapter.summary)}</p><div class="task-grid">${tasks.map(task=>`<button class="task-button ${task.id===active.id?'active':''}" data-task="${task.id}"><span class="num">${String(task.number).padStart(2,'0')}</span><span>${esc(task.title)}</span><span class="status">${progress.state.completed[task.id]?'✓':'→'}</span></button>`).join('')}</div></details>`;
  }).join('');
}
function renderProgress(){
  const done=items.filter(task=>progress.state.completed[task.id]);
  const xp=done.reduce((total,task)=>total+task.xp,0);
  $('studentName').value=progress.state.name;
  $('progressStats').innerHTML=`<div class="stat"><strong>${done.length}/48</strong>Missions cleared</div><div class="stat"><strong>${xp}</strong>Experience points</div><div class="stat"><strong>${Math.floor(xp/120)+1}</strong>Explorer level</div>`;
  $('progressChapters').innerHTML=chapters.map(chapter=>{const count=chapterItems.get(chapter.id).filter(task=>progress.state.completed[task.id]).length;return `<p>${esc(chapter.title)} · ${count}/6</p><progress max="6" value="${count}" aria-label="${esc(chapter.title)} progress"></progress>`;}).join('');
}
function showErrorHelp(message){
  const tips=[['IndentationError','Indent the lines inside a function, loop, or if block by four spaces. Avoid mixing tabs and spaces.'],['SyntaxError','Look at the line number. Check colons, matching brackets, and quotation marks.'],['NameError','Check spelling and capitalization. Define the variable before using it.'],['TypeError','Check the types you are combining and the number of arguments passed to your function. input() gives text; int() converts a whole number.'],['IndexError','That position is outside the list. Check len(items), and handle an empty list.'],['EOFError','Your program asked for more input. Add one line per input() in Program input. Check challenge supplies its own test inputs.'],['RecursionError','Your recursion may be missing a base case, or the input may be too deep.'],['ModuleNotFoundError','Check the import name. Helper files must be in this workspace. Extra third-party packages are not bundled.'],['ZeroDivisionError','Check for zero before dividing. An empty list has length zero.']];
  const tip=tips.find(([name])=>message.includes(name));
  $('errorHelp').textContent=tip?tip[1]:message;
  $('errorHelp').hidden=false;
}
function renderTrace(){
  if(!trace.length)return;
  const frame=trace[traceIndex];
  $('traceRange').value=traceIndex;
  $('traceLabel').textContent=`${traceIndex+1}/${trace.length} · ${frame.event==='return'?'Returning at':'Before'} line ${frame.line} · ${frame.function}`;
  $('traceVariables').textContent=Object.entries(frame.variables).map(([name,value])=>`${name} = ${value}`).join('\n')||'(No local variables yet.)';
  if(workspace.current==='main.py')editor.highlight(frame.line);
  $('traceBack').disabled=traceIndex===0;$('traceForward').disabled=traceIndex===trace.length-1;
}
async function run(mode){
  if(busy)return;
  if(mode==='check'&&active.id==='free')return;
  if(new TextEncoder().encode(editor.getValue()).length>MAX_FILE_BYTES){notice('Shorten the current file to under 60 KB before running.');return;}
  workspace.files[workspace.current]=editor.getValue();
  markChanged();notice('');busy=true;streamedOutput='';clearTimeout(streamTimer);streamTimer=0;
  for(const id of ['runBtn','checkBtn','traceBtn'])$(id).disabled=true;
  $('stopBtn').disabled=false;
  clearResults();$('output').textContent='Loading / running Python…';
  const submittedTask=active;
  const submittedFiles=structuredClone(workspace.files);
  const submittedSession=workspaceSession;
  const solutionViewed=!!progress.state.practiceSolution[active.id];
  if(mode==='check'){progress.state.attempts[active.id]=(progress.state.attempts[active.id]||0)+1;markChanged();}
  try {
    const result=await runner.run({mode,files:submittedFiles,stdin:workspace.stdin,task:mode==='check'?submittedTask:undefined},Number($('timeLimit').value));
    clearTimeout(streamTimer);streamTimer=0;
    $('output').textContent=result.error || [result.stdout,result.stderr].filter(Boolean).join('\n') || (mode==='check'?'See the test cases below.':'Program finished with no printed output. If your function returns a value, print a sample call to see it.');
    if(result.error){showErrorHelp(result.error);$('runSummary').textContent='Python found an error. Read the line number below, fix it, and retry.';}
    else if(mode==='check'){
      const results=result.tests||[];
      const passed=results.filter(test=>test.passed).length;
      $('runSummary').textContent=result.passed?`✓ All ${results.length} cases passed. Mission complete!`:`${passed}/${results.length} cases passed. Keep going—retries do not cost points.`;
      $('testResults').innerHTML=(result.guidance||[]).map(message=>`<div class="error-help">${esc(message)}</div>`).join('')+results.map((test,i)=>{
        const spec=submittedTask.tests[i];
        const details=test.error||`${spec.setup?spec.setup+'\n':''}${spec.expression || 'Input: '+JSON.stringify(spec.stdin||'')}\nExpected: ${'stdout' in spec?spec.stdout:JSON.stringify(spec.expected)}\nYour result: ${test.actual}`;
        return `<details class="test-result ${test.passed?'pass':''}" ${test.passed?'':'open'}><summary>${test.passed?'✓':'↻'} Case ${i+1} · ${test.passed?'Passed':'Try again'}</summary><pre>${esc(details)}</pre></details>`;
      }).join('');
      if(result.passed){
        progress.state.completed[submittedTask.id]={at:new Date().toISOString(),solutionViewed,code:submittedFiles['main.py']};
        markChanged();renderCompletion();
        if(embedded)window.parent.postMessage({type:'bitbound:challenge-passed',taskId:submittedTask.id,session:submittedSession},location.origin);
      }
    } else $('runSummary').textContent=`Run finished · ${result.elapsedMs<1000?Math.max(1,Math.round(result.elapsedMs))+' ms':(result.elapsedMs/1000).toFixed(2)+' sec'}`;
    if(mode==='trace'&&result.trace?.length){trace=result.trace;traceIndex=0;$('tracePanel').hidden=false;$('traceRange').max=trace.length-1;renderTrace();}
    $('runtimeStatus').textContent='Python ready · no program running';
  } catch(error){
    clearTimeout(streamTimer);streamTimer=0;
    $('output').textContent=(streamedOutput?streamedOutput+'\n\n':'')+error.message;$('runSummary').textContent='Run stopped. Your code is still in the editor.';showErrorHelp(error.message);$('runtimeStatus').textContent='Run again when ready';
  } finally {
    busy=false;clearTimeout(streamTimer);streamTimer=0;for(const id of ['runBtn','traceBtn'])$(id).disabled=false;$('checkBtn').disabled=active.id==='free';$('stopBtn').disabled=true;setMobileView('results');
    if(window.innerWidth>760)$('resultsPanel').scrollIntoView({block:'nearest'});
  }
}
$('runBtn').onclick=()=>run('run');$('checkBtn').onclick=()=>run('check');$('traceBtn').onclick=()=>run('trace');$('stopBtn').onclick=()=>runner.stop();
$('clearOutput').onclick=clearResults;
$('fileSelect').onchange=event=>selectFile(event.target.value);
$('newFile').onclick=()=>{
  if(Object.keys(workspace.files).length>=MAX_FILES){notice('Use up to eight Python files per workspace.');return;}
  const raw=prompt('Python filename, for example helpers.py');if(raw===null)return;const name=raw.trim();
  if(!validName(name)){notice('Use letters, numbers and underscores, ending in .py. Avoid standard-library module names such as collections.py.');return;}
  if(Object.hasOwn(workspace.files,name)){selectFile(name);return;}
  workspace.files[name]='# '+name+'\n';workspace.current=name;renderFiles();
};
$('deleteFile').onclick=()=>{const name=workspace.current;if(name!=='main.py'&&confirm(`Delete ${name} from this workspace?`)){delete workspace.files[name];workspace.current='main.py';renderFiles();}};
$('downloadCode').onclick=()=>download(workspace.current,editor.getValue(),'text/x-python;charset=utf-8');
$('importCode').onclick=()=>$('codeUpload').click();
$('codeUpload').onchange=async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  if(file.size>MAX_FILE_BYTES||!validName(file.name)){notice('Choose a .py file under 60 KB with a simple, non-reserved filename.');return;}
  if(!Object.hasOwn(workspace.files,file.name)&&Object.keys(workspace.files).length>=MAX_FILES){notice('Use at most eight files per workspace.');return;}
  if(Object.hasOwn(workspace.files,file.name)&&!confirm(`Replace ${file.name} with the imported file?`))return;
  workspace.files[file.name]=await file.text();workspace.current=file.name;renderFiles();notice(`Imported ${file.name}. Run starts main.py.`);
};
$('stdin').oninput=()=>{workspace.stdin=$('stdin').value;markChanged();};
$('indentBtn').onclick=()=>editor.indent();$('outdentBtn').onclick=()=>editor.outdent();
$('undoBtn').onclick=()=>editor.command('undo');$('redoBtn').onclick=()=>editor.command('redo');$('searchBtn').onclick=()=>editor.command('find');$('completeBtn').onclick=()=>editor.complete();
for(const button of document.querySelectorAll('[data-insert]'))button.onclick=()=>editor.insert(button.dataset.insert);
$('resetBtn').onclick=()=>{if(busy)return;if(confirm('Restore this mission’s starter code? This replaces its files and input; your completion remains.')){progress.state.workspaces[active.id]={files:{'main.py':active.starter},current:'main.py',stdin:active.stdin||''};selectTask(active.id);}};
$('hintBtn').onclick=()=>{progress.state.hints[active.id]=(progress.state.hints[active.id]||0)+1;renderHints();markChanged();};
$('solutionBtn').onclick=()=>{
  $('solutionCode').textContent=active.solution;$('solutionCode').hidden=!$('solutionCode').hidden;
  if(!$('solutionCode').hidden){progress.state.practiceSolution[active.id]=true;markChanged();}
};
$('previousBtn').onclick=()=>{selectTask(items[active.number-2]?.id);setMobileView('mission');};
$('nextBtn').onclick=()=>{selectTask(items[active.number]?.id);setMobileView('mission');};
for(const id of ['missionsBtn','chooseTask'])$(id).onclick=()=>{renderMissionList();openDialog('missionDialog');};
$('chapterList').onclick=event=>{const button=event.target.closest('[data-task]');if(button){selectTask(button.dataset.task);$('missionDialog').close();setMobileView('mission');}};
$('freeBtn').onclick=()=>{selectTask('free');setMobileView('editor');};
$('helpBtn').onclick=()=>openDialog('helpDialog');
$('progressBtn').onclick=()=>{renderProgress();openDialog('progressDialog');};
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>$(button.dataset.close).close();
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>setMobileView(button.dataset.view);
$('studentName').oninput=()=>{progress.state.name=$('studentName').value;markChanged();};
$('exportReport').onclick=()=>exportTeacherReport(snapshotPython(),items);
let sessionFiles=null;
if(!embedded){
  sessionFiles=installSessionControls({
    ids:new Set(byId.keys()),
    getSnapshot:()=>({python:snapshotPython(),story:carriedStory,token:progress.revision}),
    onSaved:snapshot=>{progress.markSaved(snapshot.token);updateSessionStatus();},
    hasUnsaved:()=>progress.dirty,
    applySnapshot:async pack=>{
      if(busy){runner.stop();await new Promise(resolve=>setTimeout(resolve,0));}
      progress.import(pack.python);carriedStory=pack.story;workspace=null;
      selectTask(progress.state.active);renderProgress();progress.markSaved();updateSessionStatus();
    },
    report:notice
  });
}
$('traceRange').oninput=()=>{traceIndex=Number($('traceRange').value);renderTrace();};
$('traceBack').onclick=()=>{traceIndex=Math.max(0,traceIndex-1);renderTrace();};
$('traceForward').onclick=()=>{traceIndex=Math.min(trace.length-1,traceIndex+1);renderTrace();};
window.addEventListener('pagehide',()=>runner.stop());
$('chooseModeLink').addEventListener('click',()=>runner.stop());
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(!embedded&&(byId.has(id)||id==='free'))selectTask(id,{push:false});});
window.addEventListener('resize',()=>editor.refresh());

// Parent commands retarget the same editor and worker; never navigate/recreate them.
window.addEventListener('message',async event=>{
  if(!embedded||event.source!==window.parent||event.origin!==location.origin)return;
  const data=event.data||{};
  if(data.type==='bitbound:hide-workspace'){
    for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
    if(busy)runner.stop('Stopped when the Python window closed. Your code remains in this session.');
    return;
  }
  if(data.type==='bitbound:session-snapshot'){
    tellGame({type:'bitbound:session-reply',requestId:data.requestId,python:snapshotPython(),revision:progress.revision});return;
  }
  if(data.type==='bitbound:load-session'){
    try{
      // Validate before cancelling the old workspace or changing its state.
      const next=new ProgressStore(new Set(byId.keys()));next.import(data.python);
      if(busy){runner.stop();await new Promise(resolve=>setTimeout(resolve,0));}
      progress.import(next.state);workspace=null;selectTask('free',{push:false});progress.markSaved();updateSessionStatus();
      tellGame({type:'bitbound:session-reply',requestId:data.requestId,revision:progress.revision});
    }catch(error){tellGame({type:'bitbound:session-reply',requestId:data.requestId,error:error.message});}
    return;
  }
  if(data.type==='bitbound:session-saved'){
    if(Number.isSafeInteger(data.revision))progress.markSaved(data.revision);updateSessionStatus();return;
  }
  if(data.type!=='bitbound:open-workspace')return;
  if(busy){runner.stop();await new Promise(resolve=>setTimeout(resolve,0));}
  for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
  workspaceSession=data.session;lockedMission=!!data.locked;
  document.body.classList.toggle('locked-mission',lockedMission);
  for(const id of ['chooseTask','previousBtn','nextBtn'])$(id).hidden=lockedMission;
  const requested=data.taskId || progress.state.active || 'q01';
  selectTask(byId.has(requested)||requested==='free'?requested:'q01',{push:false});
  setMobileView(active.id==='free'?'editor':'mission');editor.refresh();
  if(data.view==='missions'){renderMissionList();openDialog('missionDialog');}
  if(data.view==='progress'){renderProgress();openDialog('progressDialog');}
  warmPython();
});
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!document.querySelector('dialog[open]')&&!['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))tellGame({type:'bitbound:close-workspace'});
});
// Each page visit starts with a new in-memory workspace. Only Load file restores work.
selectTask(embedded?(progress.state.active||'free'):'free',{push:false});
setMobileView(active.id==='free'?'editor':'mission');
progress.markSaved();updateSessionStatus();sessionReady=true;
tellGame({type:'bitbound:workspace-ready',revision:progress.revision});
warmPython();
if(!embedded)startOfflineSession();
