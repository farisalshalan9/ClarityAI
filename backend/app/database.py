import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger("clarityai.database")

Base = declarative_base()

def _create_db_engine():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    elif "postgresql" in db_url:
        connect_args["connect_timeout"] = 3

    try:
        eng = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True,
        )
        # Fast test connection
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Database connection verified successfully on: {db_url.split('@')[-1] if '@' in db_url else db_url}")
        return eng
    except Exception as e:
        logger.warning(f"Could not connect to external database ({e}). Falling back to local SQLite database.")
        sqlite_url = "sqlite:///./clarity_ai.db"
        eng = create_engine(
            sqlite_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
        return eng

engine = _create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
