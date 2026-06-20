from datetime import datetime
from decimal import Decimal
from typing import Optional, Any, Literal

from pydantic import BaseModel, ConfigDict

TripListingStatus = Literal[
    "open", "locked", "in_progress", "completed", "cancelled"
]


class TripListingBase(BaseModel):
    company_id: int
    origin_region: str
    destination_region: str
    route_json: Optional[Any] = None
    departure_window_start: datetime
    available_weight_kg: Optional[Decimal] = None
    available_volume_m3: Optional[Decimal] = None


class TripListingCreate(TripListingBase):
    pass


class TripListingUpdate(BaseModel):
    origin_region: Optional[str] = None
    destination_region: Optional[str] = None
    route_json: Optional[Any] = None
    departure_window_start: Optional[datetime] = None
    available_weight_kg: Optional[Decimal] = None
    available_volume_m3: Optional[Decimal] = None
    status: Optional[TripListingStatus] = None


class TripListingRead(TripListingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: Optional[TripListingStatus] = None
    created_at: Optional[datetime] = None
