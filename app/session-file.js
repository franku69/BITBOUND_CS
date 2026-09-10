/** Portable manual saves. No localStorage, cookies, IndexedDB or network writes. */
import { blankProgress, validateState } from './storage.js?v=36b40012af2b';
export const MAX_SAVE_BYTES = 32 * 1024 * 1024;
export const SAVE_FORMAT = 'bitbound-student-session';
export function parseSession(raw, ids) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Choose a BITBOUND save file.');
  // Earlier explicit Python progress exports remain importable by file choice only.
  if (raw.version === 1 && raw.workspaces && !raw.format) raw = {
    format: SAVE_FORMAT,
    version: 1,
    python: raw,
    story: null
  };
  if (raw.version === 1 && raw.solved && !raw.format) raw = {
    format: SAVE_FORMAT,
    version: 1,
    python: blankProgress(),
    story: raw
  };
  if (raw.format !== SAVE_FORMAT || raw.version !== 1) throw new Error('Unsupported save format or version.');
  const python = validateState(raw.python, ids);
  if (!python.name && raw.name) python.name = String(raw.name).slice(0, 60);
  if (raw.story != null && (typeof raw.story !== 'object' || Array.isArray(raw.story))) throw new Error('Invalid story data.');
  return {
    format: SAVE_FORMAT,
    version: 1,
    name: String(raw.name || python.name || raw.story?.team || 'Explorer').slice(0, 60),
    python,
    story: raw.story || null
  };
}
export function serializeSession(snapshot) {
  const data = {
    format: SAVE_FORMAT,
    version: 1,
    savedAt: new Date().toISOString(),
    name: snapshot.name || snapshot.python?.name || snapshot.story?.team || 'Explorer',
    python: snapshot.python || blankProgress(),
    story: snapshot.story || null
  };
  const text = JSON.stringify(data, null, 2);
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) throw new Error('Save exceeds 32 MB. Remove unused large Python files and try again.');
  const slug = String(data.name).replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 36) || 'Explorer';
  return { name: `BITBOUND_${slug}_${data.savedAt.replace(/[:.]/g,'-')}.json`, text };
}
