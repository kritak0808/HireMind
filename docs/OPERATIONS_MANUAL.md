# HireMind AI Operations Manual
## SRE Runbooks, Alert Handling, & Disaster Recovery

This manual provides incident recovery procedures for platform reliability engineers (SREs).

---

## 1. Alerting Triggers & Resolutions
System telemetry exposes active alerts to Prometheus/Alertmanager.

### Alert: `ServiceDown`
1. **Severity**: Critical.
2. **Action**: Check if the container pod crashed. Run `docker ps` to verify container lifecycles.
3. **Recovery**: Restart the service container:
   ```bash
   docker-compose restart api-gateway
   ```

### Alert: `DatabaseConnectionSaturated`
1. **Severity**: Critical.
2. **Action**: Identify query bottlenecks. Check active links from the **Infra Health** SRE dashboard.
3. **Recovery**: Flush idle pool slots or execute database scaling configurations to assign a read replica.

---

## 2. Disaster Recovery Playbooks

### Runbook 1: PostgreSQL Snapshot Restoration
1. Locate the backup snapshot in the SRE DR Console.
2. Run database snapshot recovery tool or reload using the backup path:
   ```bash
   psql -U hiremind_user -d hiremind_db -f /backups/db-backup-full-latest.sql
   ```

### Runbook 2: Redis Invalidation
- If memory evictions threshold warnings fire, navigate to the **Cache Analytics** SRE page and click **Invalidate All Keys** to clear the cache.
- Alternatively, run `redis-cli FLUSHALL` to clear memory.
