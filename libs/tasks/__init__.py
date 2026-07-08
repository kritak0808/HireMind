import os
import sys

from celery import Celery

# Ensure sys.path includes all libs so celery worker imports succeed unqualified
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.normpath(os.path.join(here, '..', '..'))

lib_paths = [
    os.path.join(root, 'libs', 'config', 'src'),
    os.path.join(root, 'libs', 'telemetry', 'src'),
    os.path.join(root, 'libs', 'security', 'src'),
    os.path.join(root, 'libs', 'auth', 'src'),
    os.path.join(root, 'libs', 'db-core', 'src'),
    os.path.join(root, 'libs', 'shared-schemas', 'src'),
    os.path.join(root, 'libs', 'events', 'src'),
    os.path.join(root, 'apps', 'api-gateway', 'src'),
]
for p in lib_paths:
    if os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

app = Celery(
    "hiremind_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["libs.tasks.tasks"]
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
