import os
from pathlib import Path

from dotenv import load_dotenv


# Project root: music_app/
PROJECT_ROOT = Path(__file__).resolve().parents[2]

# Load environment variables from the project root.
load_dotenv(PROJECT_ROOT / ".env")


class Settings:

    YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
    VIDKRAKEN_API_KEY = os.getenv("VIDKRAKEN_API_KEY")


settings = Settings()
