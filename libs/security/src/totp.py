import secrets
from typing import List, Tuple

import bcrypt
import pyotp


def generate_totp_secret() -> str:
    """Generates a random base32 string suitable for TOTP keys."""
    return pyotp.random_base32()

def get_totp_uri(secret: str, user_email: str, issuer_name: str = "HireMind AI") -> str:
    """Returns the provisioning URI for TOTP applications (Google Authenticator)."""
    return pyotp.totp.TOTP(secret).provisioning_uri(name=user_email, issuer_name=issuer_name)

def verify_totp_code(secret: str, code: str) -> bool:
    """Verifies a 6-digit TOTP code against the secret key."""
    totp = pyotp.totp.TOTP(secret)
    return totp.verify(code, valid_window=1) # Permits +/- 30s clock drift

def generate_backup_codes(count: int = 8) -> Tuple[List[str], List[str]]:
    """
    Generates backup recovery codes.
    Returns:
        Tuple[List[plain_codes], List[hashed_codes]] for storage.
    """
    plain_codes = []
    hashed_codes = []
    for _ in range(count):
        # Generate 12-char secure random hex key
        code = secrets.token_hex(6)
        plain_codes.append(code)

        # Hash for secure database storage
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(code.encode("utf-8"), salt).decode("utf-8")
        hashed_codes.append(hashed)

    return plain_codes, hashed_codes
