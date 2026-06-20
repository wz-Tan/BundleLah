from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .company import Company
    from .trip_listing import TripListing


class Vehicle(Base):
    """A truck/van owned by a company and used to operate trip listings."""

    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE")
    )
    vehicle_type: Mapped[Optional[str]] = mapped_column(String(100))
    license_plate: Mapped[Optional[str]] = mapped_column(String(20), unique=True)
    max_payload_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))

    company: Mapped[Optional["Company"]] = relationship(back_populates="vehicles")
    trip_listings: Mapped[List["TripListing"]] = relationship(
        back_populates="vehicle"
    )
