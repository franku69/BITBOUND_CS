/** Shared automatic offline setup for the chooser, standalone lab and story. */
import {registerOffline,prepareOffline} from './offline.js?v=2f4d68ee8d3b';
let started=false;
export function startOfflineSession({preparePython}={}) {
  if(started)return;
  started=true;
  const status=document.getElementById('offlineGameStatus');
  const banner=document.getElementById('offlineBanner');
  const retry=document.getElementById('retryOffline');
  let downloading=false,complete=false,registration;
  const report=message=>{status.textContent=message;};
  async function cacheModes(){
    if(downloading||complete||!registration)return;
    downloading=true;retry.hidden=true;
    try{
      await prepareOffline((done,total,bytes,totalBytes)=>report(`Downloading game files for offline use · ${Math.round(bytes/Math.max(1,totalBytes)*100)}%`));
      complete=true;report('Offline ready · app files cached · progress saves manually');banner.classList.add('ready');
    }catch(error){report(error.message);retry.hidden=false;}
    finally{downloading=false;}
  }
  async function initialize(){
    registration=await registerOffline(report);
    if(registration){
      let readyTimer;
      await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{
        readyTimer=setTimeout(()=>reject(new Error('Offline installation is waiting. Reconnect and retry.')),30000);
      })]).finally(()=>clearTimeout(readyTimer));
      if(!navigator.serviceWorker.controller)await new Promise(resolve=>{
        const done=()=>{navigator.serviceWorker.removeEventListener('controllerchange',done);clearTimeout(timer);resolve();};
        const timer=setTimeout(done,1500);navigator.serviceWorker.addEventListener('controllerchange',done);
      });
    }
    if(preparePython){
      let warmTimer;
      await Promise.race([preparePython(),new Promise(resolve=>{warmTimer=setTimeout(resolve,12000);})]).finally(()=>clearTimeout(warmTimer));
    }
    if(registration)await cacheModes();
  }
  retry.onclick=()=>{complete=false;if(registration)cacheModes();else initialize().catch(failed);};
  window.addEventListener('online',()=>{if(!complete){if(registration)cacheModes();else initialize().catch(failed);}});
  function failed(){
    preparePython?.();report('Offline download was interrupted. Reconnect and retry.');retry.hidden=false;
  }
  initialize().catch(failed);
}
