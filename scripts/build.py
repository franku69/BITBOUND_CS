"""Build the complete static release with Python's standard library only.

Stages have explicit inputs and no import-time writes. The integrity manifest is
written last, after both compiled bundles and transitive module URLs are final.
Run tests and check_offline_pack.py before publishing the resulting tree.
"""
from pathlib import Path
from buildlib.files import read_json
from buildlib.bundles import build_bundles
from buildlib.curriculum import build_curriculum
from buildlib.revisions import version_assets
from buildlib.offline import build_offline

ROOT = Path(__file__).resolve().parents[1]


def build(root=ROOT):
    root = root.resolve()
    config = read_json(root / "scripts/build-config.json")
    systems = build_bundles(root, config)
    build_curriculum(root)
    revisions = version_assets(root, config)
    manifest = build_offline(root, config, revisions)
    print(f"Built {systems} adventure systems; {len(config['domains'])} isolated domains; "
          f"{len(manifest['files'])} offline assets; {manifest['bytes'] / 1e6:.2f} MB")
    return manifest


if __name__ == "__main__":
    build()
