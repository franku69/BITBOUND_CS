"""Guard the repository's intentionally small dependency surface.

These checks complement Node syntax checks and behavior tests; they are not a
JavaScript type checker. Dependency extraction supports the static relative
imports used in this project; dynamic imports are intentionally disallowed.
"""
from pathlib import Path
import re
from build import ROOT
from buildlib.files import read, read_json, source_path
from buildlib.revisions import IMPORT

STATIC_IMPORT = re.compile(r'''(?m)(\b(?:import|export)\s+(?:[^;"']*?\bfrom\s*)?["'])([^"']+)(["'])''')
DOMAIN_BROWSER_API = re.compile(r"\b(?:window|document|navigator|localStorage|sessionStorage|indexedDB)\s*[.\[]")
PERSISTENCE = re.compile(r"\b(?:localStorage|sessionStorage|indexedDB)\s*[.\[]")
COMMENTS = re.compile(r"/\*[\s\S]*?\*/|(?m:^\s*//[^\n]*)")


def check(root=ROOT):
    errors = []
    config = read_json(root / "scripts/build-config.json")
    order = read_json(root / "adventure/systems/order.json")
    actual = {path.name for path in (root / "adventure/systems").glob("*.js")}
    if len(order) != len(set(order)) or set(order) != actual:
        errors.append("Each gameplay system must appear exactly once in systems/order.json.")
    if order[-1] != "21-boot.js":
        errors.append("21-boot.js must remain the final composition stage.")
    specs = config["domains"]
    if len({spec["namespace"] for spec in specs}) != len(specs):
        errors.append("Domain namespaces must be unique.")
    domain_files = {path.relative_to(root).as_posix() for path in (root / "adventure/domain").glob("*.js")}
    registered = {spec["source"] for spec in specs}
    if not domain_files <= registered:
        errors.append("Every game domain must be registered in scripts/build-config.json.")
    graph = {}
    for folder in config["moduleRoots"] + ["adventure/domain"]:
        for path in sorted((root / folder).rglob("*.js")):
            name = path.relative_to(root).as_posix()
            source = COMMENTS.sub("", read(path))
            dependencies = []
            for match in STATIC_IMPORT.finditer(source):
                target = match.group(2).split("?")[0]
                if not target.startswith(".") or not target.endswith(".js"):
                    errors.append(f"{name}: use a bundled, static relative JavaScript dependency: {target}")
            for match in IMPORT.finditer(source):
                try:
                    target = source_path(root, (path.parent / match.group(2)).relative_to(root))
                    dependencies.append(target.relative_to(root).as_posix())
                except ValueError as error:
                    errors.append(str(error))
            graph[name] = dependencies
            if re.search(r"(?<![.\w$])\bimport\s*\([^)]*\)(?!\s*\{)", source):
                errors.append(f"{name}: dynamic imports need an explicit offline/build design first.")
            if PERSISTENCE.search(source) and name not in config.get("preferenceStorageOwners", []):
                errors.append(f"{name}: student data must remain manual-save only.")
            if name.startswith(("adventure/domain/", "shared/")):
                if dependencies or DOMAIN_BROWSER_API.search(source) or re.search(r"\b(?:fetch|setTimeout|setInterval|requestAnimationFrame)\s*\(", source):
                    errors.append(f"{name}: domains/shared protocol must have no platform dependency.")
            if name.startswith("app/") and any(dep.startswith("adventure/") for dep in dependencies):
                errors.append(f"{name}: Lab/chooser must not load the Story engine.")
            if name.endswith("-view.js") and any(dep.endswith(("runner.js", "execution.js", "controller.js")) for dep in dependencies):
                errors.append(f"{name}: presentation cannot own execution or navigation.")
            if name == "app/lab/catalog.js" and dependencies:
                errors.append("The mission catalog is a pure, independent model.")
            if name == "app/main.js" and dependencies != ["app/lab/controller.js"]:
                errors.append("The Lab entrypoint must delegate to its composition root.")
    visiting, visited = set(), set()

    def visit(name):
        if name in visiting:
            errors.append("Circular module dependency: " + name)
            return
        if name in visited:
            return
        visiting.add(name)
        for dependency in graph.get(name, []):
            visit(dependency)
        visiting.remove(name)
        visited.add(name)

    for name in graph:
        visit(name)
    manifest = read_json(root / "offline-manifest.json")
    offline = set(manifest["files"])
    for name in graph:
        if name.startswith("adventure/domain/"):
            continue  # Shipped inside game.js; never a second runtime download.
        if name not in offline or any(dep not in offline for dep in graph[name]):
            errors.append(f"{name}: native module dependency missing from the offline pack.")
    if errors:
        raise ValueError("\n".join(errors))
    print(f"PASS: {len(graph)} module boundaries, {len(order)} registered systems, "
          f"{len(specs)} isolated domains, acyclic imports and manual-save boundary.")


if __name__ == "__main__":
    check()
