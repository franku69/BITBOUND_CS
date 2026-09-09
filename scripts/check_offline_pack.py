"""Check exact deployment bytes locally or on the published HTTPS game URL.

  python scripts/check_offline_pack.py
  python scripts/check_offline_pack.py --url https://franku69.github.io/BITBOUND_CS/

No third-party dependencies; this check never changes the site or local files.
"""
from pathlib import Path
from urllib.parse import urljoin, urlsplit, quote
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
import argparse
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]


def check(base_url=None):
    def read(name):
        if base_url:
            request = Request(urljoin(base_url, quote(name, safe='/')),
                              headers={'Cache-Control': 'no-cache', 'User-Agent': 'BITBOUND-Release-Check/26'})
            with urlopen(request, timeout=60) as response:
                return response.read()
        return (ROOT / name).read_bytes()

    manifest = json.loads(read('offline-manifest.json'))
    files = manifest['files']
    if not files or len(files) != len(set(files)):
        raise ValueError('Empty or duplicate offline file list.')
    for name in files:
        if name.startswith(('/', '\\')) or '\\' in name or '..' in name.split('/') or urlsplit(name).scheme:
            raise ValueError('Invalid offline path: ' + name)
    def verify(name):
        try:
            data = read(name)
            if len(data) != manifest['sizes'][name] or hashlib.sha256(data).hexdigest() != manifest['hashes'][name]:
                return name + ': bytes differ from offline-manifest.json'
        except Exception as error:
            return name + ': ' + str(error)
        return None

    with ThreadPoolExecutor(max_workers=2) as pool:
        errors = [error for error in pool.map(verify, files) if error]
    if manifest['version'] not in read('sw.js').decode('utf-8'):
        errors.append('sw.js: worker and manifest belong to different releases')
    if errors:
        print('\n'.join(errors))
        print('FAIL: rebuild with python scripts/build.py, then upload ALL release files together.')
        return False
    print(f"PASS: all {len(files)} offline assets and the worker match {manifest['version']}.")
    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', help='Published game directory, including repository subpath.')
    args = parser.parse_args()
    if args.url:
        if urlsplit(args.url).scheme not in ('http', 'https'):
            parser.error('--url must be an HTTP(S) game directory')
        args.url = args.url.rstrip('/') + '/'
    raise SystemExit(0 if check(args.url) else 1)
