import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "Intelligent Healthcare & Health Insurance Decision Platform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Security
    SECRET_KEY: str = "dev-healthcare-decision-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/healthcare_platform.db"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000"

    # Paths
    MODELS_DIR: str = str(BASE_DIR.parent / "models")
    DATA_DIR: str = str(BASE_DIR.parent / "data")

    # Recommendation Weights
    WEIGHT_AFFORDABILITY: float = 0.35
    WEIGHT_COVERAGE: float = 0.30
    WEIGHT_RISK_MATCH: float = 0.20
    WEIGHT_TERMS_FIT: float = 0.15

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
