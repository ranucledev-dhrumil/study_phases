from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SECRET_KEY: str
    CORS_ORIGIN: list[str]
    ACCESS_TOKEN_MINUTES: int = 30

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()