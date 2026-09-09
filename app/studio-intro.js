/** Brief, skippable studio card. Never waits for Python or the offline download. */
export function startStudioIntro({document:doc=document,window:win=window,duration=1800,onFinish=()=>{}}={}){
  const card=doc.getElementById('studioIntro'),modes=doc.querySelector('.mode-picker');
  if(!card||!card.open||!modes)return ()=>{};
  let timer=null,finished=false;
  modes.inert=true;
  const skip=doc.getElementById('studioContinue');skip?.focus({preventScroll:true});
  function finish(focus=true){
    if(finished)return;finished=true;
    if(timer!==null)win.clearTimeout(timer);
    card.removeEventListener('close',onClose);doc.removeEventListener('keydown',onKey);
    win.removeEventListener('pagehide',onHide);
    if(card.open)card.close();modes.inert=false;onFinish();
    if(focus)doc.getElementById('labModeLink')?.focus({preventScroll:true});
  }
  const onClose=()=>finish(),onHide=()=>finish(false);
  const onKey=event=>{if(event.key==='Escape'){event.preventDefault();finish();}};
  card.addEventListener('close',onClose);doc.addEventListener('keydown',onKey);win.addEventListener('pagehide',onHide);
  const reduced=win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  timer=win.setTimeout(()=>finish(),reduced?250:duration);
  return finish;
}
