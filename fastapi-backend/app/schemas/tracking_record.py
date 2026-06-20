from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class TrackingRecordBase(BaseModel):
    device_time: Optional[float] = None
    humidity: Optional[int] = None
    temperature: Optional[float] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    ethylene_level: Optional[float] = None
    motion_detected: Optional[bool] = False


class TrackingRecordCreate(TrackingRecordBase):
    device_id: int
    secret: str


class TrackingRecordRead(TrackingRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: int
    recorded_at: datetime


class TrackingRecordBulkCreate(BaseModel):
    device_id: int
    secret: str
    records: list[TrackingRecordBase]
