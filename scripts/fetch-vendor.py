"""Fetch pinned, locally served runtime/editor assets. Only needed to refresh vendor files."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
jobs=[]
for name in ['pyodide.js','pyodide.mjs','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json']:
 jobs.append((f'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/{name}',ROOT/'runtime'/name))
cm=['lib/codemirror.js','lib/codemirror.css','mode/python/python.js','addon/edit/matchbrackets.js','addon/edit/closebrackets.js','addon/comment/comment.js','addon/hint/show-hint.js','addon/hint/show-hint.css','addon/search/searchcursor.js','addon/search/search.js','addon/dialog/dialog.js','addon/dialog/dialog.css']
for name in cm: jobs.append((f'https://cdn.jsdelivr.net/npm/codemirror@5.65.20/{name}',ROOT/'vendor/codemirror'/name))
jobs += [('https://cdn.jsdelivr.net/npm/codemirror@5.65.20/LICENSE', ROOT/'vendor/codemirror/LICENSE'),('https://raw.githubusercontent.com/pyodide/pyodide/0.27.7/LICENSE',ROOT/'runtime/LICENSE')]
def fetch(job):
 url,path=job
 path.parent.mkdir(parents=True,exist_ok=True)
 if not path.exists():
  for attempt in range(3):
   try:
    with urlopen(url,timeout=60) as response: path.write_bytes(response.read())
    break
   except Exception:
    if attempt==2: raise
 data=path.read_bytes()
 print(path.relative_to(ROOT),len(data),flush=True)
 return {'path':str(path.relative_to(ROOT)),'url':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
with ThreadPoolExecutor(max_workers=6) as pool: result=list(pool.map(fetch,jobs))
(ROOT/'vendor/manifest.json').write_text(json.dumps(result,indent=2))
