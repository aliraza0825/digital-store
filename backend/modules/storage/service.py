"""Local filesystem storage for product thumbnails and downloadable files.

This module was missing from the repo entirely — its directory name ("storage")
collided with the top-level `.gitignore` rule meant only for the runtime
`backend/storage/` upload folder, so git silently never tracked
`backend/modules/storage/`. That's why the backend failed to boot with
`ModuleNotFoundError: No module named 'modules.storage'`. Recreated here to
match what every caller (admin upload, media, download) already expects.
"""

import shutil
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

from app.config import settings


def ensure_storage_dirs() -> None:
    settings.thumbnails_dir.mkdir(parents=True, exist_ok=True)
    settings.product_files_dir.mkdir(parents=True, exist_ok=True)


def _safe_ext(filename: str, default: str) -> str:
    if filename and "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        # keep it short/sane — avoid something absurd sneaking into a path segment
        if ext.isalnum() and len(ext) <= 10:
            return ext
    return default


def save_thumbnail(product_id: UUID, upload: UploadFile) -> str:
    """Saves the thumbnail and returns the relative path stored in the DB."""
    ext = _safe_ext(upload.filename or "", "jpg")
    rel_path = f"{product_id}/thumbnail.{ext}"
    dest_file = settings.thumbnails_dir / rel_path
    dest_file.parent.mkdir(parents=True, exist_ok=True)
    upload.file.seek(0)
    with open(dest_file, "wb") as out:
        shutil.copyfileobj(upload.file, out)
    return rel_path


def save_product_file(product_id: UUID, upload: UploadFile) -> str:
    """Saves the actual digital product file, returns the relative DB path."""
    filename = (upload.filename or "file").replace("/", "_").replace("\\", "_")
    rel_path = f"{product_id}/{filename}"
    dest_file = settings.product_files_dir / rel_path
    dest_file.parent.mkdir(parents=True, exist_ok=True)
    upload.file.seek(0)
    with open(dest_file, "wb") as out:
        shutil.copyfileobj(upload.file, out)
    return rel_path


def _resolve_within(base_dir: Path, rel_path: str) -> Path:
    """Resolves rel_path under base_dir, refusing to escape it (path traversal guard)."""
    resolved = (base_dir / rel_path).resolve()
    base_resolved = base_dir.resolve()
    if base_resolved not in resolved.parents and resolved != base_resolved:
        # Return a path that will simply never exist, rather than leaking
        # anything outside the storage directory.
        return base_resolved / "__invalid__"
    return resolved


def resolve_thumbnail_path(rel_path: str) -> Path:
    return _resolve_within(settings.thumbnails_dir, rel_path)


def resolve_product_file_path(rel_path: str) -> Path:
    return _resolve_within(settings.product_files_dir, rel_path)
