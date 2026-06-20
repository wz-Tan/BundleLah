from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CarbonLogBase(BaseModel):
    trip_listing_id: int
    cargo_request_id: Optional[int] = None
    co2_emitted_kg: Optional[Decimal] = None
    co2_avoided_kg: Optional[Decimal] = None
    credits_awarded: Optional[Decimal] = None


class CarbonLogCreate(CarbonLogBase):
    pass


class CarbonLogRead(CarbonLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    logged_at: Optional[datetime] = None
