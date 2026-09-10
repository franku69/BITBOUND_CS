"""Static entrypoint, dependency, offline hash and JavaScript syntax checks."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
errors=[]
class References(HTMLParser):
    def __init__(self,path):super().__init__();self.path=path;self.ids=set()
    def handle_starttag(self,tag,attrs):
        values=dict(attrs)
        if 'id' in values:
            if values['id'] in self.ids:errors.append('Duplicate ID '+values['id'])
            self.ids.add(values['id'])
        for key in ('src','href'):
            value=values.get(key,'')
            if not value or value.startswith(('#','data:','http:','https:','mailto:')):continue
            file=(self.path.parent/unquote(urlsplit(value).path)).resolve()
            if not file.exists():errors.append(f'{self.path.relative_to(ROOT)}: missing {value}')
for path in [ROOT/'index.html',ROOT/'story.html',ROOT/'adventure/index.html',ROOT/'app/lab.html',ROOT/'app/workspace.html']:
    References(path).feed(path.read_text(encoding='utf-8'))
for path in ROOT.rglob('*.js'):
    if path.name=='sw-template.js' or any(part in path.parts for part in ('vendor','runtime','node_modules','.git')):continue
    result=subprocess.run(['node','--check',str(path)],capture_output=True,text=True)
    if result.returncode:errors.append(result.stderr)
manifest=json.loads((ROOT/'offline-manifest.json').read_text(encoding='utf-8'))
for path in manifest['files']:
    file=ROOT/path
    if not file.exists():errors.append('Offline asset missing '+path)
    elif hashlib.sha256(file.read_bytes()).hexdigest()!=manifest['hashes'][path]:errors.append('Stale offline hash '+path)
assert len(set(manifest['files']))==len(manifest['files'])
assert manifest['version'] in (ROOT/'sw.js').read_text(encoding='utf-8')
assert 'team-grid' not in (ROOT/'index.html').read_text(encoding='utf-8')
assert 'DSA MASTERY' not in (ROOT/'index.html').read_text(encoding='utf-8')
assert 'location.replace' not in (ROOT/'app/lab.html').read_text(encoding='utf-8')
assert 'pythonLabBtn' not in (ROOT/'story.html').read_text(encoding='utf-8')
assert 'id="game"' not in (ROOT/'index.html').read_text(encoding='utf-8')
assert 'adventure/game.js' not in (ROOT/'app/lab.html').read_text(encoding='utf-8')
assert not re.search('runMiniPython|evalMiniPythonExpr|numericOutput', (ROOT/'adventure/game.js').read_text(encoding='utf-8'))
# Every hardcoded DOM reference in the main controller must exist in the page.
ids=set(re.findall(r'id="([^"]+)"',(ROOT/'app/lab.html').read_text(encoding='utf-8')))
for module in [ROOT/'app/main.js',*(ROOT/'app/lab').glob('*.js')]:
    for name in re.findall(r"\$\(\s*'([^']+)'\s*\)",module.read_text(encoding='utf-8')):
        if name not in ids:errors.append(str(module.relative_to(ROOT))+': missing UI element '+name)
# Story controls must exist too; a permissive test DOM cannot hide missing IDs.
ids=set(re.findall(r'id="([^"]+)"',(ROOT/'story.html').read_text(encoding='utf-8')))
for name in re.findall(r"\$\('([^']+)'\)",(ROOT/'adventure/game.js').read_text(encoding='utf-8')):
    if name not in ids:errors.append('Missing Story UI element '+name)
if errors:raise SystemExit('\n'.join(errors))
print('PASS: HTML entrypoints, asset references, unique IDs, JavaScript syntax, UI references, offline hashes and removal of mini interpreter.')
