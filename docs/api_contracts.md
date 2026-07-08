# HireMind AI: REST API Contracts & Endpoint Specifications

This document outlines the OpenAPI routing specifications, parameters formats, response structures, and error payloads for HireMind AI.

---

## 1. REST API Routing Strategy & Conventions

### 1.1 Base URL
All API calls are versioned inside the URI namespace path:
```
https://api.hiremind.ai/api/v1/
```

### 1.2 HTTP Verbs & Semantics
- **GET:** Retrieve resources. Must be idempotent and safe.
- **POST:** Create a new resource, or trigger state operations (e.g. `POST /api/v1/interviews/{id}/start`).
- **PUT:** Overwrite a resource completely.
- **PATCH:** Partial resource updates.
- **DELETE:** Remove resources (triggers soft delete).

### 1.3 Tenant Scoping
Recruiter-level requests are routed by including the tenant context header:
- Header name: `X-Tenant-ID` (UUID format, automatically validated by Gateway middleware).

---

## 2. Standard Query Parameters (Pagination, Filters, & Sorting)

To handle large applicant volumes, standard listing paths must configure:

```
GET /api/v1/jobs?page=1&limit=25&sort_by=created_at&sort_direction=desc&filter_status=open
```

### 2.1 Schema Breakdown
- **`page`:** Page index (1-based, default `1`).
- **`limit`:** Max items per page (default `25`, ceiling `100`).
- **`sort_by`:** Database column to sort (default `created_at`).
- **`sort_direction`:** Direction (`asc` or `desc`).
- **`filter_[key]`:** Dynamic query parameters corresponding to entity states (e.g. `filter_status=open`).

---

## 3. Global Schema Frameworks

### 3.1 Standard Response Metadata (Pagination)
```json
{
  "data": [],
  "metadata": {
    "current_page": 1,
    "limit": 25,
    "total_pages": 4,
    "total_count": 87,
    "has_next": true,
    "has_prev": false
  }
}
```

### 3.2 Error Payload Schema
Consistent error envelopes simplify client handling. In case of validation or system faults:
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The payload content failed schema constraints validation.",
    "request_id": "8432a-bc32-1234-5678-890123abc",
    "details": [
      {
        "field": "email",
        "issue": "Invalid email formatting pattern"
      }
    ]
  }
}
```

---

## 4. Endpoints Specifications by Domain

### 4.1 Domain: Identity & Access Management (IAM)
- **POST `/api/v1/auth/register`**
  - *Purpose:* Register a new user.
  - *Request:* `UserRegister` (email, password, first_name, last_name).
  - *Response (201):* User profile metadata.
- **POST `/api/v1/auth/token`**
  - *Purpose:* OAuth2 token generation.
  - *Request:* Form URL-Encoded (`username`, `password`).
  - *Response (200):* `TokenResponse` (access_token, token_type).

### 4.2 Domain: Job Management
- **POST `/api/v1/jobs`**
  - *Purpose:* Create an open job post.
  - *Headers:* `X-Tenant-ID`
  - *Request:* `JobCreate` (title, description, hiring_manager_id).
  - *Response (210):* Job metadata payload.
- **GET `/api/v1/jobs`**
  - *Purpose:* List jobs with filtering and pagination.
  - *Headers:* `X-Tenant-ID`
  - *Response (200):* Paginated job resources list.

### 4.3 Domain: Candidate Pipeline
- **POST `/api/v1/candidates/{id}/resume`**
  - *Purpose:* Upload candidate resume file.
  - *Request:* Form-data (File payload).
  - *Response (202):* Resume version identifier and parse task tracking ticket.
- **GET `/api/v1/candidates/{id}/rankings`**
  - *Purpose:* Fetch candidate rankings relative to job applicant pools.
  - *Response (200):* Match indexes list.

### 4.4 Domain: Interview Engine
- **POST `/api/v1/interviews`**
  - *Purpose:* Schedule an interview session.
  - *Request:* Interview parameters (application_id, session_type).
  - *Response (201):* Scheduled session metadata.
- **POST `/api/v1/interviews/{id}/signal`**
  - *Purpose:* WebRTC signaling handshake.
  - *Request:* WebRTC Session Description (SDP offer).
  - *Response (200):* WebRTC Answer (SDP answer).
