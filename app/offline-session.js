/** One resumable offline job per page. Python starts only when its IDE needs it. */
import { registerOffline, prepareOffline } from './offline.js?v=20172dc4b8c7';
let started = false;
export function startOfflineSession() {
  if (started) return;
  started = true;
  const status = document.getElementById('offlineGameStatus');
  const banner = document.getElementById('offlineBanner');
  const retry = document.getElementById('retryOffline');
  const dismiss = document.getElementById('dismissOffline');
  const reopen = document.getElementById('showOffline');
  if (!status || !banner || !retry) return;
  let running = false, complete = false, autoHide;
  const report = message => {
    if (status.textContent !== message) status.textContent = message;
  };
  function showDetails(show) {
    banner.hidden = !show;
    if (reopen) {
      reopen.hidden = show;
      reopen.setAttribute('aria-expanded', String(show));
    }
  }
  if (dismiss) dismiss.onclick = () => {
    clearTimeout(autoHide);
    showDetails(false);
    reopen?.focus({ preventScroll: true });
  };
  if (reopen) reopen.onclick = () => {
    clearTimeout(autoHide);
    showDetails(true);
    dismiss?.focus({ preventScroll: true });
  };
  function compact(label) {
    if (reopen) {
      reopen.textContent = label;
      reopen.setAttribute('aria-label', label + '. Show offline details');
    }
  }
  async function initialize() {
    if (running || complete) return;
    running = true;
    clearTimeout(autoHide);
    retry.hidden = true;
    banner.classList.remove('ready', 'offline-error');
    report('Preparing offline access · you can keep playing.');
    compact('Offline setup…');
    try {
      const registration = await registerOffline();
      if (!registration) {
        report('Play online in this browser. Offline access needs a supported browser and the HTTPS game link.');
        compact('Online play');
        return;
      }
      await prepareOffline( (done, total, bytes, totalBytes) => {
        if (!totalBytes) {
          report('Checking saved offline files…');
          return;
        }
        const percent = Math.min(100, Math.floor(bytes / totalBytes * 100));
        report(`Saving offline files · ${percent}% (${done}/${total}). Keep this tab open until ready.`);
        compact(`Offline ${percent}%`);
      }, registration);
      complete = true;
      report('Offline ready · progress still saves manually.');
      banner.classList.add('ready');
      compact('✓ Offline ready');
      // Story gets its play space back. Details remain available with one tap.
      if (reopen) autoHide = setTimeout( () => showDetails(false), 5000);
    } catch (error) {
      banner.classList.add('offline-error');
      if (error.name === 'QuotaExceededError' || error.code === 'storage') {
        report('Not enough browser storage for offline play. Free some space and retry; online play is still available.');
      } else if (error.code === 'deployment' || error.code === 'update') {
        report('The website update is incomplete. You can play online; retry offline setup after the site is updated.');
      } else {
        report(error.message || 'Offline access is unavailable. You can keep playing online and retry.');
      }
      console.warn('BITBOUND offline setup:', error.code || error.name, error.file || '', error.message);
      compact('Offline needs retry');
      retry.hidden = false;
    } finally {
      running = false;
    }
  }
  retry.onclick = () => {
    complete = false;
    initialize();
  };
  window.addEventListener('online', () => {
    if (!complete) initialize();
  });
  initialize();
}
