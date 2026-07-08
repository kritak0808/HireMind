import logging
from typing import Optional

from config import settings
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from security import UserSession, check_permission, decode_access_token
from telemetry import tenant_id_ctx

logger = logging.getLogger("hiremind.auth")

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    auto_error=False
)

async def get_current_user_session(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme)
) -> UserSession:
    """
    FastAPI dependency that decodes the bearer JWT token, extracts user claims,
    and binds the validated tenant ID to the async telemetry context.
    """
    # 1. Fallback check for authorization header if oauth2_scheme misses it
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Decode claims from validated token
    session = decode_access_token(token, settings.JWT_SECRET_KEY, settings.JWT_ALGORITHM)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or signature validation failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Securely bind context for logs/observability
    tenant_id_ctx.set(session.tenant_id)
    return session

class PermissionRequired:
    """FastAPI dynamic dependency that enforces permissions checks on target routes."""
    def __init__(self, permission: str) -> None:
        self.permission = permission

    def __call__(self, session: UserSession = Depends(get_current_user_session)) -> UserSession:
        if not check_permission(session, self.permission):
            logger.warn(f"Access denied for user {session.user_id} requesting {self.permission}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: insufficient permissions"
            )
        return session
