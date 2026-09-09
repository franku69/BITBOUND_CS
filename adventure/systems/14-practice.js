/* Persistent in-game workspace. The iframe and idle Python engine survive closing. */
let practiceFrame=null,practiceReady=false,practiceTaskId=null,practiceOnPass=null;
let practiceSession=0,pendingPracticeMessage=null,pythonWarm=false,warmWaiters=[];
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function ensurePracticeFrame(){
  if(practiceFrame)return practiceFrame;
  practiceFrame=document.createElement('iframe');
  practiceFrame.title='In-game Python workspace';practiceFrame.className='practice-frame';
  practiceFrame.src='app/lab.html';
  UI.puzzleOptions.appendChild(practiceFrame);
  return practiceFrame;
}
function sendPractice(message){
  ensurePracticeFrame();
  if(practiceReady)practiceFrame.contentWindow.postMessage(message,location.origin);
  else pendingPracticeMessage=message;
}
function prewarmPython(){
  if(pythonWarm)return Promise.resolve(true);
  ensurePracticeFrame();
  return new Promise(resolve=>{
    const timer=setTimeout(()=>{warmWaiters=warmWaiters.filter(item=>item.resolve!==resolve);resolve(false);},240000);
    warmWaiters.push({resolve,timer});
  });
}
function closePractice(){
  practiceOnPass=null;practiceTaskId=null;pendingPracticeMessage=null;practiceSession++;
  if(practiceReady)practiceFrame.contentWindow.postMessage({type:'bitbound:hide-workspace'},location.origin);
  UI.puzzle.classList.remove('practice-open');document.body.classList.remove('python-window-visible');
  $('practiceContinue').hidden=true;
  // Keep the existing iframe and its idle worker. Only active code is stopped by the child.
  canvas.focus?.();
}
function openPractice(id,onPass=null){
  practiceTaskId=id;practiceOnPass=onPass;practiceSession++;
  UI.puzzleFeedback.textContent='';
  $('pythonWindowTitle').textContent='Python Challenge';
  $('pythonWindowState').textContent='Write your solution, then Check challenge.';
  $('practiceContinue').hidden=true;
  sendPractice({type:'bitbound:open-workspace',taskId:id,view:'task',locked:true,session:practiceSession});
  UI.puzzle.classList.add('practice-open');document.body.classList.add('python-window-visible');
  show(UI.puzzle);
}
function returnToGameButton(label='Return to game'){
  const button=$('practiceContinue');button.textContent=label;button.hidden=false;button.onclick=()=>hide(UI.puzzle);
}
window.addEventListener('message',event=>{
  if(!practiceFrame||event.origin!==location.origin||event.source!==practiceFrame.contentWindow)return;
  const data=event.data||{};
  if(data.type==='bitbound:workspace-ready'){
    practiceReady=true;
    if(Number.isSafeInteger(data.revision)){pythonRevision=data.revision;savedPythonRevision=data.revision;}
    for(const request of fileRequests.values())practiceFrame.contentWindow.postMessage(request.message,location.origin);
    if(pendingPracticeMessage){practiceFrame.contentWindow.postMessage(pendingPracticeMessage,location.origin);pendingPracticeMessage=null;}
    return;
  }
  if(data.type==='bitbound:session-changed'){
    if(Number.isSafeInteger(data.revision)&&data.revision>=0)pythonRevision=data.revision;
    return;
  }
  if(data.type==='bitbound:session-reply'){
    const request=fileRequests.get(data.requestId);if(!request)return;
    fileRequests.delete(data.requestId);clearTimeout(request.timer);
    if(data.error){request.reject(new Error(String(data.error)));return;}
    if(!Number.isSafeInteger(data.revision)||data.revision<0){request.reject(new Error('Invalid editor snapshot.'));return;}
    if(request.message.type==='bitbound:session-snapshot'&&data.python?.version!==1){request.reject(new Error('Invalid Python save data.'));return;}
    pythonRevision=data.revision;request.resolve(data);return;
  }
  if(data.type==='bitbound:python-ready'||data.type==='bitbound:python-unavailable'){
    pythonWarm=data.type==='bitbound:python-ready';
    for(const waiter of warmWaiters){clearTimeout(waiter.timer);waiter.resolve(pythonWarm);}warmWaiters=[];return;
  }
  if(data.type==='bitbound:close-workspace'){hide(UI.puzzle);return;}
  if(data.type==='bitbound:challenge-passed'&&data.taskId===practiceTaskId&&data.session===practiceSession){
    const callback=practiceOnPass;practiceOnPass=null;if(callback){callback();playerAnimator.celebrate();}
  }
});
function openShrine(index){
  const level=state.level;
  withTutorial(worldData().questionIds[index],()=>{
    if(state.level===level)openShrineChallenge(index);
  });
}
function openShrineChallenge(index){
  state.currentShrine=index;
  const level=state.level,q=worldData().shrines[index];
  if(state.solved[level][index]){openPractice(q.id);return;}
  sfx.shrine();openPractice(q.id,()=>{
    if(state.level!==level||state.solved[level][index])return;
    state.solved[level][index]=true;state.score+=60;recordCorrectAnswers(1,q.topic+' complete');addPowerXp(1,'SHRINE');
    setCheckpoint(SHRINE_COLS[index]+2,'Coding Shrine '+(index+1));sfx.correct();sfx.checkpoint();markStoryChanged();
    $('pythonWindowState').textContent='Byte: '+byteSays(QUESTIONS.tutorials[q.id].payoff);returnToGameButton();
  });
}
function openGuide(tab=state.guideTab){
  state.guideTab=clamp(tab,0,3);const w=worldData();UI.guideWorld.textContent=w.name;UI.guideTabs.innerHTML='';sfx.uiOpen();
  w.guide.forEach((g,i)=>{const b=document.createElement('button');b.className='guide-tab'+(i===state.guideTab?' active':'');b.textContent=`${i+1}. ${g.title}`;b.onclick=()=>openGuide(i);UI.guideTabs.appendChild(b);});
  UI.guideContent.innerHTML=w.guide[state.guideTab].html;renderSkillPicker();show(UI.guide);
}
function openTerminalTask(level,index){
  if(state.level!==level||!plotTerminalAllowed(level,index))return;
  hide(UI.assess);if(!requireWorldLessons(4))return;
  withTutorial(worldData().questionIds[index+4],()=>{
    if(state.level===level)openTerminalChallenge(level,index);
  });
}
function openTerminalChallenge(level,index){
  if(state.level!==level||!plotTerminalAllowed(level,index))return;
  const ids=worldData().questionIds.slice(4);hide(UI.assess);
  openPractice(ids[index],()=>{
    if(state.terminalSolved[level][index])return;
    state.terminalSolved[level][index]=true;sfx.correct();updateCampaignHud();
    if(level===7&&index===0&&!plotState().paladinDefeated){markStoryChanged();showPlotScene('rivals');return;}
    if(state.terminalSolved[level].every(Boolean)){
      state.assessmentPassed[level]=true;state.score+=180;
      setCheckpoint(TERMINAL_COL+2,'Python Terminal');recordCorrectAnswers(2,'Terminal complete');markStoryChanged();
      if(level===7){showPlotScene('barrier');return;}spawnBoss();
      $('pythonWindowState').textContent='Byte: '+byteSays(QUESTIONS.tutorials[ids[index]].payoff)+' Meet me by the portal after the guardian.';returnToGameButton();
    }else{
      markStoryChanged();$('pythonWindowState').textContent='Byte: '+byteSays(QUESTIONS.tutorials[ids[index]].payoff)+' One challenge remains.';
      const button=$('practiceContinue');button.hidden=false;button.textContent='Next challenge →';button.onclick=()=>openTerminalTask(level,1-index);
    }
  });
}
function openAssessment(){
  if(state.level===0&&!plotState().prisonersMet){showPlotScene('prisoners');return;}
  if(!requireWorldLessons(4))return;
  const ids=worldData().questionIds.slice(4),level=state.level;
  UI.assessTitle.textContent=`WORLD ${level+1} — PYTHON TERMINAL`;UI.assessFeedback.textContent='';UI.assessBody.innerHTML='';
  if(state.assessmentPassed[level]){UI.assessBody.textContent=state.bossDefeated[level]?'Terminal cleared. Enter the portal.':'Terminal cleared. Defeat the guardian to open the portal.';show(UI.assess);return;}
  const instructions=document.createElement('p');instructions.textContent=level===7?(plotState().paladinDefeated?'The paladin is defeated. Implement breadth-first search to shatter the shortest-route barrier.':'Explore one path deeply to open the throne passage. The shortest-route seal is locked until you defeat the paladin.'):'Complete both Python challenges. Use hints and retry freely.';UI.assessBody.appendChild(instructions);
  ids.forEach((id,index)=>{
    const button=document.createElement('button');button.className='big-btn terminal-task';const passed=state.terminalSolved[level][index];
    button.textContent=(passed?'✓ ':'▶ ')+QUESTIONS.get(id).topic;button.disabled=passed||(level===7&&index===1&&!plotState().paladinDefeated);button.onclick=()=>openTerminalTask(level,index);UI.assessBody.appendChild(button);
  });show(UI.assess);
}
window.BitboundChallenges=Object.freeze({prewarm:prewarmPython});

