from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db import Base
from datetime import datetime


class SystemSettings(Base):
    """Per-doctor settings model for storing configuration values"""
    __tablename__ = "system_settings"
    __table_args__ = (
        UniqueConstraint("doctor_id", "key", name="uq_system_settings_doctor_key"),
    )

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    key = Column(String(255), nullable=False, index=True)
    value = Column(Text, nullable=False)
    value_type = Column(String(50), nullable=False, default="string")  # string, integer, boolean, json
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="general", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<SystemSettings(key='{self.key}', category='{self.category}')>"

    def to_dict(self):
        """Convert setting to dictionary"""
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "value_type": self.value_type,
            "description": self.description,
            "category": self.category,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
