/** Execute the shipped WASM/CPython runtime, not a substitute interpreter. */
import {loadPyodide} from '../runtime/pyodide.mjs';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {runtimePath} from './helpers/runtime-path.mjs';
const root=new URL('../',import.meta.url);
const py=await loadPyodide({indexURL:runtimePath(new URL('runtime/',root)),fullStdLib:false});
py.runPython(await readFile(new URL('app/grader.py',root),'utf8'));
const curriculum=JSON.parse(await readFile(new URL('app/curriculum.json',root),'utf8'));
let count=0;
for(const task of curriculum.items){
  py.globals.set('_request_json',JSON.stringify({mode:'check',files:{'main.py':task.solution},task}));
  const result=JSON.parse(py.runPython('json.dumps(handle_request(json.loads(_request_json)))'));
  assert.equal(result.passed,true,task.id+' '+JSON.stringify(result));
  count+=result.tests.length;
}
py.FS.mkdirTree('/home/pyodide/workspace');
py.runPython("os.chdir('/home/pyodide/workspace')\nsys.path.insert(0,os.getcwd())");
async function run(files,mode='run',stdin=''){
  for(const [name,content] of Object.entries(files))py.FS.writeFile('/home/pyodide/workspace/'+name,content);
  py.globals.set('_request_json',JSON.stringify({files,mode,stdin}));
  return JSON.parse(py.runPython('json.dumps(handle_request(json.loads(_request_json)))'));
}
let result=await run({'main.py':'import helpers\nprint(helpers.square(7))','helpers.py':'def square(n):\n    return n*n'});
assert.equal(result.stdout,'49\n');
result=await run({'main.py':'import helpers\nprint(helpers.square(7))','helpers.py':'def square(n):\n    return n+1'});
assert.equal(result.stdout,'8\n','edited helper imports must reload');
result=await run({'main.py':'name=input()\nprint("Hello",name)'},'run','Ana\n');assert.equal(result.stdout,'Hello Ana\n');
result=await run({'main.py':'x=0\nfor n in [2,4]:\n    x+=n\nprint(x)'},'trace');assert.equal(result.stdout,'6\n');assert.ok(result.trace.length>=6);
result=await run({'main.py':'print(missing_name)'});assert.match(result.error,/NameError/);
console.log(`PASS shipped Pyodide ${py.version}: ${curriculum.items.length} solutions, ${count} cases, imports/reimports, input, trace and Python errors.`);
console.log(py.runPython('sys.version'));
