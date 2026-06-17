from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from fastapi import HTTPException

router = APIRouter(
    prefix="/uploads",
    tags=["Uploads"]
)

ALLOWED_EXTENSIONS = ["xlsx"]

@router.post("/")
async def upload_excel(
    file: UploadFile = File(...)
):
    extension = file.filename.split(".")[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx files are allowed"
        )

    return {
        "filename": file.filename
    }