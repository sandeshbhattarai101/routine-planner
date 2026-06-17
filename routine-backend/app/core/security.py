import os
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt

SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt. Truncates at 72 bytes."""
    # Convert to bytes and truncate to 72 bytes to prevent ValueError
    pwd_bytes = password.encode('utf-8')[:72]
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verifies a plain password against a stored bcrypt hash."""
    pwd_bytes = password.encode('utf-8')[:72]
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

def create_token(data: dict) -> str:
    """Creates a JWT access token."""
    payload = data.copy()
    # Use timezone-aware datetime
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload["exp"] = expire
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)