from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict

CargoRequestStatus = Literal[
    "open", "matched", "in_transit", "delivered", "cancelled"
]


class CargoRequestBase(BaseModel):
    company_id: int
    pickup_address: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    dropoff_address: str
    dropoff_lat: Optional[float] = None
    dropoff_lng: Optional[float] = None
    weight_kg: Optional[Decimal] = None
    volume_m3: Optional[Decimal] = None
    pickup_window_start: Optional[datetime] = None
    pickup_window_end: Optional[datetime] = None
    priority_flag: Optional[bool] = False
    # Monitoring requirements (None threshold = sensor not required).
    temp_threshold_c: Optional[Decimal] = None
    humidity_threshold_pct: Optional[Decimal] = None
    ethylene_threshold_ppm: Optional[Decimal] = None
    motion_required: Optional[bool] = False


class CargoRequestCreate(CargoRequestBase):
    pass


class CargoRequestUpdate(BaseModel):
    pickup_address: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    dropoff_address: Optional[str] = None
    dropoff_lat: Optional[float] = None
    dropoff_lng: Optional[float] = None
    weight_kg: Optional[Decimal] = None
    volume_m3: Optional[Decimal] = None
    pickup_window_start: Optional[datetime] = None
    pickup_window_end: Optional[datetime] = None
    status: Optional[CargoRequestStatus] = None
    priority_flag: Optional[bool] = None
    temp_threshold_c: Optional[Decimal] = None
    humidity_threshold_pct: Optional[Decimal] = None
    ethylene_threshold_ppm: Optional[Decimal] = None
    motion_required: Optional[bool] = None


class CargoRequestRead(CargoRequestBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: Optional[CargoRequestStatus] = None
    created_at: Optional[datetime] = None
