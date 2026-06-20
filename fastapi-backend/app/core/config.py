from pydantic import BaseSettings
from functools import lrucache

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    debug: bool = False

    class Config:
        env_file = '.env'

@lrucache
def get_settings() -> Settings:
	return Settings()
