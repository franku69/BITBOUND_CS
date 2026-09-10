/** Student work lives only in this page session. Persistence requires a downloaded file. */
export const MAX_FILE_BYTES = 60000;
export const MAX_FILES = 8;
export const validName = name => /^[A-Za-z_][A-Za-z0-9_]*\.py$/.test(name) && !['js.py', 'sys.py', 'ast.py', 'json.py', 'io.py', 'os.py', 'math.py', 'collections.py', 'contextlib.py', 'traceback.py', 'linecache.py', 'reprlib.py'].includes(name);
export const blankProgress = () => ({
  version: 1,
  name: '',
  active: 'q01',
  completed: {},
  workspaces: {},
  hints: {},
  attempts: {},
  practiceSolution: {}
});
export function validateState(raw, ids) {
  const next = blankProgress();
  if (!raw || raw.version !== 1) throw new Error('This is not a BITBOUND DSA progress backup.');
  next.name = String(raw.name || '').slice(0, 60);
  next.active = ids.has(raw.active) || raw.active === 'free' ? raw.active: 'q01';
  for (const id of [... ids, 'free']) {
    const workspace = raw.workspaces?.[id];
    if (workspace && typeof workspace === 'object') {
      const files = Object.entries(workspace.files || {});
      if (files.length > MAX_FILES) throw new Error('A workspace has too many files.');
      const safe = Object.create(null);
      for (const [name, text] of files) {
        if (!validName(name) || typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_FILE_BYTES) throw new Error('A backup contains an invalid or oversized Python file.');
        safe[name] = text;
      }
      if (Object.hasOwn(safe, 'main.py')) next.workspaces[id] = {
        files: safe,
        current: Object.hasOwn(safe, workspace.current) ? workspace.current: 'main.py',
        stdin: String(workspace.stdin || '').slice(0, 12000)
      };
    }
    if (ids.has(id)) {
      if (raw.completed?.[id]) next.completed[id] = {
        at: String(raw.completed[id].at || '').slice(0, 50),
        solutionViewed: !!raw.completed[id].solutionViewed,
        code: typeof raw.completed[id].code === 'string' ? raw.completed[id].code.slice(0, MAX_FILE_BYTES): ''
      };
      next.hints[id] = Math.min(3, Math.max(0, Number(raw.hints?.[id]) || 0));
      next.attempts[id] = Math.min(100000, Math.max(0, Number(raw.attempts?.[id]) || 0));
      next.practiceSolution[id] = !!raw.practiceSolution?.[id];
    }
  }
  return next;
}
export class ProgressStore { constructor(ids) {
    this.ids = ids;
    this.state = blankProgress();
    this.revision = 0;
    this.savedRevision = 0;
  } changed() {
    this.revision++;
  } get dirty() {
    return this.revision !== this.savedRevision;
  } markSaved(revision = this.revision) {
    this.savedRevision = revision;
  } import(raw) {
    const validated = validateState(raw, this.ids);
    this.state = validated;
    this.changed();
    this.markSaved();
  } reset() {
    this.state = blankProgress();
    this.changed();
    this.markSaved();
  } }
export function download(name, content, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout( () => URL.revokeObjectURL(url), 1500);
}
