"""Check generated files without modifying the working tree.

Rebuild in a temporary copy twice: committed outputs must match the sources and
a second build must produce the same bytes. No npm packages or network needed.
"""
from pathlib import Path
import shutil
import tempfile
from build import ROOT, build
from buildlib.files import read_json


def generated_paths(root):
    config = read_json(root / "scripts/build-config.json")
    names = {
        "adventure/game.js", "adventure/engine.js", "adventure/questions.js",
        "vendor/codemirror/codemirror-python.bundle.js", "offline-manifest.json", "sw.js"
    }
    names.update(config["entryPages"])
    for folder in config["moduleRoots"]:
        names.update(path.relative_to(root).as_posix() for path in (root / folder).rglob("*.js"))
    return sorted(names)


def check(root=ROOT):
    names = generated_paths(root)
    with tempfile.TemporaryDirectory(prefix="bitbound-build-") as temporary:
        copy = Path(temporary) / "project"
        shutil.copytree(root, copy, ignore=shutil.ignore_patterns(
            ".git", "node_modules", "__pycache__", ".venv", "release", "*.build-tmp"))
        build(copy)
        first = {name: (copy / name).read_bytes() for name in names}
        stale = [name for name in names if not (root / name).is_file() or
                 (root / name).read_bytes() != first[name]]
        if stale:
            raise ValueError("Generated files are stale. Run python scripts/build.py:\n" + "\n".join(stale))
        build(copy)
        unstable = [name for name in names if (copy / name).read_bytes() != first[name]]
        if unstable:
            raise ValueError("Build is not deterministic:\n" + "\n".join(unstable))
    print(f"PASS: {len(names)} generated/versioned files match source; repeat build is byte-identical.")


if __name__ == "__main__":
    check()
