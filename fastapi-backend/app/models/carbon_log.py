from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .trip_listing import TripListing
    from .cargo_request import CargoRequest


class CarbonLog(Base):
    __tablename__ = "carbon_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_listing_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("trip_listings.id", ondelete="CASCADE")
    )
    cargo_request_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("cargo_requests.id")
    )
    co2_emitted_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    co2_avoided_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    credits_awarded: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    logged_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    trip_listing: Mapped[Optional["TripListing"]] = relationship(
        back_populates="carbon_logs"
    )
    cargo_request: Mapped[Optional["CargoRequest"]] = relationship(
        back_populates="carbon_logs"
    )
