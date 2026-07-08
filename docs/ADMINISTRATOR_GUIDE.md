# HireMind AI Administrator Guide
## SaaS Organization Onboarding & System Setup

This guide assists platform administrators and system operators in managing tenant setups and enterprise plans.

---

## 1. Tenant Organization Onboarding
Administrators can create and configure new organizations through the admin console:
1. Navigate to the **Organizations Panel** (`/dashboard/organizations`).
2. Click **Create Organization** to onboard a new business entity.
3. Once created, invite members using email addresses and assign role permissions (`recruiter` or `hiring_manager`).

---

## 2. Billing & Subscriptions Setup
Tenant usage limits and licensing can be updated under the **Billing Center**:
- **SaaS Plan Management**: Map organizations to tier profiles (Free, Team, Enterprise).
- **Quota Metering**: Track total LLM costs and vector space queries dynamically.
- **Seat Allocation**: Assign and rotate user licenses among team members.

---

## 3. Marketplace & Integrations Setup
System configurations support standard integrations:
- **Webhook Subscriptions**: Subscribe callback endpoints to events like `resume.parsed` and `application.stage_changed`.
- **API Key Management**: Issue and rotate secure API tokens for third-party ATS pipelines.
