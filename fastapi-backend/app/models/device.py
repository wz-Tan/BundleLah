from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, ForeignKey, func, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .cargo_match import CargoMatch
    from .tracking_records import TrackingRecord


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True)
    cargo_match_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("cargo_matches.id", ondelete="CASCADE")
    )
    secret: Mapped[str] = mapped_column(String(255))  # salted random uuid, kept as secret
    # consider some diffie hellman key exchange?
    # or like at least some priv/pub key?
    created_at: Mapped[Optional[datetime]] = mapped_column(server_default=func.now())
    temperature_threshold: Mapped[Optional[float]] = mapped_column(nullable=True)
    humidity_threshold: Mapped[Optional[float]] = mapped_column(nullable=True)
    ethylene_threshold: Mapped[Optional[float]] = mapped_column(nullable=True)
    motion_alarm: Mapped[Optional[bool]] = mapped_column(nullable=True, default=None)
    
    cargo_match: Mapped[Optional["CargoMatch"]] = relationship(
        back_populates="devices"
    )
    tracking_records: Mapped[List["TrackingRecord"]] = relationship(
        back_populates="device", cascade="all, delete-orphan"
    )
    
