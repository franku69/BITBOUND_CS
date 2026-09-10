"""Revision the complete static module graph and HTML entry assets together."""
import re
from .files import digest, read, source_path, write

# Match normal static imports, re-exports and side-effect imports across lines.
# Runtime dynamic imports are not used by BITBOUND's authored code.
IMPORT = re.compile(
    r'''(?m)(\b(?:import|export)\s+(?:[^;"']*?\bfrom\s*)?["'])(\.[^"'?]+\.js)(?:\?v=[0-9a-f]+)?(["'])''')
HTML_ASSET = re.compile(r'((?:src|href)=")([^"?#]+)(?:\?v=[0-9a-f]+)?"')


def version_assets(root, config):
    # Canonicalize the root too: Windows TEMP may use an 8.3 directory alias.
    # Resolved children must never be compared with an unresolved root.
    root = root.resolve()
    revisions, visiting = {}, set()

    def version_module(path):
        key = path.relative_to(root).as_posix()
        if key in revisions:
            return revisions[key]
        if key in visiting:
            raise ValueError(f"Circular module dependency: {key}")
        visiting.add(key)

        def replace_import(match):
            target = source_path(root, (path.parent / match.group(2)).relative_to(root))
            return match.group(1) + match.group(2) + "?v=" + version_module(target) + match.group(3)

        write(path, IMPORT.sub(replace_import, read(path)))
        visiting.remove(key)
        revisions[key] = digest(path)[:12]
        return revisions[key]

    for folder in config["moduleRoots"]:
        for path in sorted((root / folder).rglob("*.js")):
            version_module(path.resolve())

    for name in config["entryPages"]:
        page = root / name

        def replace_asset(match):
            relative = match.group(2)
            if not relative.endswith((".css", ".js")):
                return match.group(0)
            path = source_path(root, (page.parent / relative).relative_to(root))
            revision = digest(path)[:12]
            revisions[path.relative_to(root).as_posix()] = revision
            return match.group(1) + relative + "?v=" + revision + '"'

        write(page, HTML_ASSET.sub(replace_asset, read(page)))
    return revisions
