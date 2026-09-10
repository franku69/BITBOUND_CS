"""Protect the teacher-approved content during an architecture-only release.

For an intentional content release, update the changed fixture with a review of
the educational/visual change. CSS, logos, story and questions are not code style.
"""
from pathlib import Path
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
fixture = json.loads((ROOT / "tests/fixtures/accepted-content.json").read_text(encoding="utf-8"))
for name, expected in fixture["sha256"].items():
    data = (ROOT / name).read_bytes()
    if name.endswith(".html"):
        data = re.sub(rb"\?v=[a-f0-9]+", b"", data)
    if hashlib.sha256(data).hexdigest() != expected:
        raise AssertionError(f"Accepted {fixture['baseline']} content changed: {name}")
print(f"PASS: {len(fixture['sha256'])} accepted question, narrative, art, layout and mode assets preserved.")
