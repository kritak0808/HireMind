# API Specifications & Contracts

This document contains key HTTP contracts exposed by the HireMind AI API Gateway on port `8000`.

## 1. Authentication Endpoints

### Register User
- **Route:** `POST /api/v1/auth/register`
- **Request Payload:**
  ```json
  {
    "email": "recruiter@acme.com",
    "password": "SecurePassword123",
    "first_name": "Jane",
    "last_name": "Doe"
  }
  ```
- **Response:**
  ```json
  {
    "id": "e4f5092a-e24c-473d-82d2-c5188bdc6d2c",
    "email": "recruiter@acme.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "is_active": true,
    "created_at": "2026-07-04T12:00:00.000Z"
  }
  ```

### Login / Token Acquisition
- **Route:** `POST /api/v1/auth/login`
- **Request Payload:**
  ```json
  {
    "email": "recruiter@acme.com",
    "password": "SecurePassword123"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```

---

## 2. Resume & ATS Analysis Endpoints

### Upload Candidate Resume
- **Route:** `POST /api/v1/resumes/upload`
- **Query Parameter:** `candidate_id` (UUID string)
- **Content-Type:** `multipart/form-data`
- **Request Payload:** file attachment
- **Response:**
  ```json
  {
    "id": "d04a6012-70b3-4f9e-a0e2-63b7e732ad14",
    "file_name": "Jane_Doe_CV.pdf",
    "processing_status": "parsed",
    "created_at": "2026-07-04T12:05:00.000Z"
  }
  ```

### Get ATS Matching Score
- **Route:** `GET /api/v1/resumes/{resume_id}/ats-report/{job_id}`
- **Response:**
  ```json
  {
    "overall_score": 88,
    "score_skills": 85,
    "score_relevance": 90,
    "score_formatting": 92
  }
  ```

### Get Extracted Resume Details
- **Route:** `GET /api/v1/resumes/{resume_id}/extractions`
- **Response:**
  ```json
  {
    "email": "candidate_0@gmail.com",
    "phone": "+1-555-019-000",
    "linkedin": "linkedin.com/in/candidate_0",
    "github": "github.com/candidate_0",
    "experience": "Lead Engineer, 5 years.",
    "education": "M.S. in Computer Science",
    "certifications": "AWS Solutions Architect",
    "languages": "English, Spanish",
    "matching_keywords": ["python", "fastapi", "react"],
    "missing_keywords": ["kubernetes"],
    "strengths": "Solid backend system design and coding practices.",
    "weaknesses": "Minimal direct container orchestration experience."
  }
  ```

---

## 3. Coding Sandboxes Endpoints

### Compile Code
- **Route:** `POST /api/v1/coding/compile`
- **Request Payload:**
  ```json
  {
    "assessment_id": "8bbca61c-80b1-4f11-b0e2-63b7e732ad14",
    "candidate_id": "e4f5092a-e24c-473d-82d2-c5188bdc6d2c",
    "code": "def match(x): return x == 42",
    "language": "python"
  }
  ```
- **Response:**
  ```json
  {
    "submission_id": "c104a6012-70b3-4f9e-a0e2-63b7e732ad14",
    "status": "success",
    "logs": "Compilation succeeded. Code size: 245 bytes."
  }
  ```
