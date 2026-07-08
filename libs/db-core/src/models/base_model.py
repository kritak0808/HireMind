"""
base_model.py — Re-exports Base and TenantModelMixin from db.py
for use within the models package without needing relative parent imports.
"""
from db import Base, TenantModelMixin

__all__ = ["Base", "TenantModelMixin"]
