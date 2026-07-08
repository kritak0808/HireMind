from typing import Any, Dict

from events import BaseEvent
from pydantic import Field


class OrganizationCreatedEvent(BaseEvent):
    event_type: str = "organization.created"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: organization_id, name, creator_id"
    )

class UserRegisteredEvent(BaseEvent):
    event_type: str = "user.registered"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: user_id, email, selected_role"
    )

class ResumeUploadedEvent(BaseEvent):
    event_type: str = "resume.uploaded"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: candidate_id, resume_id, s3_key, file_name"
    )

class ResumeAnalyzedEvent(BaseEvent):
    event_type: str = "resume.analyzed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: candidate_id, resume_id, extracted_skills, years_experience"
    )

class ApplicationSubmittedEvent(BaseEvent):
    event_type: str = "application.submitted"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: application_id, job_id, candidate_id"
    )

class InterviewStartedEvent(BaseEvent):
    event_type: str = "interview.started"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: session_id, application_id, webrtc_room_id"
    )

class CodingAssessmentCompletedEvent(BaseEvent):
    event_type: str = "coding_assessment.completed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: submission_id, session_id, score, compile_status"
    )

class JobCreatedEvent(BaseEvent):
    event_type: str = "job.created"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: job_id, title, organization_id, creator_id"
    )

class JobPublishedEvent(BaseEvent):
    event_type: str = "job.published"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: job_id, organization_id"
    )

class PipelineStageChangedEvent(BaseEvent):
    event_type: str = "pipeline.stage_changed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: application_id, old_stage, new_stage, reason"
    )

class OfferAcceptedEvent(BaseEvent):
    event_type: str = "offer.accepted"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: offer_id, application_id, organization_id, salary"
    )

class ResumeValidatedEvent(BaseEvent):
    event_type: str = "resume.validated"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: resume_id, file_hash, file_name"
    )

class ResumeParsedEvent(BaseEvent):
    event_type: str = "resume.parsed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: resume_id, candidate_id, text_length"
    )

class ATSScoredEvent(BaseEvent):
    event_type: str = "resume.ats_scored"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: evaluation_id, resume_id, job_id, overall_score"
    )

class ResumeMatchedEvent(BaseEvent):
    event_type: str = "resume.matched"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: resume_id, job_id, match_score"
    )

class CandidateRankedEvent(BaseEvent):
    event_type: str = "candidate.ranked"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: candidate_id, job_id, calculated_score"
    )

class RecommendationGeneratedEvent(BaseEvent):
    event_type: str = "candidate.recommendation_generated"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: candidate_id, job_id, overall_recommendation"
    )

class TalentPoolUpdatedEvent(BaseEvent):
    event_type: str = "talent_pool.updated"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: pool_id, candidate_id, action"
    )

class InterviewPlannedEvent(BaseEvent):
    event_type: str = "interview.planned"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: plan_id, job_id, title"
    )

class QuestionGeneratedEvent(BaseEvent):
    event_type: str = "interview.question_generated"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: question_id, session_id, sequence_number"
    )

class CandidateRespondedEvent(BaseEvent):
    event_type: str = "interview.candidate_responded"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: response_id, question_id, session_id"
    )

class InterviewAdaptedEvent(BaseEvent):
    event_type: str = "interview.adapted"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: session_id, adaptation_reason"
    )

class InterviewEvaluatedEvent(BaseEvent):
    event_type: str = "interview.evaluated"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: evaluation_id, session_id, overall_score"
    )

class InterviewCompletedEvent(BaseEvent):
    event_type: str = "interview.completed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: session_id, completed_at"
    )

class MediaSessionCreatedEvent(BaseEvent):
    event_type: str = "media.session_created"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: media_session_id, webrtc_room_id"
    )

class RecordingStartedEvent(BaseEvent):
    event_type: str = "media.recording_started"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: recording_id, session_id, s3_key"
    )

class TranscriptUpdatedEvent(BaseEvent):
    event_type: str = "media.transcript_updated"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: session_id, speaker_id, text"
    )

class MediaArchivedEvent(BaseEvent):
    event_type: str = "media.archived"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: session_id, s3_key"
    )

class SubmissionReceivedEvent(BaseEvent):
    event_type: str = "coding.submission_received"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: submission_id, candidate_id, language"
    )

class CompilationCompletedEvent(BaseEvent):
    event_type: str = "coding.compilation_completed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: submission_id, status, error_msg"
    )

class ExecutionCompletedEvent(BaseEvent):
    event_type: str = "coding.execution_completed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: submission_id, execution_result_id, status"
    )

class PlagiarismAnalysisCompletedEvent(BaseEvent):
    event_type: str = "coding.plagiarism_completed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: submission_id, similarity_score"
    )

class CopilotSessionStartedEvent(BaseEvent):
    event_type: str = "copilot.session_started"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: copilot_session_id, recruiter_id"
    )

class IntentRecognizedEvent(BaseEvent):
    event_type: str = "copilot.intent_recognized"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: copilot_session_id, user_text, intent"
    )

class WorkflowPlannedEvent(BaseEvent):
    event_type: str = "copilot.workflow_planned"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: workflow_execution_id, workflow_type"
    )

class AutomationExecutedEvent(BaseEvent):
    event_type: str = "copilot.automation_executed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: rule_id, trigger_event"
    )

class MetricsAggregatedEvent(BaseEvent):
    event_type: str = "analytics.metrics_aggregated"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: kpi_name, computed_value"
    )

class ForecastGeneratedEvent(BaseEvent):
    event_type: str = "analytics.forecast_generated"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: target_kpi, predicted_value"
    )

class TrendDetectedEvent(BaseEvent):
    event_type: str = "analytics.trend_detected"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: trend_name, confidence"
    )

class AnomalyDetectedEvent(BaseEvent):
    event_type: str = "analytics.anomaly_detected"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: kpi_name, variance_percentage"
    )

class SubscriptionChangedEvent(BaseEvent):
    event_type: str = "enterprise.subscription_changed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: organization_id, plan_name, seat_limit"
    )

class IntegrationInstalledEvent(BaseEvent):
    event_type: str = "enterprise.integration_installed"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: organization_id, connector_type"
    )

class WebhookDeliveredEvent(BaseEvent):
    event_type: str = "enterprise.webhook_delivered"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: endpoint_id, event_type, status_code"
    )

class FeatureEnabledEvent(BaseEvent):
    event_type: str = "enterprise.feature_enabled"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: organization_id, flag_key, is_enabled"
    )

class InvoiceGeneratedEvent(BaseEvent):
    event_type: str = "enterprise.invoice_generated"
    payload: Dict[str, Any] = Field(
        ...,
        description="Keys: organization_id, amount_paid, stripe_invoice_id"
    )

