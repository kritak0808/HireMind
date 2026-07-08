import importlib.abc
import importlib.util
import os
import sys
from importlib.machinery import SourceFileLoader

# Ensure workspace root is in python path
workspace_root = "c:\\Users\\krita\\Documents\\HireMind"
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

# Inject all lib src/ directories so bare imports like 'from models import ...'
# resolve correctly — same logic as path_setup.py used at runtime.
_lib_src_dirs = [
    os.path.join(workspace_root, "libs"),
    os.path.join(workspace_root, "libs", "config", "src"),
    os.path.join(workspace_root, "libs", "telemetry", "src"),
    os.path.join(workspace_root, "libs", "security", "src"),
    os.path.join(workspace_root, "libs", "auth", "src"),
    os.path.join(workspace_root, "libs", "db-core", "src"),
    os.path.join(workspace_root, "libs", "shared-schemas", "src"),
    os.path.join(workspace_root, "libs", "events", "src"),
    os.path.join(workspace_root, "apps", "api-gateway", "src"),
]
for _d in _lib_src_dirs:
    if os.path.isdir(_d) and _d not in sys.path:
        sys.path.insert(0, _d)

# Helper function to rewrite source code imports at compile time
def rewrite_source(content: str, path: str) -> str:
    modified = content
    # Step 1: Normalize dashes to underscores
    modified = modified.replace('libs.db-core', 'libs.db_core')
    modified = modified.replace('apps.api-gateway', 'apps.api_gateway')
    modified = modified.replace('apps.agent-orchestrator', 'apps.agent_orchestrator')
    modified = modified.replace('apps.sandbox-executor', 'apps.sandbox_executor')

    # Step 2: Strip intermediate '.src' from package paths
    modified = modified.replace('libs.config.src.', 'libs.config.')
    modified = modified.replace('libs.db_core.src.', 'libs.db_core.')
    modified = modified.replace('libs.security.src.', 'libs.security.')
    modified = modified.replace('libs.telemetry.src.', 'libs.telemetry.')
    modified = modified.replace('libs.auth.src.', 'libs.auth.')
    modified = modified.replace('libs.events.src.', 'libs.events.')
    modified = modified.replace('libs.shared_schemas.src.', 'libs.shared_schemas.')
    modified = modified.replace('libs.shared-schemas.src.', 'libs.shared_schemas.')
    modified = modified.replace('libs.shared-schemas', 'libs.shared_schemas')
    modified = modified.replace('apps.api_gateway.src.', 'apps.api_gateway.')

    if content != modified:
        print(f"[conftest rewrite] -> Normalized imports in: {path}")
    return modified

# Patch standard SourceFileLoader
_original_get_data = SourceFileLoader.get_data

def patched_get_data(self, path):
    data = _original_get_data(self, path)
    if path.endswith('.py') and ('HireMind' in path or 'hiremind' in path.lower()) and 'conftest.py' not in path:
        try:
            content = data.decode('utf-8')
            modified = rewrite_source(content, path)
            return modified.encode('utf-8')
        except Exception:
            return data
    return data

SourceFileLoader.get_data = patched_get_data

# Custom workspace import hook
class CustomWorkspaceFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        mappings = {
            "libs.config": "libs/config/src",
            "libs.db_core": "libs/db-core/src",
            "libs.db-core": "libs/db-core/src",
            "libs.security": "libs/security/src",
            "libs.telemetry": "libs/telemetry/src",
            "libs.auth": "libs/auth/src",
            "libs.events": "libs/events/src",
            "libs.shared_schemas": "libs/shared-schemas/src",
            "libs.shared-schemas": "libs/shared-schemas/src",
            "apps.api_gateway": "apps/api-gateway/src",
            "apps.api-gateway": "apps/api-gateway/src"
        }

        for prefix, rel_dir in mappings.items():
            if fullname == prefix or fullname.startswith(prefix + "."):
                sub_path = fullname[len(prefix):].replace(".", "/")
                target_dir = os.path.join(workspace_root, rel_dir)

                # Check for packages and modules
                init_path = os.path.join(target_dir + sub_path, "__init__.py")
                mod_path = os.path.join(target_dir + sub_path + ".py")

                file_path = None
                is_package = False
                if os.path.exists(init_path):
                    file_path = init_path
                    is_package = True
                elif os.path.exists(mod_path):
                    file_path = mod_path

                if file_path:
                    loader = SourceFileLoader(fullname, file_path)
                    spec = importlib.util.spec_from_file_location(
                        fullname,
                        file_path,
                        loader=loader,
                        submodule_search_locations=[os.path.dirname(file_path)] if is_package else None
                    )
                    return spec
        return None

# Register CustomWorkspaceFinder at the front of meta_path
sys.meta_path.insert(0, CustomWorkspaceFinder())
print("[DashImportHook] CustomWorkspaceFinder registered and active.")
