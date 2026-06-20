from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator


def _adc_to_ppm(value) -> Optional[float]:
    if value is None:
        return None
    return max(0.0, (float(value) - 2000) * 1000.0 / (4095 - 2000))


class TrackingRecordBase(BaseModel):
    device_time: Optional[float] = None
    humidity: Optional[int] = None
    temperature: Optional[float] = None
    longitude: Optional[float] = None
    latitude: Optional[float] = None
    ethylene_level: Optional[float] = None
    motion_detected: Optional[bool] = False


class TrackingRecordItem(TrackingRecordBase):
    """Used for individual records within a bulk payload — applies ADC conversion."""

    @field_validator("ethylene_level", mode="before")
    @classmethod
    def parse_ethylene_adc(cls, value):
        return _adc_to_ppm(value)


class TrackingRecordCreate(TrackingRecordItem):
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
    records: list[TrackingRecordItem]
