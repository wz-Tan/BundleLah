from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .trip import Trip


class CarbonLog(Base):
    __tablename__ = "carbon_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("trips.id", ondelete="CASCADE")
    )
    co2_emitted_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    co2_avoided_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    credits_awarded: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2))
    logged_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    trip: Mapped[Optional["Trip"]] = relationship(back_populates="carbon_logs")