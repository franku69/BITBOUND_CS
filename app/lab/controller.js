import { Message, isPeerMessage } from '../../shared/protocol.js?v=df9ccbf32de4';
import { startPageMusic } from '../page-music.js?v=6a7687a0e20b';
import { startOfflineSession } from '../offline-session.js?v=34ba92aa5025';
import { installSessionControls } from '../session-controls.js?v=dbc525e82702';
import { PythonEditor } from '../editor.js?v=5ce3c7231c2c';
import { ProgressStore, MAX_FILE_BYTES } from '../storage.js?v=36b40012af2b';
import { escapeHtml as esc, exportTeacherReport } from '../report.js?v=acd68343c2ee';
import { createCatalog } from './catalog.js?v=f0f80a5ca921';
import { createMissionView } from './mission-view.js?v=a0228cfd5404';
import { createResultsView } from './results-view.js?v=66a83e304519';
import { createWorkspaceFiles } from './files.js?v=410dd122497f';
import { createExecutionController } from './execution.js?v=e4292ccfd403';
/** Composition root: coordinates selection, views, execution and manual saves. */
export function mountLab(curriculum) {
  const $ = id => document.getElementById(id);
  const embedded = window.parent !== window;
  const labMusic = startPageMusic('lab');
  if (embedded) {
    const musicButton = document.querySelector('[data-music-toggle]');
    if (musicButton) musicButton.hidden = true;
  }
  if (embedded) document.body.classList.add('embedded');
  const notice = message => {
    $('notice').textContent = message;
    $('notice').hidden = !message;
  };
  const catalog = createCatalog(curriculum);
  const {
    items,
    chapters,
    byId,
    freeTask
  } = catalog;
  const progress = new ProgressStore(new Set(byId.keys()));
  let active = freeTask, workspace, changing = false;
  let workspaceSession = 0, lockedMission = false;
  const tellGame = message => {
    if (embedded) window.parent.postMessage(message, location.origin);
  };
  const editor = new PythonEditor($('codeEditor'), value => {
    if (changing || !workspace) return;
    if (new TextEncoder().encode(value).length > MAX_FILE_BYTES) {
      notice('This file exceeds 60 KB. Shorten it before running or saving a backup.');
      return;
    }
    workspace.files[workspace.current] = value;
    editor.clearTrace();
    markChanged();
  }, notice);
  const getSelection = () => ({ active, workspace, workspaceSession });
  const missionView = createMissionView({
    document,
    catalog,
    progress,
    escapeHtml: esc
  });
  const renderHints = () => missionView.renderHints(active);
  const renderCompletion = () => missionView.renderCompletion(active);
  const renderMissionList = () => missionView.renderMissionList(active);
  const renderProgress = () => missionView.renderProgress();
  const results = createResultsView({ document, editor, getSelection });
  const { clearResults } = results;
  const { renderFiles } = createWorkspaceFiles({
    document,
    editor,
    getWorkspace: () => workspace,
    setChanging: value => {
      changing = value;
    },
    markChanged,
    notice
  });
  const execution = createExecutionController({
    document,
    window,
    location,
    progress,
    editor,
    getSelection,
    markChanged,
    notice,
    tellGame,
    results,
    renderCompletion,
    setMobileView
  });
  let carriedStory = null, sessionReady = false;
  function updateSessionStatus() {
    $('saveStatus').textContent = progress.dirty ? 'Unsaved session · choose Save file before leaving.': 'Manual saves only · new visits start fresh. Load your file to continue.';
  }
  function markChanged() {
    progress.changed();
    updateSessionStatus();
    if (sessionReady) tellGame({ type: Message.CHANGED, revision: progress.revision });
  }
  function snapshotPython() {
    if (workspace) workspace.files[workspace.current] = editor.getValue();
    return progress.state;
  }
  function getWorkspace(task) {
    return progress.state.workspaces[task.id] ||= { files: { 'main.py': task.starter }, current: 'main.py', stdin: task.stdin || '' };
  }
  function setMobileView(view) {
    document.querySelector('.workbench').dataset.mobileView = view;
    document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
    if (view === 'editor') editor.refresh();
  }
  function selectTask(id, { push = true } = {}) {
    if (execution.isBusy()) {
      notice('Stop the running program before switching missions.');
      return;
    }
    if (workspace) markChanged();
    active = byId.get(id) || freeTask;
    labMusic.select(active.id === 'free' ? 'lab': 'practice');
    progress.state.active = active.id;
    workspace = getWorkspace(active);
    missionView.renderTask(active, workspace);
    renderFiles();
    renderHints();
    renderCompletion();
    clearResults();
    if (push && !embedded) history.replaceState(null, '', `#${active.id}`);
    markChanged();
  }
  function openDialog(id) {
    $(id).showModal();
  }
  $('runBtn').onclick = () => execution.run('run');
  $('checkBtn').onclick = () => execution.run('check');
  $('traceBtn').onclick = () => execution.run('trace');
  $('stopBtn').onclick = () => execution.stop();
  $('clearOutput').onclick = clearResults;
  $('stdin').oninput = () => {
    workspace.stdin = $('stdin').value;
    markChanged();
  };
  $('indentBtn').onclick = () => editor.indent();
  $('outdentBtn').onclick = () => editor.outdent();
  $('undoBtn').onclick = () => editor.command('undo');
  $('redoBtn').onclick = () => editor.command('redo');
  $('searchBtn').onclick = () => editor.command('find');
  $('completeBtn').onclick = () => editor.complete();
  for (const button of document.querySelectorAll('[data-insert]')) button.onclick = () => editor.insert(button.dataset.insert);
  $('resetBtn').onclick = () => {
    if (execution.isBusy()) return;
    if (confirm('Restore this mission’s starter code? This replaces its files and input; your completion remains.')) {
      progress.state.workspaces[active.id] = { files: { 'main.py': active.starter }, current: 'main.py', stdin: active.stdin || '' };
      selectTask(active.id);
    }
  };
  $('hintBtn').onclick = () => {
    progress.state.hints[active.id] = (progress.state.hints[active.id] || 0) + 1;
    renderHints();
    markChanged();
  };
  $('solutionBtn').onclick = () => {
    $('solutionCode').textContent = active.solution;
    $('solutionCode').hidden = !$('solutionCode').hidden;
    if (!$('solutionCode').hidden) {
      progress.state.practiceSolution[active.id] = true;
      markChanged();
    }
  };
  $('previousBtn').onclick = () => {
    selectTask(items[active.number - 2]?.id);
    setMobileView('mission');
  };
  $('nextBtn').onclick = () => {
    selectTask(items[active.number]?.id);
    setMobileView('mission');
  };
  for (const id of ['missionsBtn', 'chooseTask']) $(id).onclick = () => {
    renderMissionList();
    openDialog('missionDialog');
  };
  $('chapterList').onclick = event => {
    const button = event.target.closest('[data-task]');
    if (button) {
      selectTask(button.dataset.task);
      $('missionDialog').close();
      setMobileView('mission');
    }
  };
  $('freeBtn').onclick = () => {
    selectTask('free');
    setMobileView('editor');
  };
  $('helpBtn').onclick = () => openDialog('helpDialog');
  $('progressBtn').onclick = () => {
    renderProgress();
    openDialog('progressDialog');
  };
  for (const button of document.querySelectorAll('[data-close]')) button.onclick = () => $(button.dataset.close).close();
  for (const button of document.querySelectorAll('[data-view]')) button.onclick = () => setMobileView(button.dataset.view);
  $('studentName').oninput = () => {
    progress.state.name = $('studentName').value;
    markChanged();
  };
  $('exportReport').onclick = () => exportTeacherReport(snapshotPython(), items);
  let sessionFiles = null;
  if (!embedded) {
    sessionFiles = installSessionControls({
      ids: new Set(byId.keys()),
      getSnapshot: () => ({ python: snapshotPython(), story: carriedStory, token: progress.revision }),
      onSaved: snapshot => {
        progress.markSaved(snapshot.token);
        updateSessionStatus();
      },
      hasUnsaved: () => progress.dirty,
      applySnapshot: async pack => {
        if (execution.isBusy()) {
          await execution.stopAndWait();
        }
        progress.import(pack.python);
        carriedStory = pack.story;
        workspace = null;
        selectTask(progress.state.active);
        renderProgress();
        progress.markSaved();
        updateSessionStatus();
      },
      report: notice
    });
  }
  window.addEventListener('pagehide', () => execution.stop());
  $('chooseModeLink').addEventListener('click', () => execution.stop());
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (!embedded && (byId.has(id) || id === 'free')) selectTask(id, { push: false });
  });
  window.addEventListener('resize', () => editor.refresh());
  // Parent commands retarget the same editor and worker; never navigate/recreate them.
  window.addEventListener('message', async event => {
    if (!embedded || !isPeerMessage(event, window.parent, location.origin)) return;
    const data = event.data || {};
    if (data.type === Message.HIDE) {
      for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
      if (execution.isBusy()) execution.stop('Stopped when the Python window closed. Your code remains in this session.');
      return;
    }
    if (data.type === Message.SNAPSHOT) {
      tellGame({
        type: Message.REPLY,
        requestId: data.requestId,
        python: snapshotPython(),
        revision: progress.revision
      });
      return;
    }
    if (data.type === Message.LOAD) {
      try {
        // Validate before cancelling the old workspace or changing its state.
        const next = new ProgressStore(new Set(byId.keys()));
        next.import(data.python);
        if (execution.isBusy()) {
          await execution.stopAndWait();
        }
        progress.import(next.state);
        workspace = null;
        selectTask('free', { push: false });
        progress.markSaved();
        updateSessionStatus();
        tellGame({ type: Message.REPLY, requestId: data.requestId, revision: progress.revision });
      } catch (error) {
        tellGame({ type: Message.REPLY, requestId: data.requestId, error: error.message });
      }
      return;
    }
    if (data.type === Message.SAVED) {
      if (Number.isSafeInteger(data.revision)) progress.markSaved(data.revision);
      updateSessionStatus();
      return;
    }
    if (data.type !== Message.OPEN) return;
    if (execution.isBusy()) {
      await execution.stopAndWait();
    }
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    workspaceSession = data.session;
    lockedMission = !!data.locked;
    document.body.classList.toggle('locked-mission', lockedMission);
    for (const id of ['chooseTask', 'previousBtn', 'nextBtn']) $(id).hidden = lockedMission;
    const requested = data.taskId || progress.state.active || 'q01';
    selectTask(byId.has(requested) || requested === 'free' ? requested: 'q01', { push: false });
    setMobileView(active.id === 'free' ? 'editor': 'mission');
    editor.refresh();
    if (data.view === 'missions') {
      renderMissionList();
      openDialog('missionDialog');
    }
    if (data.view === 'progress') {
      renderProgress();
      openDialog('progressDialog');
    }
    execution.warmPython();
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.querySelector('dialog[open]') && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) tellGame({ type: Message.CLOSE });
  });
  // Each page visit starts with a new in-memory workspace. Only Load file restores work.
  selectTask(embedded ? (progress.state.active || 'free'): 'free', { push: false });
  setMobileView(active.id === 'free' ? 'editor': 'mission');
  progress.markSaved();
  updateSessionStatus();
  sessionReady = true;
  tellGame({ type: Message.READY, revision: progress.revision });
  execution.warmPython();
  if (!embedded) startOfflineSession();
}
