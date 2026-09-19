import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    DEFAULT_DB_PATH = "/tmp/zugzwang.db"
else:
    DEFAULT_DB_PATH = os.path.join(BASE_DIR, "zugzwang.db")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zugzwang"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DEFAULT_DB_PATH}")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    STOCKFISH_PATH: str = os.getenv("STOCKFISH_PATH", os.path.join(BASE_DIR, "bin", "stockfish"))
    CHESS_COM_USER_AGENT: str = "ZugzwangChessApp/1.0 (contact@zugzwang.local)"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
