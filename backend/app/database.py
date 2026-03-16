from config import settings 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os


class Base(DeclarativeBase):
    pass


DATABASE_URL = settings.DATABASE_URL
print('This is db url: ',DATABASE_URL)

if not DATABASE_URL or "postgresql" not in DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable must be set to a PostgreSQL URL, "
        "for example: postgresql+psycopg2://user:password@host:5432/dbname"
    )

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

