"""Regenerate the installer manifest after all release files are finalized."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = "4.5.0-rc.47"
EXCLUDED = {"PACKAGE_MANIFEST.json", ".DS_Store"}


def package_files():
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.name in EXCLUDED:
            continue
        if any(part in {".git", "__pycache__"} for part in path.relative_to(ROOT).parts):
            continue
        yield path


def main():
    entries = []
    for path in package_files():
        h = hashlib.sha256()
        with path.open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                h.update(chunk)
        entries.append({"path": path.relative_to(ROOT).as_posix(), "bytes": path.stat().st_size, "sha256": h.hexdigest()})
    destination = ROOT / "PACKAGE_MANIFEST.json"
    destination.write_text(json.dumps({"version": VERSION, "files": entries}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{VERSION}: {len(entries)} files in {destination.name}")


if __name__ == "__main__":
    main()
