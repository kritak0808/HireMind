# HireMind AI Engine Guide
## LLM Prompt Engineering, Vector Embeddings, & Drift Monitoring

This guide provides details on prompt templates versioning, model ratings, and alignment tracking.

---

## 1. Prompt Templates Versioning
AI execution runs are tracked via templates:
- Templates are defined in `PromptTemplate`.
- Active edits create new iterations in `PromptVersion` database tables, preventing runtime regression.
- Templates are loaded dynamically from relational cache boundaries to minimize latency.

---

## 2. Token Pricing Ratings
Semantic costs track exact pricing metrics per model rate per million tokens:

| Model Name | Input rate (per 1M) | Output rate (per 1M) |
| :--- | :--- | :--- |
| **gpt-4o** | $5.00 | $15.00 |
| **gemini-1.5-pro** | $3.50 | $10.50 |
| **gemini-2.0-flash** | $0.075 | $0.30 |
| **claude-3-opus** | $15.00 | $75.00 |

---

## 3. Drift Evaluation Calculations
To monitor candidate evaluations alignment over time, we calculate drift scores:
- **Cosine Distance**: Evaluates candidates vector drift score variations between 0.0 (aligned) and 1.0 (maximum drift).
- **PSI Distribution**: Evaluates population stability score parameters between historical and current candidate ratings distributions. A score > 0.2 indicates significant drift, prompting template review.
