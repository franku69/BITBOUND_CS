import {startPageMusic} from './page-music.js?v=a47c8ef5bc66';
import {startOfflineSession} from './offline-session.js?v=69f8d0e7c57b';
import {startStudioIntro} from './studio-intro.js?v=5ef84ef1fb5b';
// Mode links are native navigation: no game engine or Python startup blocks them.
const music=startPageMusic('studio');
startStudioIntro({onFinish:()=>music.select('choose')});
startOfflineSession();
