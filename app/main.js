/** Python Lab entrypoint. Feature implementation lives in app/lab/. */
import { mountLab } from './lab/controller.js?v=e97f2d2bef48';
try {
  const response = await fetch(new URL('./curriculum.json', import.meta.url));
  if (!response.ok) throw new Error('Curriculum unavailable');
  const curriculum = await response.json();
  mountLab(curriculum);
} catch (error) {
  const notice = document.getElementById('notice');
  notice.textContent = 'The Python Lab could not start. Reconnect and reload, or open the downloaded folder with START_WINDOWS.bat.';
  notice.hidden = false;
  console.error('Python Lab startup failed:', error);
  throw error;
}
