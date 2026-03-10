import os
from logging import config as logging_config

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from shared.python.logger import LOGGING

# Применяем настройки логирования
logging_config.dictConfig(LOGGING)


class MixinSetting(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    @property
    def base_dir(self) -> str:
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class ProjectSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    project_name: str = Field('YouBestFlora', alias='PROJECT_NAME')

    @property
    def base_dir(self) -> str:
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class PostgresSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore' )

    postgres_host: str = Field('postgres', alias='POSTGRES_HOST')
    postgres_port: int = Field(5432, alias='POSTGRES_PORT')
    postgres_db: str = Field('db', alias='POSTGRES_DB')
    postgres_user: str = Field('user', alias='POSTGRES_USER')
    postgres_password: str = Field('password', alias='POSTGRES_PASSWORD')

    @property
    def postgres_url(self) -> str:
        """Вернуть URL базы данных PostgreSQL."""
        return f'postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}'

    @property
    def base_dir(self) -> str:
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


project_settings = ProjectSettings()
postgres_settings = PostgresSettings()
