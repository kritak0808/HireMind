"""
path_setup.py — Adds all HireMind library src/ directories to sys.path
so that Python can import them by their unqualified names.

This module is imported first in main.py and in every router file.
"""
import os
import sys


def setup_lib_paths():
    """Inject all lib src directories into sys.path."""
    here = os.path.dirname(os.path.abspath(__file__))
    # src/ -> api-gateway/ -> apps/ -> root/
    root = os.path.normpath(os.path.join(here, '..', '..', '..'))

    lib_src_dirs = [
        os.path.join(root, 'libs'),
        os.path.join(root, 'libs', 'config', 'src'),
        os.path.join(root, 'libs', 'telemetry', 'src'),
        os.path.join(root, 'libs', 'security', 'src'),
        os.path.join(root, 'libs', 'auth', 'src'),
        os.path.join(root, 'libs', 'db-core', 'src'),  # 'models' and 'repositories' are packages here
        os.path.join(root, 'libs', 'shared-schemas', 'src'),  # 'dtos' is a package here
        os.path.join(root, 'libs', 'events', 'src'),
        # Add the src/ dir itself so routers can import path_setup
        here,
    ]

    for d in lib_src_dirs:
        if os.path.isdir(d) and d not in sys.path:
            sys.path.insert(0, d)

# Run immediately on import
setup_lib_paths()
