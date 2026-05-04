from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "AIDEP"
    VERSION: str = "0.1.0"

    # Database
    DATABASE_URL: str
    DATABASE_URL_ASYNC: str

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str

    # External APIs
    AFAD_API_URL: str = "https://deprem.afad.gov.tr/apiv2/event/filter"
    KANDILLI_API_URL: str = "http://www.koeri.boun.edu.tr/scripts/lst0.asp"
    MGM_API_URL: str = "https://servis.mgm.gov.tr/web"

    # OSRM
    OSRM_URL: str = "http://router.project-osrm.org"

    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 gün

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
