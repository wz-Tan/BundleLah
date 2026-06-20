// Display shapes used by the Active Orders page
// (mapped from the raw backend models in lib/api.ts).

export interface OrderRequest {
  id: string;
  pickup: string;
  destination: string;
  price: number;
  status: string;
  // For offers on your cargo: the logistics provider who made the offer.
  offeredBy?: string;
  // The underlying cargo_match id (used to accept/reject the offer).
  matchId?: number;
}

export interface TripListingDisplay {
  id: string;
  pickup: string;
  destination: string;
  dateTime: string;
  status: string;
  poolingRequests: OrderRequest[];
  // For completed trips: the accepted cargo_match id whose IoT device is tracked.
  trackingMatchId?: number;
}

export type ActiveOrdersTab = "requests" | "trips";

const POSITIVE_STATUSES = [
  "accepted",
  "matched",
  "delivered",
  "completed",
  "in_transit",
  "in_progress",
];

export function isPositiveStatus(status: string): boolean {
  return POSITIVE_STATUSES.includes(status);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
