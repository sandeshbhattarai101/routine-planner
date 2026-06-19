import csv
import io

from fastapi import APIRouter
from fastapi import Depends
from fastapi import UploadFile
from fastapi import File
from fastapi import HTTPException
from openpyxl import load_workbook

from app.core.permissions import school_admin_only
from app.core.dependencies import get_current_school_id

router = APIRouter(
    prefix="/uploads",
    tags=["Uploads"]
)

ALLOWED_EXTENSIONS = ["xlsx", "csv"]


def parse_xlsx(contents: bytes) -> list[dict]:
    workbook = load_workbook(filename=io.BytesIO(contents), read_only=True, data_only=True)
    sheet = workbook.active

    rows_iter = sheet.iter_rows(values_only=True)
    try:
        header = [str(col) if col is not None else "" for col in next(rows_iter)]
    except StopIteration:
        return []

    rows = []
    for row in rows_iter:
        if all(value is None for value in row):
            continue
        rows.append({header[i]: row[i] for i in range(len(header))})

    return rows


def parse_csv(contents: bytes) -> list[dict]:
    text = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    return [dict(row) for row in reader]


@router.post("/")
async def upload_excel(
    file: UploadFile = File(...),
    school_id=Depends(get_current_school_id),
    _=Depends(school_admin_only)
):
    extension = file.filename.split(".")[-1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx and .csv files are allowed"
        )

    contents = await file.read()

    try:
        if extension == "xlsx":
            rows = parse_xlsx(contents)
        else:
            rows = parse_csv(contents)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not parse file. Please check the file format."
        )

    if not rows:
        raise HTTPException(
            status_code=400,
            detail="File contains no data rows."
        )

    return {
        "filename": file.filename,
        "columns": list(rows[0].keys()),
        "rows": rows
    }