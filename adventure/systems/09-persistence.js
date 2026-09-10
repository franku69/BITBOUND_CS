/* Manual session snapshots. No student data is read from or written to browser storage. */
const { SAVE_FIELDS } = StorySaveModel;
let storyRevision = 0, savedStoryRevision = 0, pythonRevision = 0, savedPythonRevision = 0;
function markStoryChanged() {
  storyRevision++;
}
function storySnapshot() {
  if (!state.started && !state.finished) return null;
  const data = {
    version: 1,
    encounterVersion: 4,
    elapsedBase: elapsedPrecise(),
    finished: !!state.finished
  };
  for (const field of SAVE_FIELDS) data[field] = state[field];
  return JSON.parse(JSON.stringify(data));
}
function validateStorySnapshot(raw) {
  return StorySaveModel.validateStorySnapshot(raw, {
    worlds,
    WEAPONS,
    QUESTIONS,
    ENCOUNTER_WORLDS,
    CONCEPT_POWERS,
    PETS,
    DEFAULT_PET_ID,
    MOBS,
    COLS,
    clamp,
    cloneAppearance,
    validatePlot
  });
}
function restoreStorySnapshot(saved) {
  stopStoryAnimation();
  closeMentor();
  for (const overlay of UI.overlays) if (overlay.classList.contains('show')) hide(overlay);
  ensureAudio();
  resetCampaignState(saved.team, saved.members);
  for (const field of SAVE_FIELDS) if (saved[field] !== undefined) state[field] = saved[field];
  state.elapsedBase = saved.elapsedBase;
  state.startPerf = performance.now();
  state.raceStarted = true;
  generateWorld(state.level);
  resetPlayer(true, 3);
  resetParty();
  for (const element of [UI.hud, UI.hotbar, UI.petHud, UI.missionCompass, UI.campaignHud]) element.classList.remove('hidden');
  updateCampaignHud();
  updateHotbar();
  if (saved.finished) {
    finishGame();
  } else {
    if (!resumePlot()) showWorldIntro();
    scheduleFrame();
  }
  if (saved.lessonUpgrade) toast('World 4 now has 32 applied lessons. Your shrines, equipment and story are kept.', '#a4e3df');
  savedStoryRevision = storyRevision;
}
window.BitboundStory = Object.freeze({
  snapshot: storySnapshot,
  validate(raw) {
    const saved = validateStorySnapshot(raw);
    if (!saved) throw new Error('Invalid story checkpoint. Choose a BITBOUND Story save file.');
    return saved;
  },
  restore: restoreStorySnapshot,
  pythonSnapshot: requestPythonSnapshot,
  restorePython: restorePythonSnapshot,
  revision: () => storyRevision,
  hasUnsaved: () => storyRevision !== savedStoryRevision || pythonRevision !== savedPythonRevision,
  markSaved(token) {
    savedStoryRevision = token.story;
    savedPythonRevision = token.python;
    markPythonSaved(token.python);
  },
  markLoaded() {
    savedStoryRevision = storyRevision;
    savedPythonRevision = pythonRevision;
  },
  closeWorkspace() {
    if (UI.puzzle.classList.contains('show')) hide(UI.puzzle);
  }
});
