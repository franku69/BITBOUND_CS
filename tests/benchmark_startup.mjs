import {Worker} from 'node:worker_threads';
import {writeFile} from 'node:fs/promises';
const samples=4;let seq=0;
const make=()=>new Worker(new URL('./worker-node-adapter.mjs',import.meta.url));
function request(w,payload){return new Promise((resolve,reject)=>{const id=++seq;const fail=e=>reject(e);const listener=data=>{if(data.id!==id||data.type==='stdout')return;w.off('message',listener);w.off('error',fail);if(data.type==='error')reject(new Error(data.message));else resolve(data);};w.on('message',listener);w.once('error',fail);w.postMessage({id,payload});});}
const payload={mode:'run',files:{'main.py':'numbers = [3, 1, 4, 1, 5]\nprint(sum(numbers))'},stdin:''};
const cold=[];for(let n=0;n<samples;n++){const t=performance.now();const w=make();await request(w,{mode:'init'});await request(w,payload);cold.push(performance.now()-t);await w.terminate();}
const w=make();await request(w,{mode:'init'});const warm=[];for(let n=0;n<samples;n++){const t=performance.now();await request(w,payload);warm.push(performance.now()-t);}await w.terminate();
const result={environment:'Node worker adapter, local bundled CPython, not a phone/network benchmark',coldMs:cold,warmMs:warm,coldMeanMs:cold.reduce((a,b)=>a+b)/samples,warmMeanMs:warm.reduce((a,b)=>a+b)/samples};
await writeFile(new URL('../docs/startup-benchmark.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
