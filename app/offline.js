/** The game starts this automatically; one service-worker job owns all downloads. */
export async function registerOffline(onStatus=()=>{}) {
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol)){
    onStatus('Offline caching needs the HTTPS game link or localhost.');return null;
  }
  try{return await navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{updateViaCache:'none'});}
  catch{onStatus('Offline caching is unavailable here. Use the HTTPS game link.');return null;}
}
export async function prepareOffline(onProgress=()=>{}) {
  let readyTimer;
  const registration=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{readyTimer=setTimeout(()=>reject(new Error('Offline setup is still waiting. Reconnect, close old game tabs, and reopen the link.')),30000);})]).finally(()=>clearTimeout(readyTimer));
  if(!registration.active)throw new Error('Offline setup is not active yet. Try again in a moment.');
  return new Promise((resolve,reject)=>{
    const channel=new MessageChannel();
    let timer;
    const resetTimer=()=>{clearTimeout(timer);timer=setTimeout(()=>{channel.port1.close();reject(new Error('Download interrupted. Reconnect and retry; saved files are kept.'));},240000);};
    resetTimer();
    channel.port1.onmessage=({data})=>{
      resetTimer();
      if(data.type==='progress')onProgress(data.done,data.total,data.bytes,data.totalBytes);
      if(data.type==='complete'){clearTimeout(timer);channel.port1.close();resolve(data);}
      if(data.type==='error'){clearTimeout(timer);channel.port1.close();reject(new Error(data.message));}
    };
    registration.active.postMessage({type:'bitbound:cache-offline'},[channel.port2]);
  });
}
