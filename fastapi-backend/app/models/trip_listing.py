from datetime import datetime
from decimal import Decimal
from typing import Optional, Any, List, TYPE_CHECKING

from sqlalchemy import (
    String,
    Numeric,
    DateTime,
    ForeignKey,
    CheckConstraint,
    JSON,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .company import Company
    from .vehicle import Vehicle
    from .cargo_match import CargoMatch
    from .carbon_log import CarbonLog


class TripListing(Base):
    """A company's offer of spare capacity on a route ("I have empty space")."""

    __tablename__ = "trip_listings"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE")
    )
    vehicle_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("vehicles.id", ondelete="SET NULL")
    )
    origin_region: Mapped[str] = mapped_column(String(100), nullable=False)
    destination_region: Mapped[str] = mapped_column(String(100), nullable=False)
    route_json: Mapped[Optional[Any]] = mapped_column(JSON)
    departure_window_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    available_weight_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    available_volume_m3: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    status: Mapped[Optional[str]] = mapped_column(String(20), default="open")
    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('open','locked','in_progress','completed','cancelled')",
            name="trip_listings_status_check",
        ),
    )

    company: Mapped[Optional["Company"]] = relationship(
        back_populates="trip_listings"
    )
    vehicle: Mapped[Optional["Vehicle"]] = relationship(
        back_populates="trip_listings"
    )
    matches: Mapped[List["CargoMatch"]] = relationship(
        back_populates="trip_listing", cascade="all, delete-orphan"
    )
    carbon_logs: Mapped[List["CarbonLog"]] = relationship(
        back_populates="trip_listing", cascade="all, delete-orphan"
    )
