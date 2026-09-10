"""Build, verify and package a release. This command never pushes or deploys."""
import argparse
from build import build
from quality import verify
from package_release import package


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("destination", help="ZIP path outside the project directory")
    args = parser.parse_args()
    build()
    verify()
    package(args.destination)
