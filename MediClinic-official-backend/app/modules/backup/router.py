import gzip
import logging
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict
from urllib.parse import urlparse, urlunparse

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import FileResponse

from app.modules.auth.service import get_current_admin
from app.db import DATABASE_URL

logger = logging.getLogger(__name__)
router = APIRouter(tags=["backup"])

_backup_rate_limit: Dict[int, datetime] = {}
_RATE_LIMIT_WINDOW = timedelta(minutes=1)


def _get_postgres_command(output_path: Path) -> tuple[list[str], Dict[str, str]]:
    if DATABASE_URL.startswith("postgresql+asyncpg://"):
        postgres_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        postgres_url = DATABASE_URL
    else:
        raise RuntimeError("Backup is only supported for PostgreSQL databases.")

    parsed = urlparse(postgres_url)
    if parsed.scheme not in {"postgresql", "postgres"}:
        raise RuntimeError("Unsupported database scheme for backup.")

    env = os.environ.copy()
    if parsed.password:
        env["PGPASSWORD"] = parsed.password

    user_host = parsed.netloc
    if parsed.password:
        user_host = parsed.netloc.replace(f":{parsed.password}", "")

    clean_url = urlunparse(parsed._replace(netloc=user_host))
    return ["pg_dump", clean_url, "-F", "p", "-f", str(output_path)], env


def _check_rate_limit(doctor_id: int) -> None:
    now = datetime.utcnow()
    last = _backup_rate_limit.get(doctor_id)
    if last and now - last < _RATE_LIMIT_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Backup requests are limited to one per minute.",
        )
    _backup_rate_limit[doctor_id] = now


def _remove_temp_files(paths: list[Path]) -> None:
    for path in paths:
        try:
            if path.exists():
                path.unlink()
        except Exception:
            pass


def _remove_temp_dir(tmpdir: Path) -> None:
    try:
        if tmpdir.exists():
            shutil.rmtree(tmpdir)
    except Exception:
        pass


@router.post("/local")
async def download_local_backup(
    background_tasks: BackgroundTasks,
    current_doctor=Depends(get_current_admin),
):
    doctor_id = getattr(current_doctor, "id", None)
    if doctor_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user credentials.")

    _check_rate_limit(doctor_id)

    timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M")
    filename = f"{timestamp}_clinic_backup.sql"
    gz_filename = f"{filename}.gz"

    tmpdir = Path(tempfile.mkdtemp(prefix="backup_"))
    dump_path = tmpdir / filename
    gz_path = tmpdir / gz_filename

    try:
        command, env = _get_postgres_command(dump_path)
    except RuntimeError as exc:
        logger.error("Backup configuration error for doctor=%s: %s", doctor_id, str(exc))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

    logger.info("Backup requested by doctor=%s", doctor_id)

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            env=env,
            check=False,
            timeout=300,
        )
    except FileNotFoundError:
        logger.error("Backup failed: pg_dump not installed for doctor=%s", doctor_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database dump tool is not installed or available on the server.",
        )
    except subprocess.SubprocessError as exc:
        logger.error("Backup subprocess error for doctor=%s: %s", doctor_id, str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create database dump: {exc}",
        )

    if result.returncode != 0:
        logger.error(
            "Backup failed for doctor=%s returncode=%s stderr=%s stdout=%s",
            doctor_id,
            result.returncode,
            result.stderr.strip(),
            result.stdout.strip(),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Database dump failed. "
                f"pg_dump output: {result.stderr.strip() or result.stdout.strip()}"
            ),
        )

    try:
        with open(dump_path, "rb") as f_in, gzip.open(gz_path, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)
    except Exception as exc:
        logger.error("Compression failed for doctor=%s: %s", doctor_id, str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compress backup file: {exc}",
        )

    background_tasks.add_task(_remove_temp_dir, tmpdir)

    response = FileResponse(
        path=str(gz_path),
        filename=gz_filename,
        media_type="application/gzip",
    )
    response.headers["Content-Disposition"] = f"attachment; filename=\"{gz_filename}\""

    logger.info("Backup succeeded for doctor=%s file=%s", doctor_id, gz_path)
    return response
