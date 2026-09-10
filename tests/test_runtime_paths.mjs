import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtimePath} from './helpers/runtime-path.mjs';

assert.equal(runtimePath(new URL('file:///D:/a/BITBOUND_CS/BITBOUND_CS/runtime/'), {windows:true}),
  'D:\\a\\BITBOUND_CS\\BITBOUND_CS\\runtime\\');
assert.equal(runtimePath('file:///C:/Users/Student%20One/BITBOUND%20%23%20%C3%B1/runtime/', {windows:true}),
  'C:\\Users\\Student One\\BITBOUND # ñ\\runtime\\');
assert.equal(runtimePath('file://classroom/projects/BITBOUND/runtime/', {windows:true}),
  '\\\\classroom\\projects\\BITBOUND\\runtime\\');
assert.equal(runtimePath('file:///home/student/My%20Class/runtime/', {windows:false}),
  '/home/student/My Class/runtime/');
assert.throws(() => runtimePath('https://example.test/runtime/'), /file/i);
// Both callers must use the tested adapter, not convert back to URL.pathname.
for (const file of ['test_pyodide.mjs', 'worker-node-adapter.mjs']) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8');
  assert.match(source, /indexURL:runtimePath\(/);
  assert.doesNotMatch(source, /indexURL:[^;\n]*\.pathname/);
}
console.log('PASS runtime paths: actual Windows drive, escaped spaces/Unicode/#, UNC and POSIX conversion; direct runtime and worker share the adapter.');
