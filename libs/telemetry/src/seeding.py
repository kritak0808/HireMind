import logging
import uuid
from typing import Dict

from crypto import hash_password
from models import (
    AICostRecord,
    Application,
    CandidateProfile,
    CodingAssessment,
    InterviewSession,
    JobPosting,
    ModelProvider,
    Organization,
    OrganizationMembership,
    PromptTemplate,
    PromptVersion,
    ResumeFile,
    User,
    WebhookEndpoint,
)

logger = logging.getLogger("hiremind.seeding")

class DemoDataSeeder:
    """
    Utility class to seed local database environments with realistic mock hiring platform data.
    """
    @classmethod
    async def seed_all(cls, session) -> Dict[str, int]:
        logger.info("Initializing database seeding with realistic mock data...")

        # Pre-compute valid password hash once to maintain fast seeding performance
        hashed_password = hash_password("password123")

        # 1. Seed 5 Organizations
        org_ids = []
        org_names = ["Acme Corporation", "Tech Giants Inc", "Health Intelligence", "FinTech Solutions", "Retail Hub"]
        for name in org_names:
            org = Organization(id=uuid.uuid4(), name=name)
            session.add(org)
            org_ids.append(org.id)
        await session.flush()

        # 2. Seed 25 Recruiters & 15 Hiring Managers (total 40 users)
        recruiter_count = 0
        manager_count = 0

        for i in range(40):
            is_recruiter = i < 25
            role_name = "recruiter" if is_recruiter else "hiring_manager"
            email = f"user{i}@hiremind.ai"
            user = User(
                id=uuid.uuid4(),
                email=email,
                password_hash=hashed_password,
                first_name=f"UserFirst_{i}",
                last_name=f"UserLast_{i}",
                is_active=True
            )
            session.add(user)
            await session.flush()

            org_id = org_ids[i % len(org_ids)]
            member = OrganizationMembership(
                id=uuid.uuid4(),
                organization_id=org_id,
                user_id=user.id,
                role=role_name
            )
            session.add(member)

            if is_recruiter:
                recruiter_count += 1
            else:
                manager_count += 1
        await session.flush()

        # 3. Seed 100 Job Openings
        job_ids = []
        for i in range(100):
            org_id = org_ids[i % len(org_ids)]
            job = JobPosting(
                id=uuid.uuid4(),
                organization_id=org_id,
                title=f"Software Engineer role level {i % 5 + 1}",
                description="Developing enterprise solutions.",
                status="open"
            )
            session.add(job)
            job_ids.append(job.id)
        await session.flush()

        # 4. Seed 1000 Candidates & 400 Applications
        candidate_ids = []
        application_ids = []
        app_count = 0
        for i in range(1000):
            user = User(
                id=uuid.uuid4(),
                email=f"candidate_{i}@gmail.com",
                password_hash=hashed_password,
                first_name=f"Candidate_First_{i}",
                last_name=f"Candidate_Last_{i}",
                is_active=True
            )
            session.add(user)
            await session.flush()

            cand = CandidateProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                phone_number=f"+1-555-019{i:03d}"
            )
            session.add(cand)
            await session.flush()
            candidate_ids.append(cand.id)

            if i < 400:
                job_id = job_ids[i % len(job_ids)]
                org_id = org_ids[i % len(org_ids)]
                app = Application(
                    id=uuid.uuid4(),
                    organization_id=org_id,
                    job_id=job_id,
                    candidate_id=cand.id,
                    current_stage="screening",
                    stage_status="pending"
                )
                session.add(app)
                await session.flush()
                application_ids.append(app.id)
                app_count += 1
        await session.flush()

        # 5. Seed 250 Resume Uploads
        resume_count = 0
        for i in range(250):
            cand_id = candidate_ids[i % len(candidate_ids)]
            org_id = org_ids[i % len(org_ids)]
            res = ResumeFile(
                id=uuid.uuid4(),
                organization_id=org_id,
                candidate_id=cand_id,
                file_name=f"candidate_resume_{i}.pdf",
                s3_key=f"resumes/resume_{i}.pdf",
                file_size_bytes=10240,
                processing_status="parsed"
            )
            session.add(res)
            resume_count += 1
        await session.flush()

        # 6. Seed 150 Interview Schedules mapped to applications
        interview_count = 0
        for i in range(150):
            app_id = application_ids[i % len(application_ids)]
            session_rec = InterviewSession(
                id=uuid.uuid4(),
                application_id=app_id,
                session_type="voice_technical",
                status="scheduled",
                webrtc_room_id=f"room-id-{i}"
            )
            session.add(session_rec)
            interview_count += 1
        await session.flush()

        # 7. Seed 120 Coding Assessments
        coding_count = 0
        for i in range(120):
            job_id = job_ids[i % len(job_ids)]
            org_id = org_ids[i % len(org_ids)]
            assessment = CodingAssessment(
                id=uuid.uuid4(),
                organization_id=org_id,
                job_id=job_id,
                title=f"Core Algorithms Coding Challenge {i}",
                problem_description="Solve matching algorithms logic.",
                time_limit_seconds=1800,
                memory_limit_mb=512
            )
            session.add(assessment)
            coding_count += 1
        await session.flush()

        # 8. Seed AI prompt templates, webhooks, and billing records
        prompt = PromptTemplate(
            id=uuid.uuid4(),
            name="resume_evaluation",
            description="LLM template evaluating parsing match levels"
        )
        session.add(prompt)
        await session.flush()

        pv = PromptVersion(
            id=uuid.uuid4(),
            template_id=prompt.id,
            version_number=1,
            template_content="Score candidate details match."
        )
        session.add(pv)

        # Seed Model Providers
        providers = [
            {"provider_name": "openai", "model_name": "gpt-4o", "input_cost": 5.0, "output_cost": 15.0},
            {"provider_name": "gemini", "model_name": "gemini-1.5-pro", "input_cost": 3.5, "output_cost": 10.5},
            {"provider_name": "gemini", "model_name": "gemini-2.0-flash", "input_cost": 0.075, "output_cost": 0.3},
            {"provider_name": "anthropic", "model_name": "claude-3-opus", "input_cost": 15.0, "output_cost": 75.0},
        ]
        for p in providers:
            prov_rec = ModelProvider(
                id=uuid.uuid4(),
                provider_name=p["provider_name"],
                model_name=p["model_name"],
                input_cost_per_million=p["input_cost"],
                output_cost_per_million=p["output_cost"],
                is_active=True
            )
            session.add(prov_rec)

        wh = WebhookEndpoint(
            id=uuid.uuid4(),
            organization_id=org_ids[0],
            url_callback="https://client-webhook.acme.com/receive",
            secret_signature="token-signature",
            events_subscribed=["resume.uploaded"]
        )
        session.add(wh)

        cost = AICostRecord(
            organization_id=org_ids[0],
            model_name="gemini-1.5-pro",
            prompt_tokens=1200,
            completion_tokens=450,
            total_cost=0.015,
            purpose="resume_evaluation"
        )
        session.add(cost)
        await session.flush()

        logger.info("Database seeding successfully complete.")
        return {
            "organizations_seeded": len(org_ids),
            "recruiters_seeded": recruiter_count,
            "hiring_managers_seeded": manager_count,
            "candidates_seeded": len(candidate_ids),
            "jobs_seeded": len(job_ids),
            "applications_seeded": app_count,
            "resumes_seeded": resume_count,
            "interviews_seeded": interview_count,
            "coding_assessments_seeded": coding_count
        }
