import {Worker} from 'node:worker_threads';
import assert from 'node:assert/strict';
const worker=new Worker(new URL('./worker-node-adapter.mjs',import.meta.url));
try{
 await new Promise((resolve,reject)=>{worker.once('message',data=>data.type==='ready'?resolve():reject(new Error(JSON.stringify(data))));worker.postMessage({id:1,payload:{mode:'init'}});});
 const sequence=[];
 const result=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Streaming test timeout')),10000);
  const listener=data=>{if(data.id!==2)return;sequence.push(data);if(data.type==='result'){clearTimeout(timer);worker.off('message',listener);resolve(data.result);}else if(data.type==='error'){clearTimeout(timer);reject(new Error(data.message));}};
  worker.on('message',listener);
  worker.postMessage({id:2,payload:{mode:'run',files:{'main.py':'import time\nprint("Starting")\ntime.sleep(0.15)\nprint("Finished")'},stdin:''}});
 });
 assert.equal(result.stdout,'Starting\nFinished\n');assert.equal(sequence[0].type,'stdout');assert.match(sequence[0].text,/Starting/);assert.equal(sequence.at(-1).type,'result');
 assert.equal(sequence.filter(item=>item.type==='stdout').map(item=>item.text).join(''),result.stdout);
 console.log('PASS: output streams before a program finishes; final output remains exact.');
}finally{await worker.terminate();}
