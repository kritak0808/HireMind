import logging
import uuid
from typing import List, Optional

import path_setup  # noqa: F401
from auth import get_current_user_session
from contracts import JobCreatedEvent
from db import get_db_session
from dtos import JobCreateRequest, JobResponse
from events import RedisEventBus
from fastapi import APIRouter, Depends, HTTPException, status
from models import JobPosting
from pydantic import BaseModel
from repositories import SQLAlchemyJobRepository
from security import UserSession
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("hiremind.api.jobs")
router = APIRouter(prefix="/jobs", tags=["Jobs Management"])

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(
    payload: JobCreateRequest,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyJobRepository(db)

    job = JobPosting(
        organization_id=session.tenant_id,
        title=payload.title,
        description=payload.description,
        status="draft",
        salary_range=payload.salary_range,
        hiring_manager_id=uuid.UUID(payload.hiring_manager_id) if payload.hiring_manager_id else None
    )
    await repo.add(job)
    await repo.save()

    # Store requested skill requirements
    for skill in payload.skills:
        await repo.add_skill_requirement(
            job_id=job.id,
            name=skill.name,
            weight=skill.weight,
            target_tier=skill.target_tier
        )
    await repo.save()

    # Emit JobCreated event
    event_bus = RedisEventBus()
    event = JobCreatedEvent(
        tenant_id=session.tenant_id,
        correlation_id=str(uuid.uuid4()),
        payload={
            "job_id": str(job.id),
            "title": job.title,
            "organization_id": session.tenant_id,
            "creator_id": session.user_id
        }
    )
    await event_bus.publish(event)

    return JobResponse(
        id=str(job.id),
        organization_id=str(job.organization_id),
        title=job.title,
        description=job.description,
        status=job.status,
        created_at=job.created_at.isoformat()
    )

@router.get("", response_model=List[JobResponse])
async def list_jobs(
    status: Optional[str] = None,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyJobRepository(db)
    jobs = await repo.list_by_organization(session.tenant_id, status=status)
    return [
        JobResponse(
            id=str(j.id),
            organization_id=str(j.organization_id),
            title=j.title,
            description=j.description,
            status=j.status,
            created_at=j.created_at.isoformat()
        )
        for j in jobs
    ]

@router.get("/{id}", response_model=JobResponse)
async def get_job(
    id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyJobRepository(db)
    job_uuid = uuid.UUID(id)
    job = await repo.get_by_id(job_uuid)
    if not job or job.organization_id != session.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobResponse(
        id=str(job.id),
        organization_id=str(job.organization_id),
        title=job.title,
        description=job.description,
        status=job.status,
        created_at=job.created_at.isoformat()
    )

class JobUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    salary_range: Optional[str] = None
    status: Optional[str] = None

@router.patch("/{id}", response_model=JobResponse)
async def update_job(
    id: str,
    payload: JobUpdateRequest,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyJobRepository(db)
    job_uuid = uuid.UUID(id)
    job = await repo.get_by_id(job_uuid)
    if not job or job.organization_id != session.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    if payload.title is not None:
        job.title = payload.title
    if payload.description is not None:
        job.description = payload.description
    if payload.salary_range is not None:
        job.salary_range = payload.salary_range
    if payload.status is not None:
        job.status = payload.status

    await repo.save()
    await db.commit()

    return JobResponse(
        id=str(job.id),
        organization_id=str(job.organization_id),
        title=job.title,
        description=job.description,
        status=job.status,
        created_at=job.created_at.isoformat()
    )

@router.delete("/{id}")
async def delete_job(
    id: str,
    session: UserSession = Depends(get_current_user_session),
    db: AsyncSession = Depends(get_db_session)
):
    repo = SQLAlchemyJobRepository(db)
    job_uuid = uuid.UUID(id)
    job = await repo.get_by_id(job_uuid)
    if not job or job.organization_id != session.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    await repo.delete(job)
    await repo.save()
    await db.commit()
    return {"status": "success", "message": "Job deleted"}
