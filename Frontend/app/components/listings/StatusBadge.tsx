"use client";

import type { CargoRequestStatus, TripListingStatus } from "@/type";
import { CARGO_STATUS_STYLES, TRIP_STATUS_STYLES } from "./listingUtils";

export function CargoStatusBadge({ status }: { status: CargoRequestStatus }) {
  const s = CARGO_STATUS_STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        {s.label}
      </span>
    </span>
  );
}

export function TripStatusBadge({ status }: { status: TripListingStatus }) {
  const s = TRIP_STATUS_STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        {s.label}
      </span>
    </span>
  );
}
