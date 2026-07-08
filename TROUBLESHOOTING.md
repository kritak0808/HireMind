# Troubleshooting Guide

This guide details resolutions for common issues encountered during setup, testing, or local running.

## 1. Power Shell Scripts execution policy error
**Symptom:**
```powershell
File start-local.ps1 cannot be loaded because running scripts is disabled on this system.
```
**Resolution:**
Run Powershell as administrator and enable script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```
Alternatively, bypass policy for the active terminal session:
```powershell
powershell -ExecutionPolicy Bypass -File start-local.ps1
```

## 2. Windows npm/pnpm script execution policy block
**Symptom:**
```powershell
pnpm : File C:\Users\...\AppData\Roaming\npm\pnpm.ps1 cannot be loaded because running scripts is disabled...
```
**Resolution:**
Invoke `pnpm` using its `.cmd` extension to bypass PowerShell script verification:
```powershell
pnpm.cmd install
pnpm.cmd build:web
```

## 3. Python ImportError during pytest collection
**Symptom:**
```
ImportError: cannot import name 'hash_password' from 'security'
```
**Resolution:**
This is caused by split-brain module resolution where Python attempts to load the same namespace from duplicate search paths.
- Ensure `PYTHONPATH` includes the `.src` folders of your libraries.
- Import libraries directly from their low-level modules (e.g. `from crypto import hash_password`) instead of bridging imports if you encounter path resolution loops during unit test collection.

## 4. Docker container pg_isready or healthcheck failures
**Symptom:**
```
postgres service healthy condition not met
```
**Resolution:**
If the database takes too long to initialize:
- Verify that port `5432` is not already occupied by a local PostgreSQL installation.
- Clean up active volume claims:
  ```bash
  docker-compose down -v
  ```
- Restart the containers using:
  ```bash
  docker-compose up --build -d
  ```
