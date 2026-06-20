from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Float, Boolean, Integer, ForeignKey, func, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.database import Base

if TYPE_CHECKING:
    from .device import Device


class TrackingRecord(Base):
    __tablename__ = "tracking_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[int] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE")
    )
    recorded_at: Mapped[datetime] = mapped_column(server_default=func.now())
    device_time: Mapped[Optional[float]] = mapped_column(Float)
    
    humidity: Mapped[Optional[int]] = mapped_column(Integer)  # percentage
    temperature: Mapped[Optional[float]] = mapped_column(Float)  # in celsius
    
    # location
    longitude: Mapped[Optional[float]] = mapped_column(Float)
    latitude: Mapped[Optional[float]] = mapped_column(Float)
    
    ethylene_level: Mapped[Optional[float]] = mapped_column(Float)  # ppm?
    motion_detected: Mapped[Optional[bool]] = mapped_column(Boolean, default=False)
    
    device: Mapped["Device"] = relationship(back_populates="tracking_records")
    
    
