import logging

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

logger = logging.getLogger("hiremind.security.crypto")

# Create thread-safe Argon2 hasher instance matching default profiles
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536, # 64MB
    parallelism=4
)

def hash_password(password: str) -> str:
    """Hashes a plain password using Argon2ID."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the Argon2ID hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except VerifyMismatchError:
        return False
    except Exception as e:
        logger.error(f"Error executing Argon2 password validation: {str(e)}")
        return False
