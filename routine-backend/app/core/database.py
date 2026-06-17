import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Force Python to read the .env file
load_dotenv() 

DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback: If your .env file isn't picked up, build the URL manually
if not DATABASE_URL:
    raw_password = "routine!!123"
    # Safely handle the '!!' special characters for SQLAlchemy
    encoded_password = urllib.parse.quote_plus(raw_password)
    DATABASE_URL = f"postgresql+psycopg2://super_admin:{encoded_password}@localhost:5432/routinesystem?options=-csearch_path%3Dpublic"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()