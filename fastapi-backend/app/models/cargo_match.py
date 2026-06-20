from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Numeric, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .trip_listing import TripListing
    from .cargo_request import CargoRequest
    from .cost_split import CostSplit


class CargoMatch(Base):
    """The handshake pairing a trip listing with a cargo request."""

    __tablename__ = "cargo_matches"

    id: Mapped[int] = mapped_column(primary_key=True)
    trip_listing_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("trip_listings.id", ondelete="CASCADE")
    )
    cargo_request_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("cargo_requests.id", ondelete="CASCADE")
    )
    # Which side started the match: 'logistics_provider' (trip owner) or 'cargo_owner' (cargo owner)
    initiated_by: Mapped[Optional[str]] = mapped_column(String(50))
    status: Mapped[Optional[str]] = mapped_column(String(20), default="pending")
    agreed_price_rm: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    matched_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','accepted','rejected')",
            name="cargo_matches_status_check",
        ),
    )

    trip_listing: Mapped[Optional["TripListing"]] = relationship(
        back_populates="matches"
    )
    cargo_request: Mapped[Optional["CargoRequest"]] = relationship(
        back_populates="matches"
    )
    cost_splits: Mapped[List["CostSplit"]] = relationship(
        back_populates="match", cascade="all, delete-orphan"
    )
