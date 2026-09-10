"""Path containment and explicit UTF-8/LF output shared by build stages."""
from pathlib import Path
import hashlib
import json


def source_path(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()) or not path.is_file():
        raise ValueError(f"Missing or out-of-project source: {relative}")
    return path


def read(path):
    return path.read_text(encoding="utf-8")


def read_json(path):
    return json.loads(read(path))


def write(path, text):
    """Avoid Windows newline conversion and partial writes of individual assets."""
    data = text.encode("utf-8")
    if path.exists() and path.read_bytes() == data:
        return
    temporary = path.with_name(path.name + ".build-tmp")
    try:
        temporary.write_bytes(data)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
