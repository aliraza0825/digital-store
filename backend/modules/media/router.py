from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from modules.storage.service import resolve_thumbnail_path

router = APIRouter(prefix="/api/media", tags=["media"])


@router.get("/thumbnails/{path:path}")
def serve_thumbnail(path: str):
    file_path = resolve_thumbnail_path(path)
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    return FileResponse(file_path)
