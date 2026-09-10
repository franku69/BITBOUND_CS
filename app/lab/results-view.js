import { escapeHtml as esc } from '../report.js?v=acd68343c2ee';
/** Output and trace presentation; no worker or grading state is owned here. */
export function createResultsView({ document, editor, getSelection }) {
  const $ = id => document.getElementById(id);
  let trace = [], traceIndex = 0;
  function clearResults() {
    const active = getSelection().active;
    $('output').textContent = 'Your output appears here.';
    $('testResults').replaceChildren();
    $('errorHelp').hidden = true;
    $('tracePanel').hidden = true;
    trace = [];
    editor.clearTrace();
    $('runSummary').textContent = active.id === 'free' ? 'Experiment, then Run. Free lab has no automatic score.': 'Run a sample, then Check challenge to test several inputs.';
  }
  function showErrorHelp(message) {
    const tips = [['IndentationError', 'Indent the lines inside a function, loop, or if block by four spaces. Avoid mixing tabs and spaces.'], ['SyntaxError', 'Look at the line number. Check colons, matching brackets, and quotation marks.'], ['NameError', 'Check spelling and capitalization. Define the variable before using it.'], ['TypeError', 'Check the types you are combining and the number of arguments passed to your function. input() gives text; int() converts a whole number.'], ['IndexError', 'That position is outside the list. Check len(items), and handle an empty list.'], ['EOFError', 'Your program asked for more input. Add one line per input() in Program input. Check challenge supplies its own test inputs.'], ['RecursionError', 'Your recursion may be missing a base case, or the input may be too deep.'], ['ModuleNotFoundError', 'Check the import name. Helper files must be in this workspace. Extra third-party packages are not bundled.'], ['ZeroDivisionError', 'Check for zero before dividing. An empty list has length zero.']];
    const tip = tips.find( ([name]) => message.includes(name));
    $('errorHelp').textContent = tip ? tip[1]: message;
    $('errorHelp').hidden = false;
  }
  function renderTrace() {
    const workspace = getSelection().workspace;
    if (!trace.length) return;
    const frame = trace[traceIndex];
    $('traceRange').value = traceIndex;
    $('traceLabel').textContent = `${traceIndex+1}/${trace.length} · ${frame.event==='return'?'Returning at':'Before'} line ${frame.line} · ${frame.function}`;
    $('traceVariables').textContent = Object.entries(frame.variables).map( ([name, value]) => `${name} = ${value}`).join('\n') || '(No local variables yet.)';
    if (workspace.current === 'main.py') editor.highlight(frame.line);
    $('traceBack').disabled = traceIndex === 0;
    $('traceForward').disabled = traceIndex === trace.length - 1;
  }
  function showTrace(frames) {
    trace = frames;
    traceIndex = 0;
    $('tracePanel').hidden = false;
    $('traceRange').max = trace.length - 1;
    renderTrace();
  }
  function selectTrace(index) {
    traceIndex = Math.max(0, Math.min(trace.length - 1, index));
    renderTrace();
  }
  $('traceRange').oninput = () => selectTrace(Number($('traceRange').value));
  $('traceBack').onclick = () => selectTrace(traceIndex - 1);
  $('traceForward').onclick = () => selectTrace(traceIndex + 1);
  function renderResult(result, mode, submittedTask) {
    $('output').textContent = result.error || [result.stdout, result.stderr].filter(Boolean).join('\n') || (mode === 'check' ? 'See the test cases below.': 'Program finished with no printed output. If your function returns a value, print a sample call to see it.');
    if (result.error) {
      showErrorHelp(result.error);
      $('runSummary').textContent = 'Python found an error. Read the line number below, fix it, and retry.';
    } else if (mode === 'check') {
      const cases = result.tests || [];
      const passed = cases.filter(test => test.passed).length;
      $('runSummary').textContent = result.passed ? `✓ All ${cases.length} cases passed. Mission complete!`: `${passed}/${cases.length} cases passed. Keep going—retries do not cost points.`;
      $('testResults').innerHTML = (result.guidance || []).map(message => `<div class="error-help">${esc(message)}</div>`).join('') + cases.map( (test, i) => {
        const spec = submittedTask.tests[i];
        const details = test.error || `${spec.setup?spec.setup+'\n':''}${spec.expression || 'Input: '+JSON.stringify(spec.stdin||'')}\nExpected: ${'stdout' in spec?spec.stdout:JSON.stringify(spec.expected)}\nYour result: ${test.actual}`;
        return `<details class="test-result ${test.passed?'pass':''}" ${test.passed?'':'open'}><summary>${test.passed?'✓':'↻'} Case ${i+1} · ${test.passed?'Passed':'Try again'}</summary><pre>${esc(details)}</pre></details>`;
      }).join('');
    } else {
      $('runSummary').textContent = `Run finished · ${result.elapsedMs<1000?Math.max(1,Math.round(result.elapsedMs))+' ms':(result.elapsedMs/1000).toFixed(2)+' sec'}`;
    }
  }
  return {
    clearResults,
    showErrorHelp,
    showTrace,
    renderResult
  };
}
