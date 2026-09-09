"""All reference answers must pass. Blank and hardcoded answers must not."""
from pathlib import Path
import importlib.util
import json
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('grader',ROOT/'app/grader.py')
grader=importlib.util.module_from_spec(spec);spec.loader.exec_module(grader)
curriculum=json.loads((ROOT/'app/curriculum.json').read_text())
count=0
for item in curriculum['items']:
 for source,should_pass in [(item['solution'],True),(item['starter'],False),('print("fake")',False)]:
  result=grader.handle_request({'files':{'main.py':source},'mode':'check','task':item})
  if bool(result.get('passed'))!=should_pass:
   raise AssertionError((item['id'],should_pass,result))
 count+=len(item['tests'])
print(f'PASS: {len(curriculum["items"])} reference solutions / {count} cases; all starters and wrong answers rejected.')
# Exact output, genuine errors, input, tuple type and bounded trace.
r=grader.handle_request({'files':{'main.py':'name=input()\nprint("Hi",name)\n'},'mode':'run','stdin':'Ana\n'})
assert r['stdout']=='Hi Ana\n' and not r['error']
r=grader.handle_request({'files':{'main.py':'total=0\nfor n in [2,4]:\n    total+=n\nprint(total)'},'mode':'trace'})
assert r['stdout']=='6\n' and len(r['trace'])>=6
assert any(f['variables'].get('total')=='6' for f in r['trace'])
r=grader.handle_request({'files':{'main.py':'for i in range(3000):\n    print("x"*100)'},'mode':'run'})
assert 'OutputLimitError' in r['error'] and len(r['stdout'])<=24000
assert not grader.equal([1,2],[1,2],'tuple')
assert not grader.equal(1,True)
print('PASS: input, trace snapshots, tuple/boolean type checks, and output cap.')
