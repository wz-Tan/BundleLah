from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DeviceBase(BaseModel):
    cargo_match_id: int


class DeviceCreate(DeviceBase):
    pass


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
    humidity_threshold: Optional[float] = None
    ethylene_threshold: Optional[float] = None
    motion_alarm: Optional[bool] = None
