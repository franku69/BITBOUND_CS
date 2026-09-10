/** Python workspace file commands. All changes remain in the current session. */
import { download, validName, MAX_FILE_BYTES, MAX_FILES } from '../storage.js?v=36b40012af2b';
export function createWorkspaceFiles({
  document,
  editor,
  getWorkspace,
  setChanging,
  markChanged,
  notice
}) {
  const $ = id => document.getElementById(id);
  function selectFile(name) {
    const workspace = getWorkspace();
    setChanging(true);
    workspace.current = name;
    editor.setValue(workspace.files[name]);
    $('fileSelect').value = name;
    $('deleteFile').disabled = name === 'main.py';
    setChanging(false);
    markChanged();
  }
  function renderFiles() {
    const workspace = getWorkspace();
    $('fileSelect').replaceChildren(... Object.keys(workspace.files).map(name => {
      const o = document.createElement('option');
      o.value = o.textContent = name;
      return o;
    }));
    selectFile(Object.hasOwn(workspace.files, workspace.current) ? workspace.current: 'main.py');
  }
  $('fileSelect').onchange = event => selectFile(event.target.value);
  $('newFile').onclick = () => {
    const workspace = getWorkspace();
    if (Object.keys(workspace.files).length >= MAX_FILES) {
      notice('Use up to eight Python files per workspace.');
      return;
    }
    const raw = prompt('Python filename, for example helpers.py');
    if (raw === null) return;
    const name = raw.trim();
    if (!validName(name)) {
      notice('Use letters, numbers and underscores, ending in .py. Avoid standard-library module names such as collections.py.');
      return;
    }
    if (Object.hasOwn(workspace.files, name)) {
      selectFile(name);
      return;
    }
    workspace.files[name] = '# ' + name + '\n';
    workspace.current = name;
    renderFiles();
  };
  $('deleteFile').onclick = () => {
    const workspace = getWorkspace();
    const name = workspace.current;
    if (name !== 'main.py' && confirm(`Delete ${name} from this workspace?`)) {
      delete workspace.files[name];
      workspace.current = 'main.py';
      renderFiles();
    }
  };
  $('downloadCode').onclick = () => download(getWorkspace().current, editor.getValue(), 'text/x-python;charset=utf-8');
  $('importCode').onclick = () => $('codeUpload').click();
  $('codeUpload').onchange = async event => {
    const workspace = getWorkspace();
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES || !validName(file.name)) {
      notice('Choose a .py file under 60 KB with a simple, non-reserved filename.');
      return;
    }
    if (!Object.hasOwn(workspace.files, file.name) && Object.keys(workspace.files).length >= MAX_FILES) {
      notice('Use at most eight files per workspace.');
      return;
    }
    if (Object.hasOwn(workspace.files, file.name) && !confirm(`Replace ${file.name} with the imported file?`)) return;
    try {
      const text = await file.text();
      if (workspace !== getWorkspace()) {
        notice('The workspace changed while the file was opening. Import it again in the intended workspace.');
        return;
      }
      if (new TextEncoder().encode(text).length > MAX_FILE_BYTES) {
        notice('Choose a Python file under 60 KB.');
        return;
      }
      if (!Object.hasOwn(workspace.files, file.name) && Object.keys(workspace.files).length >= MAX_FILES) {
        notice('Use at most eight files per workspace.');
        return;
      }
      workspace.files[file.name] = text;
      workspace.current = file.name;
      renderFiles();
      notice(`Imported ${file.name}. Run starts main.py.`);
    } catch (error) {
      notice('The Python file could not be read. Please try importing it again.');
    }
  };
  return { renderFiles };
}
