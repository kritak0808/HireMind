import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

import jwt
from pydantic import BaseModel, Field

logger = logging.getLogger("hiremind.security")

# 1. User Identity & Token Claims Model
class UserSession(BaseModel):
    user_id: str
    email: str
    tenant_id: uuid.UUID
    roles: List[str] = Field(default_factory=list)
    permissions: List[str] = Field(default_factory=list)

# 2. RBAC Policy Structure
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "org_admin": ["tenant:write", "tenant:read", "jobs:write", "jobs:read", "evals:write", "evals:read"],
    "recruiter": ["jobs:write", "jobs:read", "evals:write", "evals:read"],
    "hiring_manager": ["jobs:read", "evals:read", "evals:write"],
    "hr_specialist": ["jobs:read", "evals:read"],
    "candidate": ["workspace:read", "code:execute"]
}

# 4. Token Generation & Claims Validation
def generate_access_token(
    session: UserSession,
    secret_key: str,
    algorithm: str = "HS256",
    expires_minutes: int = 60
) -> str:
    """Generates an encrypted JWT access token for a valid session."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    payload = {
        "sub": session.user_id,
        "email": session.email,
        "tenant_id": str(session.tenant_id),
        "roles": session.roles,
        "permissions": session.permissions or [p for r in session.roles for p in ROLE_PERMISSIONS.get(r, [])],
        "exp": expire
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)

def decode_access_token(token: str, secret_key: str, algorithm: str = "HS256") -> Optional[UserSession]:
    """Decodes and validates a JWT token; returns session context."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return UserSession(
            user_id=payload["sub"],
            email=payload["email"],
            tenant_id=payload["tenant_id"],
            roles=payload.get("roles", []),
            permissions=payload.get("permissions", [])
        )

    except jwt.ExpiredSignatureError:
        logger.warn("Token validation failed: expired signature")
        return None
    except jwt.InvalidTokenError as e:
        logger.warn(f"Token validation failed: {str(e)}")
        return None

# 5. Permission & Policy Engine
def check_permission(session: UserSession, required_permission: str) -> bool:
    """Checks if the active session holds permissions matching target string."""
    # Organization administrators bypass all permission checks
    if "org_admin" in session.roles:
        return True
    return required_permission in session.permissions

# 6. Audit Logging framework
def write_audit_log(actor_id: str, tenant_id: str, action: str, resource: str, success: bool = True) -> None:
    """Publishes a structured auditing log for compliance pipelines."""
    logger.info(
        f"AUDIT_LOG: Actor {actor_id} performed {action} on {resource}",
        extra={
            "audit": {
                "actor_id": actor_id,
                "tenant_id": tenant_id,
                "action": action,
                "resource": resource,
                "success": success,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    )

# Bridge the package-level shadowed imports
from ai_safety import AISafetyShield  # noqa: F401, E402
from ai_service import LLMGateway  # noqa: F401, E402
from crypto import hash_password, verify_password  # noqa: F401, E402
from policy_engine import EnvironmentContext, PolicyEngine, ResourceContext  # noqa: F401, E402
from totp import generate_backup_codes, generate_totp_secret, get_totp_uri, verify_totp_code  # noqa: F401, E402


