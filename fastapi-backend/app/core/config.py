from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_uri: str
    debug: bool = False

    # Auth / JWT
    secret_key: str = "dev-secret-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    class Config:
        env_file = '.env'

@lru_cache
def get_settings() -> Settings:
    return Settings()
