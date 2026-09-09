import {startOfflineSession} from './offline-session.js?v=775d9d567736';
import {blankProgress} from './storage.js?v=8749b2c7cc4b';
import {installSessionControls} from './session-controls.js?v=d5a34d7e028d';
const story=window.BitboundStory;
installSessionControls({
  ids:new Set(window.BitboundQuestions.bank.map(task=>task.id)),
  async getSnapshot(){
    const result=await story.pythonSnapshot();
    return {story:story.snapshot(),python:result.python||blankProgress(),token:{story:story.revision(),python:result.revision}};
  },
  validate(pack){
    if(!pack.story)throw new Error('This is a Python Lab file without a story checkpoint. Load it in Python Lab Mode.');
    return {...pack,story:story.validate(pack.story)};
  },
  async applySnapshot(pack){
    story.closeWorkspace();
    await story.restorePython(pack.python);
    story.restore(pack.story);story.markLoaded();
  },
  hasUnsaved:story.hasUnsaved,
  onSaved:snapshot=>story.markSaved(snapshot.token)
});
startOfflineSession({preparePython:()=>window.BitboundChallenges.prewarm()});
