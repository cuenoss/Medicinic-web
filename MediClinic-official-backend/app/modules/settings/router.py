from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.db import get_db
from app.modules.auth.service import get_current_doctor
from app.modules.auth.models import Doctor
from .service import SettingsService
from .schemas import (
    SettingsCreate, SettingsUpdate, SettingsResponse, SettingsListResponse,
    BulkSettingsUpdate, BulkSettingsResponse, SettingsExport, SettingsImport,
    ImportResult, SettingCategory, SystemConfiguration
)

router = APIRouter()


# ===== CRUD ENDPOINTS =====

@router.get("/", response_model=Dict[str, Any])
async def get_all_settings(
    category: Optional[SettingCategory] = Query(None, description="Filter by category"),
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Get all settings for the current doctor, optionally filtered by category"""
    try:
        service = SettingsService(db)
        settings = await service.get_settings(current_doctor.id)

        # Filter by category if specified
        if category:
            filtered_settings = {
                k: v for k, v in settings.items()
                if v.get("category") == category
            }
            return filtered_settings

        return settings

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{key}", response_model=Dict[str, Any])
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Get a specific setting by key for the current doctor"""
    try:
        service = SettingsService(db)
        setting = await service.get_setting(current_doctor.id, key)

        if not setting:
            raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")

        return setting

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=SettingsResponse)
async def create_setting(
    setting_data: SettingsCreate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Create a new setting for the current doctor"""
    try:
        service = SettingsService(db)
        return await service.create_setting(current_doctor.id, setting_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{key}", response_model=SettingsResponse)
async def update_setting(
    key: str,
    setting_data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Update an existing setting for the current doctor"""
    try:
        service = SettingsService(db)
        return await service.update_setting(current_doctor.id, key, setting_data)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{key}")
async def delete_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Delete a setting belonging to the current doctor"""
    try:
        service = SettingsService(db)
        success = await service.delete_setting(current_doctor.id, key)

        if not success:
            raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")

        return {"message": f"Setting '{key}' deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== BULK OPERATIONS =====

@router.post("/bulk-update", response_model=BulkSettingsResponse)
async def bulk_update_settings(
    bulk_data: BulkSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Update multiple settings at once for the current doctor"""
    try:
        service = SettingsService(db)
        updated = []
        failed = []

        for key, value in bulk_data.updates.items():
            try:
                await service.update_setting(current_doctor.id, key, SettingsUpdate(value=value))
                updated.append(key)
            except Exception as e:
                failed.append({"key": key, "error": str(e)})

        return BulkSettingsResponse(
            updated=updated,
            failed=failed,
            total_updated=len(updated)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== CONFIGURATION ENDPOINTS =====

@router.get("/config/clinic", response_model=Dict[str, Any])
async def get_clinic_config(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Get clinic configuration settings for the current doctor"""
    try:
        service = SettingsService(db)
        settings = await service.get_settings(current_doctor.id)

        clinic_keys = [
            "clinic_name", "clinic_address", "clinic_phone",
            "clinic_email", "clinic_website"
        ]

        clinic_config = {k: settings.get(k, {}) for k in clinic_keys if k in settings}

        return clinic_config

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/appointments", response_model=Dict[str, Any])
async def get_appointment_config(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Get appointment configuration settings for the current doctor"""
    try:
        service = SettingsService(db)
        settings = await service.get_settings(current_doctor.id)

        appointment_keys = [
            "appointment_duration", "appointment_buffer", "max_appointments_per_day",
            "working_hours", "auto_confirm", "allow_cancellation_hours"
        ]

        appointment_config = {k: settings.get(k, {}) for k in appointment_keys if k in settings}

        return appointment_config

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/notifications", response_model=Dict[str, Any])
async def get_notification_config(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Get notification configuration settings for the current doctor"""
    try:
        service = SettingsService(db)
        settings = await service.get_settings(current_doctor.id)

        notification_keys = [
            "notification_settings", "email_notifications", "sms_notifications",
            "appointment_reminders", "reminder_hours_before"
        ]

        notification_config = {k: settings.get(k, {}) for k in notification_keys if k in settings}

        return notification_config

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/security", response_model=Dict[str, Any])
async def get_security_config(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Get security configuration settings for the current doctor"""
    try:
        service = SettingsService(db)
        settings = await service.get_settings(current_doctor.id)

        security_keys = [
            "security_settings", "password_min_length", "session_timeout_minutes",
            "max_login_attempts", "require_2fa", "password_expiry_days"
        ]

        security_config = {k: settings.get(k, {}) for k in security_keys if k in settings}

        return security_config

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== INITIALIZATION =====

@router.post("/initialize", response_model=Dict[str, Any])
async def initialize_default_settings(
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Initialize default system settings for the current doctor"""
    try:
        service = SettingsService(db)
        result = await service.initialize_default_settings(current_doctor.id)

        return {
            "message": "Default settings initialized successfully",
            "created_count": result["total"],
            "created_settings": result["created"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/defaults", response_model=Dict[str, Any])
async def get_default_settings(
    db: AsyncSession = Depends(get_db)
):
    """Get default settings configuration"""
    try:
        service = SettingsService(db)
        return await service.get_default_settings()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== IMPORT/EXPORT =====

@router.get("/export", response_model=SettingsExport)
async def export_settings(
    category: Optional[SettingCategory] = Query(None, description="Export specific category"),
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Export the current doctor's settings to JSON"""
    try:
        service = SettingsService(db)
        settings = await service.get_settings(current_doctor.id)

        # Filter by category if specified
        if category:
            filtered_settings = {
                k: v for k, v in settings.items()
                if v.get("category") == category
            }
        else:
            filtered_settings = settings

        return SettingsExport(
            settings=filtered_settings,
            exported_at=datetime.utcnow()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import", response_model=ImportResult)
async def import_settings(
    import_data: SettingsImport,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Import settings from JSON into the current doctor's settings"""
    try:
        service = SettingsService(db)
        imported = []
        updated = []
        failed = []

        for key, config in import_data.settings.items():
            try:
                # Check if setting exists
                existing = await service.get_setting(current_doctor.id, key)

                if existing and import_data.overwrite_existing:
                    # Update existing
                    await service.update_setting(current_doctor.id, key, SettingsUpdate(value=config["value"]))
                    updated.append(key)
                elif not existing and import_data.create_new:
                    # Create new
                    await service.create_setting(current_doctor.id, SettingsCreate(
                        key=key,
                        value=config["value"],
                        value_type=config.get("value_type", "string"),
                        description=config.get("description", ""),
                        category=config.get("category", "general")
                    ))
                    imported.append(key)

            except Exception as e:
                failed.append({"key": key, "error": str(e)})

        return ImportResult(
            imported=imported,
            updated=updated,
            failed=failed,
            total_processed=len(imported) + len(updated) + len(failed)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== HEALTH CHECK =====

@router.get("/health")
async def settings_health_check():
    """Settings module health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "module": "settings"
    }


# ===== CATEGORIES =====

@router.get("/categories", response_model=List[str])
async def get_setting_categories():
    """Get available setting categories"""
    return [category.value for category in SettingCategory]


@router.get("/by-category/{category}", response_model=Dict[str, Any])
async def get_settings_by_category(
    category: SettingCategory,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Get all settings in a specific category for the current doctor"""
    try:
        service = SettingsService(db)
        settings = await service.get_settings(current_doctor.id)

        category_settings = {
            k: v for k, v in settings.items()
            if v.get("category") == category
        }

        return category_settings

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== VALIDATION =====

@router.post("/validate/{key}")
async def validate_setting_value(
    key: str,
    value: Any,
    db: AsyncSession = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Validate a setting value without saving it"""
    try:
        service = SettingsService(db)
        # Get existing setting to validate against its type
        existing = await service.get_setting(current_doctor.id, key)

        if not existing:
            raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")

        # Basic validation based on type
        value_type = existing["value_type"]

        if value_type == "integer" and not isinstance(value, int):
            return {"valid": False, "error": "Value must be an integer"}
        elif value_type == "boolean" and not isinstance(value, bool):
            return {"valid": False, "error": "Value must be a boolean"}
        elif value_type == "float" and not isinstance(value, (int, float)):
            return {"valid": False, "error": "Value must be a number"}
        elif value_type == "json":
            import json
            try:
                json.dumps(value)
            except (TypeError, ValueError):
                return {"valid": False, "error": "Value must be JSON serializable"}

        return {"valid": True, "message": "Value is valid"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
