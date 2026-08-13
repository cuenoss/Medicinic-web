from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from typing import Optional, Dict, Any
import json
from datetime import datetime

from .models import SystemSettings
from .schemas import SettingsCreate, SettingsUpdate, SettingsResponse


def _infer_value_type(value: Any) -> str:
    """Guess a setting's value_type from a raw Python value, for keys created on first write."""
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "float"
    if isinstance(value, (dict, list)):
        return "json"
    return "string"


class SettingsService:
    """Service for managing per-doctor system settings"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_settings(self, doctor_id: int) -> Dict[str, Any]:
        """Get all settings belonging to this doctor"""
        try:
            result = await self.db.execute(
                select(SystemSettings).where(SystemSettings.doctor_id == doctor_id)
            )
            settings = result.scalars().all()

            settings_dict = {}
            for setting in settings:
                # Parse JSON value if it's a JSON string
                try:
                    value = json.loads(setting.value) if setting.value_type == "json" else setting.value
                except json.JSONDecodeError:
                    value = setting.value

                settings_dict[setting.key] = {
                    "value": value,
                    "value_type": setting.value_type,
                    "description": setting.description,
                    "category": setting.category,
                    "updated_at": setting.updated_at
                }

            return settings_dict

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get settings: {str(e)}")

    async def get_setting(self, doctor_id: int, key: str) -> Optional[Dict[str, Any]]:
        """Get a specific setting by key for this doctor"""
        try:
            result = await self.db.execute(
                select(SystemSettings).where(
                    SystemSettings.doctor_id == doctor_id,
                    SystemSettings.key == key
                )
            )
            setting = result.scalars().first()

            if not setting:
                return None

            # Parse JSON value if needed
            try:
                value = json.loads(setting.value) if setting.value_type == "json" else setting.value
            except json.JSONDecodeError:
                value = setting.value

            return {
                "key": setting.key,
                "value": value,
                "value_type": setting.value_type,
                "description": setting.description,
                "category": setting.category,
                "updated_at": setting.updated_at
            }

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get setting: {str(e)}")

    async def create_setting(self, doctor_id: int, setting_data: SettingsCreate) -> SettingsResponse:
        """Create a new setting for this doctor"""
        try:
            # Check if this doctor already has a setting with this key
            existing = await self.db.execute(
                select(SystemSettings).where(
                    SystemSettings.doctor_id == doctor_id,
                    SystemSettings.key == setting_data.key
                )
            )
            if existing.scalars().first():
                raise HTTPException(status_code=400, detail=f"Setting '{setting_data.key}' already exists")

            # Convert value to string based on type
            if setting_data.value_type == "json":
                value = json.dumps(setting_data.value) if isinstance(setting_data.value, (dict, list)) else setting_data.value
            else:
                value = str(setting_data.value)

            new_setting = SystemSettings(
                doctor_id=doctor_id,
                key=setting_data.key,
                value=value,
                value_type=setting_data.value_type,
                description=setting_data.description,
                category=setting_data.category
            )

            self.db.add(new_setting)
            await self.db.commit()
            await self.db.refresh(new_setting)

            return SettingsResponse(
                key=new_setting.key,
                value=new_setting.value,
                value_type=new_setting.value_type,
                description=new_setting.description,
                category=new_setting.category,
                created_at=new_setting.created_at,
                updated_at=new_setting.updated_at
            )

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create setting: {str(e)}")

    async def update_setting(self, doctor_id: int, key: str, setting_data: SettingsUpdate) -> SettingsResponse:
        """Update an existing setting for this doctor, creating it on first write if it doesn't exist yet.

        The Settings page saves keys (e.g. doctor_specialization) that aren't necessarily
        pre-seeded by get_default_settings(), so this must not 404 on a missing key.
        """
        try:
            result = await self.db.execute(
                select(SystemSettings).where(
                    SystemSettings.doctor_id == doctor_id,
                    SystemSettings.key == key
                )
            )
            setting = result.scalars().first()

            if not setting:
                if setting_data.value is None:
                    raise HTTPException(status_code=400, detail=f"A value is required to create setting '{key}'")

                value_type = _infer_value_type(setting_data.value)
                value = json.dumps(setting_data.value) if value_type == "json" else str(setting_data.value)

                setting = SystemSettings(
                    doctor_id=doctor_id,
                    key=key,
                    value=value,
                    value_type=value_type,
                    description=setting_data.description,
                    category=setting_data.category.value if setting_data.category else "general",
                )
                self.db.add(setting)
                await self.db.commit()
                await self.db.refresh(setting)

                return SettingsResponse(
                    key=setting.key,
                    value=setting.value,
                    value_type=setting.value_type,
                    description=setting.description,
                    category=setting.category,
                    created_at=setting.created_at,
                    updated_at=setting.updated_at
                )

            # Update fields
            if setting_data.value is not None:
                if setting.value_type == "json":
                    setting.value = json.dumps(setting_data.value) if isinstance(setting_data.value, (dict, list)) else setting_data.value
                else:
                    setting.value = str(setting_data.value)

            if setting_data.description is not None:
                setting.description = setting_data.description

            if setting_data.category is not None:
                setting.category = setting_data.category

            setting.updated_at = datetime.utcnow()

            await self.db.commit()
            await self.db.refresh(setting)

            return SettingsResponse(
                key=setting.key,
                value=setting.value,
                value_type=setting.value_type,
                description=setting.description,
                category=setting.category,
                created_at=setting.created_at,
                updated_at=setting.updated_at
            )

        except HTTPException:
            raise
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to update setting: {str(e)}")

    async def delete_setting(self, doctor_id: int, key: str) -> bool:
        """Delete a setting belonging to this doctor"""
        try:
            result = await self.db.execute(
                select(SystemSettings).where(
                    SystemSettings.doctor_id == doctor_id,
                    SystemSettings.key == key
                )
            )
            setting = result.scalars().first()

            if not setting:
                return False

            await self.db.delete(setting)
            await self.db.commit()

            return True

        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to delete setting: {str(e)}")

    async def get_default_settings(self) -> Dict[str, Any]:
        """Get default system settings for initialization"""
        return {
            "clinic_name": {
                "value": "MediClinic",
                "value_type": "string",
                "description": "Name of the medical clinic",
                "category": "general"
            },
            "clinic_address": {
                "value": "",
                "value_type": "string",
                "description": "Clinic physical address",
                "category": "general"
            },
            "clinic_phone": {
                "value": "",
                "value_type": "string",
                "description": "Clinic phone number",
                "category": "general"
            },
            "clinic_email": {
                "value": "",
                "value_type": "string",
                "description": "Clinic email address",
                "category": "general"
            },
            "clinic_website": {
                "value": "",
                "value_type": "string",
                "description": "Clinic website URL",
                "category": "general"
            },
            "doctor_full_name": {
                "value": "",
                "value_type": "string",
                "description": "Doctor's full name",
                "category": "general"
            },
            "doctor_specialization": {
                "value": "General Practitioner",
                "value_type": "string",
                "description": "Doctor's medical specialization",
                "category": "general"
            },
            "doctor_license": {
                "value": "",
                "value_type": "string",
                "description": "Doctor's medical license number",
                "category": "general"
            },
            "doctor_email": {
                "value": "",
                "value_type": "string",
                "description": "Doctor's contact email",
                "category": "general"
            },
            "doctor_phone": {
                "value": "",
                "value_type": "string",
                "description": "Doctor's contact phone number",
                "category": "general"
            },
            "appointment_duration": {
                "value": 30,
                "value_type": "integer",
                "description": "Default appointment duration in minutes",
                "category": "appointments"
            },
            "appointment_buffer": {
                "value": 15,
                "value_type": "integer",
                "description": "Buffer time between appointments in minutes",
                "category": "appointments"
            },
            "max_appointments_per_day": {
                "value": 50,
                "value_type": "integer",
                "description": "Maximum number of appointments per day",
                "category": "appointments"
            },
            "working_hours": {
                "value": {
                    "monday": {"start": "09:00", "end": "17:00"},
                    "tuesday": {"start": "09:00", "end": "17:00"},
                    "wednesday": {"start": "09:00", "end": "17:00"},
                    "thursday": {"start": "09:00", "end": "17:00"},
                    "friday": {"start": "09:00", "end": "17:00"},
                    "saturday": {"start": "09:00", "end": "13:00"},
                    "sunday": {"start": None, "end": None}
                },
                "value_type": "json",
                "description": "Clinic working hours by day",
                "category": "appointments"
            },
            "notification_settings": {
                "value": {
                    "email_notifications": True,
                    "sms_notifications": False,
                    "appointment_reminders": True,
                    "reminder_hours_before": 24
                },
                "value_type": "json",
                "description": "Notification preferences",
                "category": "notifications"
            },
            "backup_settings": {
                "value": {
                    "auto_backup": True,
                    "backup_frequency": "daily",
                    "backup_retention_days": 30
                },
                "value_type": "json",
                "description": "Database backup configuration",
                "category": "system"
            },
            "security_settings": {
                "value": {
                    "password_min_length": 8,
                    "session_timeout_minutes": 30,
                    "max_login_attempts": 5
                },
                "value_type": "json",
                "description": "Security configuration",
                "category": "security"
            }
        }

    async def initialize_default_settings(self, doctor_id: int) -> Dict[str, Any]:
        """Initialize default settings for this doctor if they don't exist yet"""
        try:
            defaults = await self.get_default_settings()
            created_settings = []

            for key, config in defaults.items():
                # Check if this doctor already has this setting
                existing = await self.db.execute(
                    select(SystemSettings).where(
                        SystemSettings.doctor_id == doctor_id,
                        SystemSettings.key == key
                    )
                )
                if not existing.scalars().first():
                    # Create new setting
                    new_setting = SystemSettings(
                        doctor_id=doctor_id,
                        key=key,
                        value=json.dumps(config["value"]) if config["value_type"] == "json" else str(config["value"]),
                        value_type=config["value_type"],
                        description=config["description"],
                        category=config["category"]
                    )
                    self.db.add(new_setting)
                    created_settings.append(key)

            if created_settings:
                await self.db.commit()

            return {"created": created_settings, "total": len(created_settings)}

        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to initialize settings: {str(e)}")
