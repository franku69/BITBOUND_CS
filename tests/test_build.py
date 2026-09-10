"""Small build contracts for dependency changes and reproducible offline output."""
from pathlib import Path
import json
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from buildlib.files import source_path, write, digest
from buildlib.bundles import domain_bundle
from buildlib.revisions import version_assets
from buildlib.offline import build_offline


class BuildContracts(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        (self.root / "app").mkdir()
        (self.root / "shared").mkdir()
        (self.root / "scripts").mkdir()
        self.config = {"moduleRoots": ["app", "shared"], "entryPages": ["index.html"]}
        write(self.root / "index.html", '<script type="module" src="app/main.js"></script>')

    def tearDown(self):
        self.temporary.cleanup()

    def test_transitive_revisions_change_with_leaf_and_are_idempotent(self):
        write(self.root / "app/main.js", "import {\n  answer\n} from '../shared/value.js';\nexport {answer};\n")
        write(self.root / "shared/value.js", "export const answer = 42;\n")
        first = version_assets(self.root, self.config)
        self.assertIn("?v=" + first["shared/value.js"], (self.root / "app/main.js").read_text())
        second = version_assets(self.root, self.config)
        self.assertEqual(first, second)
        write(self.root / "shared/value.js", "export const answer = 43;\n")
        third = version_assets(self.root, self.config)
        self.assertNotEqual(first["app/main.js"], third["app/main.js"])
        self.assertIn(third["app/main.js"], (self.root / "index.html").read_text())

    def test_side_effect_import_and_reexport(self):
        write(self.root / "app/main.js", "import '../shared/value.js';\nexport {answer} from '../shared/value.js';\n")
        write(self.root / "shared/value.js", "export const answer=1;\n")
        revisions = version_assets(self.root, self.config)
        self.assertEqual((self.root / "app/main.js").read_text().count("?v=" + revisions["shared/value.js"]), 2)

    def test_noncanonical_root_has_the_same_revision_graph(self):
        # Windows TEMP can use RUNNER~1 while resolve() returns runneradmin.
        # A lexical alias exercises the same root/child mismatch on every OS.
        write(self.root / "app/main.js", "import '../shared/value.js';\n")
        write(self.root / "shared/value.js", "export const answer = 42;\n")
        alias = self.root / "scripts" / ".."
        first = version_assets(alias, self.config)
        self.assertEqual(first, version_assets(self.root.resolve(), self.config))
        write(self.root / "shared/value.js", "export const answer = 43;\n")
        self.assertNotEqual(first["app/main.js"], version_assets(alias, self.config)["app/main.js"])
        write(self.root / "shared/value.js", "import '../app/main.js';\n")
        with self.assertRaisesRegex(ValueError, "Circular"):
            version_assets(alias, self.config)

    @unittest.skipUnless(sys.platform == "win32", "Windows short-path API")
    def test_windows_short_root(self):
        import ctypes
        buffer = ctypes.create_unicode_buffer(32768)
        short_path = ctypes.windll.kernel32.GetShortPathNameW
        short_path.argtypes = (ctypes.c_wchar_p, ctypes.c_wchar_p, ctypes.c_uint32)
        short_path.restype = ctypes.c_uint32
        length = short_path(str(self.root), buffer, len(buffer))
        self.assertGreater(length, 0)
        write(self.root / "app/main.js", "export const answer = 42;\n")
        self.assertEqual(version_assets(Path(buffer.value), self.config),
                         version_assets(self.root.resolve(), self.config))

    def test_cycles_and_missing_dependencies_fail_before_manifest(self):
        write(self.root / "app/main.js", "import './other.js';\n")
        with self.assertRaises(ValueError):
            version_assets(self.root, self.config)
        write(self.root / "app/other.js", "import './main.js';\n")
        with self.assertRaisesRegex(ValueError, "Circular"):
            version_assets(self.root, self.config)

    def test_domain_exports_are_private_and_explicit(self):
        write(self.root / "shared/model.js", "const privateValue=1;\nfunction get(){return privateValue;}\nexport { get };\n")
        bundled = domain_bundle(self.root, {"namespace": "Model", "source": "shared/model.js"})
        self.assertIn("const Model = (() =>", bundled)
        self.assertIn("return Object.freeze({get})", bundled)
        write(self.root / "shared/model.js", "import './other.js';\nexport { get };\n")
        with self.assertRaises(ValueError):
            domain_bundle(self.root, {"namespace": "Model", "source": "shared/model.js"})

    def test_output_bytes_are_utf8_lf_and_paths_stay_in_project(self):
        target = self.root / "text.txt"
        write(target, "caf\u00e9\nnext\n")
        self.assertEqual(target.read_bytes(), b"caf\xc3\xa9\nnext\n")
        with self.assertRaises(ValueError):
            source_path(self.root, "../outside.txt")

    def test_offline_fingerprint_includes_names_and_worker(self):
        write(self.root / "app/a.js", "const answer=42;\n")
        write(self.root / "scripts/sw-template.js", "const version='__CACHE_VERSION__';const revisions=__ASSET_REVISIONS__;")
        config = {"offlineFiles": ["app/a.js"], "offlineFolders": []}
        first = build_offline(self.root, config, {})
        self.assertEqual(first["hashes"]["app/a.js"], digest(self.root / "app/a.js"))
        self.assertIn(first["version"], (self.root / "sw.js").read_text())
        (self.root / "app/a.js").rename(self.root / "app/b.js")
        second = build_offline(self.root, {**config, "offlineFiles": ["app/b.js"]}, {})
        self.assertNotEqual(first["version"], second["version"])


if __name__ == "__main__":
    unittest.main()
