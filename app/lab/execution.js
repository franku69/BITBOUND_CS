/** One worker lifecycle per mounted Lab. Run, Check and Trace share cancellation. */
import { PythonRunner } from '../runner.js?v=691cc513495f';
import { MAX_FILE_BYTES } from '../storage.js?v=36b40012af2b';
import { Message } from '../../shared/protocol.js?v=df9ccbf32de4';
export function createExecutionController({
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
}) {
  const $ = id => document.getElementById(id);
  const embedded = window.parent !== window;
  const { clearResults, showErrorHelp } = results;
  let activeRun = null;
  let busy = false, streamedOutput = '', streamTimer = 0;
  const runner = new PythonRunner(message => {
    $('runtimeStatus').textContent = message;
  }, text => {
    streamedOutput = (streamedOutput + text).slice(0, 24000);
    if (!streamTimer) streamTimer = setTimeout( () => {
      $('output').textContent = streamedOutput;
      streamTimer = 0;
    }, 40);
  });
  function warmPython() {
    return runner.prepare().then( () => tellGame({ type: Message.PYTHON_READY })).catch( () => tellGame({ type: Message.PYTHON_UNAVAILABLE }));
  }
  async function execute(mode) {
    if (busy) return;
    const { active, workspace, workspaceSession } = getSelection();
    if (mode === 'check' && active.id === 'free') return;
    if (new TextEncoder().encode(editor.getValue()).length > MAX_FILE_BYTES) {
      notice('Shorten the current file to under 60 KB before running.');
      return;
    }
    workspace.files[workspace.current] = editor.getValue();
    markChanged();
    notice('');
    busy = true;
    streamedOutput = '';
    clearTimeout(streamTimer);
    streamTimer = 0;
    for (const id of ['runBtn', 'checkBtn', 'traceBtn']) $(id).disabled = true;
    $('stopBtn').disabled = false;
    clearResults();
    $('output').textContent = 'Loading / running Python…';
    const submittedTask = active;
    const submittedFiles = structuredClone(workspace.files);
    const submittedSession = workspaceSession;
    const solutionViewed = !!progress.state.practiceSolution[active.id];
    if (mode === 'check') {
      progress.state.attempts[active.id] = (progress.state.attempts[active.id] || 0) + 1;
      markChanged();
    }
    try {
      const result = await runner.run({
        mode,
        files: submittedFiles,
        stdin: workspace.stdin,
        task: mode === 'check' ? submittedTask: undefined
      }, Number($('timeLimit').value));
      clearTimeout(streamTimer);
      streamTimer = 0;
      results.renderResult(result, mode, submittedTask);
      if (!result.error && mode === 'check' && result.passed) {
        progress.state.completed[submittedTask.id] = { at: new Date().toISOString(), solutionViewed, code: submittedFiles['main.py'] };
        markChanged();
        renderCompletion();
        tellGame({ type: Message.PASSED, taskId: submittedTask.id, session: submittedSession });
      }
      if (mode === 'trace' && result.trace?.length) results.showTrace(result.trace);
      $('runtimeStatus').textContent = 'Python ready · no program running';
    } catch (error) {
      clearTimeout(streamTimer);
      streamTimer = 0;
      $('output').textContent = (streamedOutput ? streamedOutput + '\n\n': '') + error.message;
      $('runSummary').textContent = 'Run stopped. Your code is still in the editor.';
      showErrorHelp(error.message);
      $('runtimeStatus').textContent = 'Run again when ready';
    } finally {
      busy = false;
      clearTimeout(streamTimer);
      streamTimer = 0;
      for (const id of ['runBtn', 'traceBtn']) $(id).disabled = false;
      $('checkBtn').disabled = getSelection().active.id === 'free';
      $('stopBtn').disabled = true;
      setMobileView('results');
      if (window.innerWidth > 760) $('resultsPanel').scrollIntoView({ block: 'nearest' });
    }
  }
  function run(mode) {
    if (busy) return Promise.resolve();
    const pending = execute(mode);
    activeRun = pending;
    return pending.finally( () => {
      if (activeRun === pending) activeRun = null;
    });
  }
  // Await the real run's finally block before replacing a student's workspace.
  // A timer or an arbitrary microtask delay cannot guarantee that ordering.
  async function stopAndWait(message) {
    runner.stop(message);
    await activeRun;
  }
  return {
    run,
    warmPython,
    stopAndWait,
    isBusy: () => busy,
    stop: message => runner.stop(message)
  };
}
