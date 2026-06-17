from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    DATABASE_URL: str

    SECRET_KEY: str

    UPLOAD_DIR: str = "uploads"

    class Config:
        env_file = ".env"


settings = Settings()