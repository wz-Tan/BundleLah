from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class DeviceBase(BaseModel):
    cargo_match_id: int
    temperature_threshold: Optional[float] = None
    humidity_threshold: Optional[int] = None
    ethylene_threshold: Optional[float] = None
    motion_alarm: Optional[bool] = False


class DeviceCreate(DeviceBase):
    secret: str


class DeviceRead(DeviceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    secret: str
    created_at: Optional[datetime] = None


class DevicePublic(BaseModel):
    # without secret
    model_config = ConfigDict(from_attributes=True)

    id: int
    cargo_match_id: int
    created_at: Optional[datetime] = None
    temperature_threshold: Optional[float] = None
    humidity_threshold: Optional[int] = None
    ethylene_threshold: Optional[float] = None
    motion_alarm: Optional[bool] = False


class AlertDetail(BaseModel):
    alert_type: str  # "temperature", "humidity", "ethylene", "motion"
    current_value: Optional[float | int | bool] = None
    threshold: Optional[float | int | bool] = None
    message: str
    timestamp: datetime


class DeviceAlerts(BaseModel):
    device_id: int
    alerts: List[AlertDetail]

