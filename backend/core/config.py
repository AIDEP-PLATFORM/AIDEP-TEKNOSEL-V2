from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "AIDEP"
    VERSION: str = "0.1.0"

    # Database
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5433
    DATABASE_URL: str
    DATABASE_URL_ASYNC: str

    # Redis
    REDIS_PORT: int = 6380
    REDIS_URL: str = "redis://localhost:6380/0"

    # MinIO
    MINIO_PORT: int = 9002
    MINIO_CONSOLE_PORT: int = 9003
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_URL: str = "http://localhost:9002"
    MINIO_PUBLIC_URL: str = "http://localhost:9002"  # tarayıcıdan erişilebilir URL (presigned için)
    MINIO_BUCKET_DATASETS: str = "ai-datasets"

    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""
    AWS_S3_REGION: str = ""

    # External APIs
    AFAD_API_URL: str = "https://deprem.afad.gov.tr/apiv2/event/filter"
    KANDILLI_API_URL: str = "http://www.koeri.boun.edu.tr/scripts/lst0.asp"
    MGM_API_URL: str = "https://servis.mgm.gov.tr/web"

    # OSRM
    OSRM_URL: str = "http://osrm:5000"

    # AI Service
    AI_SERVICE_URL: str = "http://ai-service:8000"
    AI_INTERNAL_API_KEY: str = "change-me-generate-with-openssl"

    # Firebase
    FIREBASE_DATABASE_URL: str = "http://localhost:9000"
    FIREBASE_EMULATOR: bool = True
    FIREBASE_PROJECT_ID: str = "demo-aidep"
    FCM_SERVER_KEY: str = ""  # Production'da GCM/FCM server key

    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]

    class Config:
        env_file = "../.env"
        case_sensitive = True


settings = Settings()
