/** Manual file controls shared by the Lab and Story. Owns UI events, not game state. */
import { download } from './storage.js?v=36b40012af2b';
import { MAX_SAVE_BYTES, parseSession, serializeSession } from './session-file.js?v=6056f6bc5e88';
export function installSessionControls({
  ids,
  getSnapshot,
  validate = pack => pack,
  applySnapshot,
  onSaved = () => {},
  hasUnsaved = () => false,
  report = () => {}
}) {
  let busy = false, leaving = false;
  const input = document.getElementById('sessionFileUpload');
  const buttons = [... document.querySelectorAll('[data-save-session], [data-load-session], [data-new-session]')];
  const status = text => {
    for (const node of document.querySelectorAll('[data-session-status]')) node.textContent = text;
    report(text);
  };
  const lock = value => {
    busy = value;
    for (const button of buttons) button.disabled = value;
  };
  async function save() {
    if (busy) return;
    lock(true);
    try {
      const snapshot = await getSnapshot();
      const file = serializeSession(snapshot);
      download(file.name, file.text, 'application/json');
      onSaved(snapshot);
      status('Save file requested. Keep the JSON file in Downloads to continue later.');
    } catch (error) {
      status('Could not save: ' + error.message);
    } finally {
      lock(false);
    }
  }
  function load() {
    if (!busy) input.click();
  }
  input.onchange = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy) return;
    lock(true);
    try {
      if (file.size > MAX_SAVE_BYTES) throw new Error('Choose a save file under 32 MB.');
      const pack = validate(parseSession(JSON.parse(await file.text()), ids));
      if (hasUnsaved() && !confirm('Load this file and replace the current session? Save your current work first if you want to keep it.')) return;
      await applySnapshot(pack);
      status('Loaded your chosen save file. Further changes need a new Save file.');
    } catch (error) {
      status('Could not load: ' + error.message);
    } finally {
      lock(false);
    }
  };
  function newPlayer() {
    if (busy) return;
    if (!confirm('Start a fresh session for a new player? Unsaved work in this session will be cleared. Keep a Save file first if you need it.')) return;
    leaving = true;
    window.location.reload();
  }
  for (const button of document.querySelectorAll('[data-save-session]')) button.addEventListener('click', save);
  for (const button of document.querySelectorAll('[data-load-session]')) button.addEventListener('click', load);
  for (const button of document.querySelectorAll('[data-new-session]')) button.addEventListener('click', newPlayer);
  window.addEventListener('beforeunload', event => {
    if (!leaving && hasUnsaved()) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  // Back/forward cache must not silently restore the previous student's session.
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      leaving = true;
      window.location.reload();
    }
  });
  return {
    save,
    load,
    newPlayer,
    status
  };
}
