/* One CPython instance, owned by the worker; never runs on the animation/UI thread. */
let ready;
let previousFiles = [];
async function initialize() {
  importScripts('../runtime/pyodide.js');
  const checker = fetch(new URL('./grader.py', self.location));
  const py = await loadPyodide({ indexURL: new URL('../runtime/', self.location).href, fullStdLib: false });
  const response = await checker;
  if (!response.ok) throw new Error('Could not load the Python checker. Reconnect and wait for Offline ready on the game screen.');
  py.runPython(await response.text());
  py.FS.mkdirTree('/home/pyodide/workspace');
  py.runPython("os.chdir('/home/pyodide/workspace')\nif os.getcwd() not in sys.path: sys.path.insert(0, os.getcwd())");
  return py;
}
self.onmessage = async({ data }) => {
  const { id, payload } = data;
  try {
    if (!ready) ready = initialize();
    const py = await ready;
    if (payload.mode === 'init') {
      self.postMessage({ id, type: 'ready' });
      return;
    }
    py.globals.set('_previous_files_json', JSON.stringify(previousFiles));
    py.runPython('reset_imports(json.loads(_previous_files_json))');
    py.globals.delete('_previous_files_json');
    for (const file of previousFiles) {
      try {
        py.FS.unlink('/home/pyodide/workspace/' + file);
      } catch { /* Already removed by code. */ }
    }
    for (const [name, contents] of Object.entries(payload.files)) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*\.py$/.test(name)) throw new Error('Use a simple Python filename, such as helpers.py.');
      py.FS.writeFile('/home/pyodide/workspace/' + name, contents);
    }
    previousFiles = Object.keys(payload.files);
    py.globals.set('_request_json', JSON.stringify(payload));
    const started = performance.now();
    py.globals.set('_emit_output', text => self.postMessage({ id, type: 'stdout', text: String(text) }));
    const result = JSON.parse(py.runPython('json.dumps(handle_request(json.loads(_request_json), _emit_output))'));
    result.elapsedMs = performance.now() - started;
    py.globals.delete('_emit_output');
    py.globals.delete('_request_json');
    self.postMessage({ id, type: 'result', result });
  } catch (error) {
    ready = undefined;
    self.postMessage({ id, type: 'error', message: String(error.message || error) });
  }
};
