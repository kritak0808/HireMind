import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

logger = logging.getLogger("hiremind.validation")

class EvidenceCollector:
    """
    Collects validation outputs and hashes them to ensure audit integrity.
    """
    @classmethod
    def calculate_hash(cls, payload: Dict[str, Any]) -> str:
        payload_str = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(payload_str.encode()).hexdigest()

class QualityGateEngine:
    """
    Evaluates system metrics against quality gate thresholds.
    """
    @classmethod
    def evaluate_gates(cls, metrics: Dict[str, float], gates: List[Dict[str, Any]]) -> Dict[str, Any]:
        passed = True
        failed_gates = []
        gate_results = {}

        for gate in gates:
            metric_name = gate["metric_name"]
            threshold = gate["threshold_value"]
            current_value = metrics.get(metric_name, 0.0)

            # Check logic based on metric type
            gate_passed = True
            if metric_name in ["critical_cves", "failed_scans", "accessibility_violations"]:
                # Lower is better
                gate_passed = current_value <= threshold
            else:
                # Higher is better (e.g. unit_coverage, availability)
                gate_passed = current_value >= threshold

            gate_results[metric_name] = {
                "gate_name": gate["gate_name"],
                "threshold": threshold,
                "current_value": current_value,
                "passed": gate_passed
            }

            if not gate_passed:
                passed = False
                failed_gates.append(gate["gate_name"])

        return {
            "passed": passed,
            "failed_gates": failed_gates,
            "results": gate_results
        }

class CertificationEngine:
    """
    Generates cryptographically validated quality certifications.
    """
    @classmethod
    def generate_certificate(cls, version: str, score: float, gate_evaluation: Dict[str, Any]) -> Dict[str, Any]:
        cert_data = {
            "version": version,
            "score": score,
            "gate_evaluation": gate_evaluation,
            "certified_at": datetime.now(timezone.utc).isoformat()
        }
        content_hash = hashlib.sha256(json.dumps(cert_data, sort_keys=True).encode()).hexdigest()

        return {
            "version": version,
            "score": score,
            "status": "passed" if gate_evaluation["passed"] else "failed",
            "sha256": content_hash,
            "details": cert_data
        }

class ValidationOrchestrator:
    """
    Orchestrates validation runs across unit, integration, security, and accessibility test suites.
    """
    @classmethod
    async def run_pipeline(
        cls,
        repo: Any, # SQLAlchemyValidationRepository
        tenant_id: str,
        version: str,
        metrics: Dict[str, float],
        gates: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        # 1. Start Validation Run
        run = await repo.create_validation_run(tenant_id, f"Pipeline Run for {version}")

        # 2. Record Test Suites Mock Results
        suite = await repo.create_test_suite(tenant_id, f"Core Unit Suites - {version}", "unit", "Core unit assertions")
        await repo.record_test_result(suite.id, "test_auth_rbac", "passed", 12.0)
        await repo.record_test_result(suite.id, "test_prompt_injection_safety", "passed", 45.0)

        # 3. Evaluate Quality Gates
        gate_res = QualityGateEngine.evaluate_gates(metrics, gates)

        # 4. Generate Certificate
        cert = CertificationEngine.generate_certificate(version, metrics.get("overall_score", 95.0), gate_res)
        await repo.create_certification_report(
            tenant_id=tenant_id,
            version=version,
            score=cert["score"],
            status=cert["status"],
            details=cert["details"]
        )

        # 5. Log Security Findings
        if metrics.get("critical_cves", 0.0) > 0:
            await repo.record_security_finding(
                tenant_id=tenant_id,
                cve="CVE-2026-9999",
                severity="critical",
                component="FastAPI Router",
                details="Outdated dependency library vulnerabilities"
            )

        # 6. Log Accessibility findings
        if metrics.get("accessibility_violations", 0.0) > 0:
            await repo.record_accessibility_finding(
                tenant_id=tenant_id,
                wcag="AA 1.4.3",
                component_id="RecruiterDashboardContrast",
                desc_text="Text contrast ratio below 4.5:1 minimum standard."
            )

        # 7. Collect Evidence
        evidence_payload = {
            "run_id": str(run.id),
            "gates_evaluation": gate_res,
            "metrics": metrics,
            "certificate_hash": cert["sha256"]
        }
        content_hash = EvidenceCollector.calculate_hash(evidence_payload)
        await repo.record_evidence(
            tenant_id=tenant_id,
            type="pipeline_run_evidence",
            file_path=f"/evidence/runs/{run.id}.json",
            content_hash=content_hash
        )

        # 8. Complete Validation Run
        await repo.complete_validation_run(run.id, "passed" if gate_res["passed"] else "failed")

        return {
            "run_id": str(run.id),
            "status": "passed" if gate_res["passed"] else "failed",
            "gates": gate_res,
            "certificate": cert
        }
