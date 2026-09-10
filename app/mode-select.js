import { startPageMusic } from './page-music.js?v=6a7687a0e20b';
import { startOfflineSession } from './offline-session.js?v=34ba92aa5025';
import { startStudioIntro } from './studio-intro.js?v=f597bc298277';
// Mode links are native navigation: no game engine or Python startup blocks them.
const music = startPageMusic('studio');
startStudioIntro({ onFinish: () => music.select('choose') });
startOfflineSession();