/* Manual file exchange with the one existing iframe. Only tiny revision notices
   are sent during editing; full Python work crosses the boundary on Save/Load. */
let fileRequestId=0;
const fileRequests=new Map();
function requestPythonFile(type,python){
  if(fileRequests.size) return Promise.reject(new Error('Another save/load is still running. Please wait.'));
  ensurePracticeFrame();
  return new Promise((resolve,reject)=>{
    const requestId=++fileRequestId;
    const message={type,requestId};if(python!==undefined)message.python=python;
    const timer=setTimeout(()=>{fileRequests.delete(requestId);reject(new Error('The Python editor is still opening. Try Save or Load again in a moment.'));},8000);
    fileRequests.set(requestId,{resolve,reject,timer,message});
    if(practiceReady)practiceFrame.contentWindow.postMessage(message,location.origin);
  });
}
function requestPythonSnapshot(){
  if(!practiceFrame)return Promise.resolve({python:null,revision:pythonRevision});
  return requestPythonFile('bitbound:session-snapshot');
}
async function restorePythonSnapshot(python){
  closePractice();
  const reply=await requestPythonFile('bitbound:load-session',python);
  pythonRevision=reply.revision;savedPythonRevision=reply.revision;
}
function markPythonSaved(revision){
  if(practiceReady)practiceFrame.contentWindow.postMessage({type:'bitbound:session-saved',revision},location.origin);
}
