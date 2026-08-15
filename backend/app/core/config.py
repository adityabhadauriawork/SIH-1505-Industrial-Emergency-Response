import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR.parent / "data"

class Settings:
    PROJECT_NAME: str = "SIH 1505 - Industrial Hazard Command Center"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/sih1505.db"
    SEED_DATA_PATH: Path = DATA_DIR / "seed_data.json"
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
