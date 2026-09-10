"""Create one integrity manifest and worker from the same finished release bytes."""
import hashlib
import json
from .files import digest, read, source_path, write


def build_offline(root, config, revisions):
    files = set(config["offlineFiles"])
    for folder in config["offlineFolders"]:
        for path in (root / folder).rglob("*"):
            if path.is_file() and "__pycache__" not in path.parts and path.suffix != ".pyc":
                files.add(path.relative_to(root).as_posix())
    files = sorted(files)
    sizes, hashes = {}, {}
    for name in files:
        path = source_path(root, name)
        sizes[name], hashes[name] = path.stat().st_size, digest(path)
    # Include paths as well as bytes: a rename also creates a new release.
    fingerprint = "\n".join(name + ":" + hashes[name] for name in files)
    version = "bitbound-dsa-" + hashlib.sha256(fingerprint.encode()).hexdigest()[:12]
    manifest = {
        "version": version, "assetRevisions": revisions, "files": files,
        "bytes": sum(sizes.values()), "runtimeCache": "bitbound-python-0.27.7",
        "editorCache": "bitbound-editor-5.65.20", "sizes": sizes, "hashes": hashes
    }
    write(root / "offline-manifest.json", json.dumps(manifest, indent=2))
    worker = read(root / "scripts/sw-template.js")
    worker = worker.replace("__CACHE_VERSION__", version)
    worker = worker.replace("__ASSET_REVISIONS__", json.dumps(revisions))
    write(root / "sw.js", worker)
    return manifest
