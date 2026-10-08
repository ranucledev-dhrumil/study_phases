from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    secret_key: str
    cors_origin: list[str]
    access_token_minutes: int = 30
    url_check_concurrency: int = 10
    url_check_timeout: float = 5.0

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()