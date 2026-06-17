import os
import uuid
from fastapi import UploadFile

from app.core.config import settings


class FileService:

    @staticmethod
    async def save_file(
        school_id: str,
        file: UploadFile
    ) -> str:

        school_folder = os.path.join(
            settings.UPLOAD_DIR,
            "schools",
            school_id
        )

        os.makedirs(school_folder, exist_ok=True)

        extension = file.filename.split(".")[-1]

        unique_name = f"{uuid.uuid4()}.{extension}"

        file_path = os.path.join(
            school_folder,
            unique_name
        )

        contents = await file.read()

        with open(file_path, "wb") as f:
            f.write(contents)

        return file_path