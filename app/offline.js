/** Offline installation is independent of the game and Python interpreter. */
export async function registerOffline() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return null;
  // Register on each explicit retry, including after an earlier install failed.
  return navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { updateViaCache: 'none' });
}
/** Observe this registration, not .ready (which can wait forever after failure). */
export function waitForOfflineWorker(registration, timeout = 30000) {
  return new Promise( (resolve, reject) => {
    let watched, finished = false;
    const timer = setTimeout( () => finish(new Error('Offline setup took too long. You can keep playing online and retry.')), timeout);
    function finish(error, worker) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      registration.removeEventListener('updatefound', check);
      watched?.removeEventListener('statechange', check);
      error ? reject(error): resolve(worker);
    }
    function check() {
      if (finished) return;
      const candidate = registration.installing || registration.waiting || registration.active;
      if (watched?.state === 'redundant' && !candidate) return finish(new Error('Offline setup did not finish installing. Retry to install it again.'));
      if (candidate !== watched) {
        watched?.removeEventListener('statechange', check);
        watched = candidate;
        watched?.addEventListener('statechange', check);
      }
      if (candidate?.state === 'activated') return finish(null, candidate);
      if (candidate?.state === 'redundant') return finish(new Error('Offline setup could not install this website update. Retry to check for a repaired update.'));
      if (!candidate) return finish(new Error('Offline setup did not finish installing. Retry to install it again.'));
    }
    registration.addEventListener('updatefound', check);
    check();
  });
}
export async function prepareOffline(onProgress = () => {}, registration) {
  registration ||= await registerOffline();
  if (!registration) throw new Error('Offline access is unavailable in this browser. Use the HTTPS game link.');
  const worker = await waitForOfflineWorker(registration);
  return new Promise( (resolve, reject) => {
    const channel = new MessageChannel();
    let timer, finished = false;
    function finish(error, result) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      channel.port1.onmessage = null;
      channel.port1.close();
      error ? reject(error): resolve(result);
    }
    function heartbeat() {
      clearTimeout(timer);
      timer = setTimeout( () => finish(new Error('Offline download stopped responding. Retry resumes the files already downloaded.')), 120000);
    }
    channel.port1.onmessage = ({ data }) => {
      if (!data || finished) return;
      heartbeat();
      if (data.type === 'progress') onProgress(data.done, data.total, data.bytes, data.totalBytes);
      if (data.type === 'complete') finish(null, data);
      if (data.type === 'error') finish(Object.assign(new Error(data.message), { code: data.code, file: data.file }));
    };
    heartbeat();
    try {
      worker.postMessage({ type: 'bitbound:cache-offline' }, [channel.port2]);
    } catch (error) {
      finish(error);
    }
  });
}
