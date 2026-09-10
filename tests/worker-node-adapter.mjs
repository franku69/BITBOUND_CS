/* Test-only Node adapter for the production browser worker protocol. */
import {createRequire} from 'node:module';
globalThis.require=createRequire(import.meta.url);
import {parentPort} from 'node:worker_threads';
import {readFile} from 'node:fs/promises';
import {loadPyodide} from '../runtime/pyodide.mjs';
import {runtimePath} from './helpers/runtime-path.mjs';
globalThis.self=globalThis;
self.location=new URL('../app/python-worker.js',import.meta.url);
self.postMessage=data=>parentPort.postMessage(data);
globalThis.importScripts=()=>{}; // Load the same pinned engine with its native Node entrypoint.
globalThis.loadPyodide=options=>loadPyodide({...options,indexURL:runtimePath(new URL(options.indexURL))});
globalThis.fetch=async url=>new Response(await readFile(url));
await import('../app/python-worker.js');
parentPort.on('message',data=>self.onmessage({data}));
