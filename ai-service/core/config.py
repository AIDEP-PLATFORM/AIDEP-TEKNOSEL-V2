from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "AIDEP-AI"
    VERSION: str = "0.1.0"

    # Redis (çoklu teyit grid için)
    REDIS_URL: str = "redis://localhost:6380/0"

    # OSRM (güvenli rota hesaplama)
    OSRM_URL: str = "http://osrm:5000"

    # CORS — sadece backend'e izin ver
    ALLOWED_ORIGINS: List[str] = ["http://backend:8000", "http://localhost:8001"]

    class Config:
        env_file = "../.env"
        case_sensitive = True


settings = Settings()
