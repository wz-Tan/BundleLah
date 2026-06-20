from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Numeric, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .company import Company
    from .trip import Trip


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE")
    )
    vehicle_type: Mapped[Optional[str]] = mapped_column(String(100))
    max_payload_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    license_plate: Mapped[Optional[str]] = mapped_column(String(20), unique=True)
    tier_badge: Mapped[Optional[str]] = mapped_column(String(20))
    total_earned: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), default=0
    )

    __table_args__ = (
        CheckConstraint(
            "tier_badge IN ('bronze','silver','gold','platinum')",
            name="drivers_tier_badge_check",
        ),
    )

    company: Mapped[Optional["Company"]] = relationship(back_populates="drivers")
    trips: Mapped[List["Trip"]] = relationship(back_populates="driver")
