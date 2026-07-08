import logging
import uuid
from datetime import datetime, timedelta

import path_setup  # noqa: F401
from config import settings
from db import get_db_session
from dtos import TokenResponse, UserProfileResponse, UserRegisterRequest
from fastapi import APIRouter, Depends, HTTPException, Request, status
from models import User, UserSessionRecord
from repositories import SQLAlchemySessionRepository, SQLAlchemyUserRepository
from security import UserSession, generate_access_token, hash_password, verify_password
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegisterRequest, db: AsyncSession = Depends(get_db_session)):
    repo = SQLAlchemyUserRepository(db)
    existing = await repo.get_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address already registered"
        )

    hashed = hash_password(payload.password)
    user = User(
        id=uuid.uuid4(),
        email=payload.email,
        password_hash=hashed,
        first_name=payload.first_name,
        last_name=payload.last_name,
        is_active=True,
        verified=False,
        created_at=datetime.utcnow()
    )
    await repo.add(user)
    await repo.save()

    return UserProfileResponse(
        id=str(user.id),
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        created_at=user.created_at.isoformat()
    )

@router.post("/login", response_model=TokenResponse)
async def login(request: Request, db: AsyncSession = Depends(get_db_session)):
    # Read client credentials (OAuth2/form details or JSON)
    # For implementation uniformity, we extract form parameters or JSON bodies
    try:
        body = await request.json()
        email = body.get("email")
        password = body.get("password")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing credentials JSON payload"
        )

    user_repo = SQLAlchemyUserRepository(db)
    session_repo = SQLAlchemySessionRepository(db)

    user = await user_repo.get_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials provided"
        )

    # Brute Force Lock Check
    if user.locked_until and user.locked_until > datetime.utcnow():
        logger.warn(f"Login blocked: Account {email} locked until {user.locked_until.isoformat()}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account temporarily locked. Please try again after {user.locked_until.isoformat()}"
        )

    # Validate Credential Matching
    if not verify_password(password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
            logger.warn(f"Brute force lockout triggered for user {email}")
        await user_repo.save()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials provided"
        )

    # Reset failed attempts upon successful login
    user.failed_login_attempts = 0
    await user_repo.save()

    # Issue Tokens
    # Default tenant ID binding for initial login; dynamic switches are performed post login
    tenant_id = str(user.memberships[0].organization_id) if user.memberships else "00000000-0000-0000-0000-000000000000"

    token_session = UserSession(
        user_id=str(user.id),
        email=user.email,
        tenant_id=tenant_id,
        roles=[m.role for m in user.memberships] if user.memberships else []
    )

    access_token = generate_access_token(
        session=token_session,
        secret_key=settings.JWT_SECRET_KEY,
        expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    # Refresh Token Rotation
    refresh_token = str(uuid.uuid4())
    hashed_refresh = hash_password(refresh_token)

    user_session = UserSessionRecord(
        user_id=user.id,
        refresh_token_hash=hashed_refresh,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    await session_repo.add(user_session)
    await session_repo.save()

    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )
