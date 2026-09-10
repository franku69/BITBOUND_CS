"""Read-only release gate: boundaries, build reproducibility and all tests."""
import subprocess
import sys
from build import ROOT


def verify():
    for script in ["scripts/check_architecture.py", "scripts/check_build.py", "scripts/test.py"]:
        result = subprocess.run([sys.executable, script], cwd=ROOT, check=False)
        if result.returncode:
            raise SystemExit(result.returncode)
    print("PASS: project quality gate.")


if __name__ == "__main__":
    verify()
