"""Regenerate the installer manifest after all release files are finalized."""
import hashlib
import json
import re
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
        size = path.stat().st_size
        digest = h.hexdigest()
        if size <= 1024:
            data = path.read_bytes()
            if data.startswith(b"version https://git-lfs.github.com/spec/v1"):
                pointer = re.fullmatch(rb"version https://git-lfs.github.com/spec/v1\r?\noid sha256:([0-9a-f]{64})\r?\nsize ([0-9]+)\r?\n?", data)
                if not pointer:
                    raise ValueError("Invalid LFS pointer: " + str(path))
                digest = pointer.group(1).decode("ascii")
                size = int(pointer.group(2))
                if size <= 0:
                    raise ValueError("Invalid LFS object size: " + str(path))
        entries.append({"path": path.relative_to(ROOT).as_posix(), "bytes": size, "sha256": digest})
    destination = ROOT / "PACKAGE_MANIFEST.json"
    destination.write_text(json.dumps({"version": VERSION, "files": entries}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{VERSION}: {len(entries)} files in {destination.name}")


if __name__ == "__main__":
    main()
