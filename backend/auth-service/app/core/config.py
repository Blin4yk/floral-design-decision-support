import os
from logging import config as logging_config

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from shared.python.logger import LOGGING

# Применяем настройки логирования
logging_config.dictConfig(LOGGING)


class AuthSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    @property
    def postgres_url(self) -> str:
        """Вернуть URL базы данных PostgreSQL."""
        return f'postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}'

    jwt_secret_key: str = Field(
        'jwt-secret-key-43-symbols', alias='JWT_SECRET_KEY'
    )
    jwt_algorithm: str = Field('algorythm', alias='JWT_ALGORITHM')
    access_token_expire_minutes: int = Field(15, alias='ACCESS_TOKEN_EXPIRE_MINUTES')
    refresh_token_expire_days: int = Field(7, alias='REFRESH_TOKEN_EXPIRE_DAYS')
    @property
    def base_dir(self) -> str:
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class OAuthSettings(BaseSettings):
    """Настройки для авторизации"""
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    oauth_yandex_client_id: str = Field('secret_client_id', alias='OAUTH_YANDEX_CLIENT_ID')
    oauth_yandex_client_secret: str = Field('client_secret_key', alias='OAUTH_YANDEX_CLIENT_SECRET')
    oauth_redirect_uri: str = Field(
        'redirect-url', alias='OAUTH_REDIRECT_URI'
    )

    AUTHORIZATION_BASE_URL: str = Field('url-authorize', alias='AUTHORIZATION_BASE_URL')
    TOKEN_URL: str = Field('url-token', alias='TOKEN_URL')

    oauth_credentials: dict = {
        'yandex': {
            'id': Field('secret_client_id', alias='OAUTH_YANDEX_CLIENT_ID'),
            'secret': Field('client_secret_key', alias='OAUTH_YANDEX_CLIENT_SECRET'),
            'redirect_uri': Field('url-ver-code', alias='OAUTH_REDIRECT_URI')
        }
    }

    @property
    def base_dir(self) -> str:
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

oauth_settings = AuthSettings()
