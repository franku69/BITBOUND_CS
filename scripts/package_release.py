"""Build and verify a reproducible release ZIP, including nested runtime ZIPs.

Run after scripts/build.py:
    python scripts/package_release.py /absolute/path/BITBOUND_Python_Practice_v24.zip
"""
from pathlib import Path
import hashlib
import json
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_DIRS = {'.git', 'node_modules', '__pycache__', '.pytest_cache'}


def package(destination):
    destination = Path(destination).resolve()
    if destination.is_relative_to(ROOT):
        raise ValueError('Write the release outside the source folder.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT / 'offline-manifest.json').read_text())
    prefix = ROOT.name + '/'
    files = [p for p in sorted(ROOT.rglob('*')) if p.is_file()
             and not any(part in EXCLUDED_DIRS for part in p.relative_to(ROOT).parts)
             and p.suffix != '.pyc']
    with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED,
                         compresslevel=6) as archive:
        for path in files:
            if path.is_symlink():
                raise ValueError(f'Release cannot contain a symlink: {path}')
            entry = zipfile.ZipInfo(prefix + path.relative_to(ROOT).as_posix(),
                                    date_time=(2026, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, path.read_bytes(), compresslevel=6)
    with zipfile.ZipFile(destination) as archive:
        if archive.testzip() is not None:
            raise ValueError('Corrupt ZIP entry.')
        for name in manifest['files']:
            data = archive.read(prefix + name)
            if len(data) != manifest['sizes'][name]:
                raise ValueError(f'Wrong packaged asset size: {name}')
            if hashlib.sha256(data).hexdigest() != manifest['hashes'][name]:
                raise ValueError(f'Wrong packaged asset hash: {name}')
        # Do not exclude *.zip: Pyodide needs its pinned standard library.
        data = archive.read(prefix + 'runtime/python_stdlib.zip')
        if not data.startswith(b'PK'):
            raise ValueError('Missing or invalid Python standard library.')
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    print(json.dumps({'file': str(destination), 'bytes': destination.stat().st_size,
                      'sha256': digest, 'files': len(files),
                      'verifiedOfflineAssets': len(manifest['files']),
                      'includesPythonStdlib': True}, indent=2))


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    package(sys.argv[1])
