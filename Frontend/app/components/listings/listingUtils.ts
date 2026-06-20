import type { CargoRequestStatus, TripListingStatus } from "@/type";

export const CARGO_STATUS_STYLES: Record<CargoRequestStatus, { dot: string; label: string; border: string }> = {
  open:       { dot: "bg-emerald-500", label: "Open",       border: "border-l-emerald-500" },
  matched:    { dot: "bg-blue-500",    label: "Matched",    border: "border-l-blue-500"    },
  in_transit: { dot: "bg-violet-500",  label: "In Transit", border: "border-l-violet-500"  },
  delivered:  { dot: "bg-zinc-500",    label: "Delivered",  border: "border-l-zinc-500"    },
  cancelled:  { dot: "bg-red-400",     label: "Cancelled",  border: "border-l-red-400"     },
};

export const TRIP_STATUS_STYLES: Record<TripListingStatus, { dot: string; label: string; border: string }> = {
  open:        { dot: "bg-emerald-500", label: "Open",        border: "border-l-emerald-500" },
  locked:      { dot: "bg-blue-500",    label: "Locked",      border: "border-l-blue-500"    },
  in_progress: { dot: "bg-violet-500",  label: "In Progress", border: "border-l-violet-500"  },
  completed:   { dot: "bg-zinc-500",    label: "Completed",   border: "border-l-zinc-500"    },
  cancelled:   { dot: "bg-red-400",     label: "Cancelled",   border: "border-l-red-400"     },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-MY", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}
