from __future__ import annotations

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://flora:flora@postgres:5432/flora")

engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


@contextmanager
def get_session() -> Session:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
