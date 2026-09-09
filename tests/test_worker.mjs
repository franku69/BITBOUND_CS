import {Worker} from 'node:worker_threads';
import assert from 'node:assert/strict';
let id=0;
const create=()=>new Worker(new URL('./worker-node-adapter.mjs',import.meta.url));
function request(worker,payload){return new Promise((resolve,reject)=>{const requestId=++id;const timeout=setTimeout(()=>{worker.terminate();reject(new Error('Worker test timeout'));},30000);const receive=data=>{if(data.id!==requestId||data.type==='stdout')return;clearTimeout(timeout);worker.off('message',receive);data.type==='error'?reject(new Error(data.message)):resolve(data);};worker.on('message',receive);worker.postMessage({id:requestId,payload});});}
let worker=create();
await request(worker,{mode:'init'});
let response=await request(worker,{mode:'run',files:{'main.py':'from collections import deque\nq=deque([1,2])\nprint(q.popleft())'},stdin:''});
assert.equal(response.result.stdout,'1\n');
response=await request(worker,{mode:'run',files:{'main.py':'import helper\nprint(helper.answer)','helper.py':'answer=42'},stdin:''});
assert.equal(response.result.stdout,'42\n');
response=await request(worker,{mode:'run',files:{'main.py':'import helper\nprint(helper.answer)'},stdin:''});
assert.match(response.result.error,/ModuleNotFoundError/,'a removed helper must not leak between workspaces');
worker.postMessage({id:++id,payload:{mode:'run',files:{'main.py':'while True:\n    pass'}}});
await new Promise(resolve=>setTimeout(resolve,120));
const start=performance.now();await worker.terminate();assert.ok(performance.now()-start<5000,'Stop must terminate an endless Python loop');
worker=create();await request(worker,{mode:'init'});
response=await request(worker,{mode:'run',files:{'main.py':'print(6*7)'}});assert.equal(response.result.stdout,'42\n');await worker.terminate();
console.log('PASS: production worker protocol with shipped CPython, deque, helper import, endless-loop termination and fresh worker restart.');
