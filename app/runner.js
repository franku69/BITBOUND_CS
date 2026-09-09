/** Serial worker client. IDs reject stale replies; terminating is a portable Stop. */
export class PythonRunner {
  constructor(onStatus = () => {}, onStream = () => {}) {
    this.worker = null;
    this.sequence = 0;
    this.pending = null;
    this.loaded = false;
    this.onStatus = onStatus;
    this.onStream = onStream;
    this.warming = null;
  }
  createWorker() {
    if (!globalThis.Worker || !globalThis.WebAssembly) throw new Error('Python needs a browser with WebAssembly and Web Workers. Open this page in a current Chrome, Edge, Firefox, or Safari browser.');
    if (location.protocol === 'file:') throw new Error('Open through the class website or START_WINDOWS.bat. Double-clicking index.html cannot start Python.');
    const worker = this.worker = new Worker(new URL('./python-worker.js', import.meta.url));
    this.worker.onmessage = ({data}) => {
      if (this.worker !== worker || !this.pending || data.id !== this.pending.id) return;
      if(data.type==='stdout'){this.onStream(data.text);return;}
      const pending = this.pending;
      this.pending = null;
      clearTimeout(pending.timer);
      if (data.type === 'error') {this.dispose(); pending.reject(new Error(data.message));}
      else {if (data.type === 'ready') this.loaded = true; pending.resolve(data.result);}
    };
    this.worker.onerror = (event) => {if(this.worker!==worker)return;this.stop('Python could not start. Check your connection or download the offline pack, then try again. ' + (event.message || ''));};
  }
  request(payload, timeout) {
    if (this.pending) return Promise.reject(new Error('A program is already running. Stop it first.'));
    return new Promise((resolve, reject) => {
      try {
        if (!this.worker) this.createWorker();
        const id = ++this.sequence;
        const timer = setTimeout(() => this.stop(payload.mode === 'init' ? 'Python is taking too long to load. Retry when connected; your code is saved.' : 'Stopped at the time limit. Check for an infinite loop, or choose a longer run limit.'), timeout);
        this.pending = {id, timer, resolve, reject};
        this.worker.postMessage({id, payload});
      } catch (error) {this.dispose(); reject(error);}
    });
  }
  prepare() {
    if(this.loaded)return Promise.resolve();
    if(this.warming)return this.warming;
    this.onStatus('Preparing Python…');
    this.warming=this.request({mode:'init'},240000).then(()=>{this.onStatus('Python ready');}).finally(()=>{this.warming=null;});
    return this.warming;
  }
  async run(payload, seconds = 15) {
    await this.prepare();
    this.onStatus(payload.mode === 'check' ? 'Checking your code…' : 'Running…');
    return this.request(payload, seconds * 1000);
  }
  stop(message = 'Stopped. Your editor contents are safe. Run again when ready.') {
    const pending = this.pending;
    this.dispose();
    if (pending) pending.reject(new Error(message));
  }
  dispose() {
    if (this.pending) clearTimeout(this.pending.timer);
    this.pending = null;
    this.worker?.terminate();
    this.worker = null;
    this.loaded = false;
  }
}
