"""Run named, isolated test processes with a finite timeout on every platform.

python scripts/test.py
python scripts/test.py --group animation
python scripts/test.py --list
"""
from pathlib import Path
import argparse
import json
import os
import shutil
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]


def run(group=None, list_only=False):
    suite = json.loads((ROOT / "tests/suite.json").read_text(encoding="utf-8"))
    known_groups = {test["group"] for test in suite}
    if group and group not in known_groups:
        raise ValueError("Choose a test group: " + ", ".join(sorted(known_groups)))
    registered = {argument for test in suite for argument in test["command"]
                  if argument.startswith("tests/test_")}
    present = {path.relative_to(ROOT).as_posix() for path in (ROOT / "tests").glob("test_*")
               if path.suffix in {".cjs", ".mjs", ".py"}}
    if registered != present:
        raise ValueError("Register every test exactly by path in tests/suite.json: "
                         + str(sorted(registered ^ present)))
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Install Node.js 22 or newer to run the developer tests.")
    selected = [test for test in suite if group is None or test["group"] == group]
    started = time.monotonic()
    environment = {**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"}
    for index, test in enumerate(selected, 1):
        print(f"[{index}/{len(selected)}] {test['group']}: {test['name']}", flush=True)
        if list_only:
            continue
        command = list(test["command"])
        command[0] = sys.executable if command[0] == "python" else node
        try:
            result = subprocess.run(command, cwd=ROOT, env=environment,
                                    timeout=test.get("timeoutSeconds", 300), check=False)
        except subprocess.TimeoutExpired as error:
            raise RuntimeError(f"Timed out: {test['name']}") from error
        if result.returncode:
            raise RuntimeError(f"Failed: {test['name']} (exit {result.returncode})")
    if not list_only:
        print(f"PASS: {len(selected)} checks in {time.monotonic() - started:.1f} seconds.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--group")
    parser.add_argument("--list", action="store_true")
    arguments = parser.parse_args()
    run(arguments.group, arguments.list)
