from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict

CargoMatchStatus = Literal["pending", "accepted", "rejected"]
InitiatedBy = Literal["carrier", "shipper"]


class CargoMatchBase(BaseModel):
    trip_listing_id: int
    cargo_request_id: int
    initiated_by: Optional[InitiatedBy] = None
    agreed_price_rm: Optional[Decimal] = None


class CargoMatchCreate(CargoMatchBase):
    pass


class CargoMatchUpdate(BaseModel):
    status: Optional[CargoMatchStatus] = None
    agreed_price_rm: Optional[Decimal] = None


class CargoMatchRead(CargoMatchBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: Optional[CargoMatchStatus] = None
    matched_at: Optional[datetime] = None
