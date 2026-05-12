from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "AIDEP-AI"
    VERSION: str = "0.1.0"

    # Redis (çoklu teyit grid için)
    REDIS_URL: str = "redis://localhost:6380/0"

    # OSRM (güvenli rota hesaplama)
    OSRM_URL: str = "http://osrm:5000"

    # MongoDB (inference sonuçları kalıcı kayıt)
    MONGODB_URL: str = "mongodb://aidep:aidep_mongo_pass@localhost:27017/aidep_ai?authSource=admin"
    MONGODB_DB: str = "aidep_ai"

    # MinIO (model dosyaları)
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "changeme"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_MODELS: str = "ai-models"

    # AI Servis → Backend arası API key (backend bu key'i header'da gönderir)
    AI_INTERNAL_API_KEY: str = "change-me-generate-with-openssl"

    # Hava durumu — Open-Meteo (ücretsiz, key gerektirmez)
    WEATHER_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    # MGM (ileride kullanım için)
    MGM_API_URL: str = "https://servis.mgm.gov.tr/web"

    # CORS — sadece backend'e izin ver
    ALLOWED_ORIGINS: List[str] = ["http://backend:8000", "http://localhost:8001"]

    class Config:
        env_file = "../.env"
        case_sensitive = True


settings = Settings()
