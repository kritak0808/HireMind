import logging
from typing import Any, Dict, Optional

from pydantic import BaseModel
from security import ROLE_PERMISSIONS, UserSession

logger = logging.getLogger("hiremind.security.policy_engine")

class ResourceContext(BaseModel):
    resource_type: str # e.g. "application", "job", "apikey"
    owner_id: Optional[str] = None
    organization_id: Optional[str] = None
    properties: Dict[str, Any] = {}

class EnvironmentContext(BaseModel):
    client_ip: Optional[str] = None
    user_agent: Optional[str] = None
    is_trusted_device: bool = False

class PolicyEngine:
    """
    Combines Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC)
    to perform authorization checks on resources.
    """

    @classmethod
    def evaluate(
        cls,
        session: UserSession,
        action: str, # e.g. "jobs:write", "evals:read"
        resource: Optional[ResourceContext] = None,
        env: Optional[EnvironmentContext] = None
    ) -> bool:
        # 1. Platform Admin and Org Admin bypass checks inside their organizations
        if "platform_admin" in session.roles:
            return True
        if "org_admin" in session.roles:
            # Check tenant alignment if resource context is present
            if resource and resource.organization_id and resource.organization_id != session.tenant_id:
                logger.warn(f"Org Admin {session.user_id} blocked: tenant mismatch")
                return False
            return True

        # 2. RBAC check (Is the permission associated with their roles?)
        has_permission = False
        for role in session.roles:
            permissions = ROLE_PERMISSIONS.get(role, [])
            if action in permissions:
                has_permission = True
                break

        if not has_permission:
            logger.debug(f"RBAC failed: User {session.user_id} lacks permission {action}")
            return False

        # 3. ABAC checks (Attributes constraints evaluation)
        if resource:
            # Rule A: Tenant Scope Enforcement
            if resource.organization_id and resource.organization_id != session.tenant_id:
                logger.warn("ABAC failed: Tenant ID mismatch on resource")
                return False

            # Rule B: Resource Ownership Enforcement
            if "owner_only" in resource.properties:
                if resource.owner_id and resource.owner_id != session.user_id:
                    logger.debug(f"ABAC failed: User {session.user_id} is not the resource owner")
                    return False

        # 4. Environmental context checks
        if env:
            # Rule C: Limit high-sensitive operations (like billing/API keys delete) to trusted devices
            if action in ["tenant:write", "apikey:delete"] and not env.is_trusted_device:
                logger.warn(f"ABAC failed: High-security action {action} blocked on untrusted device")
                return False

        logger.info(f"Policy evaluation passed: User {session.user_id} authorized for {action}")
        return True
