# Local Demo Guide

Follow these steps to demonstrate HireMind AI features:

## 1. Populate Candidate Profiles
Go to the **Operations Command Center** at `http://localhost:3000/dashboard/deployment/command` and trigger the seeding action. Alternatively, trigger seeding via Curl:
```bash
curl -X POST http://localhost:8000/api/v1/deployment/simulate/seed
```
This loads 1,000 candidates and 100 job listings into the PostgreSQL instance.

## 2. Check Candidate Rankings
Navigate to the Candidate Intelligence page to check AI resume recommendations based on the populated mock data profiles.
