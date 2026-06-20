"use client";

import type { GetTripListingItem } from "@/type";
import { TripStatusBadge } from "./StatusBadge";

function formatTripDate(iso: string) {
  return new Date(iso).toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function TripCard({
  trip,
  onSelect,
  onCancel,
  isOwn = false,
}: {
  trip: GetTripListingItem;
  onSelect: (trip: GetTripListingItem) => void;
  onCancel?: (id: number) => void;
  isOwn?: boolean;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => onSelect(trip)}
        className={`w-full rounded-lg border border-solid p-4 text-left transition-all hover:shadow-md active:scale-[0.995] ${
          isOwn
            ? "border-emerald-300 ring-2 ring-emerald-200 bg-emerald-50/50"
            : "border-black/[.06] bg-white hover:border-black/[.12]"
        }`}
      >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-900">
              {trip.logistics_provider.name}
            </p>
            {isOwn && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Your trip
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-400">
            {trip.logistics_provider.vehicle_type} · {trip.logistics_provider.license_plate}
          </p>
        </div>
        <TripStatusBadge status={trip.match_status} />
      </div>

      <div className="mb-3 flex items-stretch gap-2">
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <span className="h-2 w-2 flex-shrink-0 rounded-full border-2 border-zinc-400" />
          <span className="w-px flex-1 bg-zinc-200" />
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-zinc-700" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-xs text-zinc-500">
            {trip.origin_region}
          </p>
          <p className="truncate text-xs font-medium text-zinc-800">
            {trip.destination_region}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex gap-5">
          <span className="inline-flex flex-col">
            <span className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Departs
            </span>
            <span className="text-sm font-semibold text-zinc-800 tabular-nums">
              {formatTripDate(trip.departure_window_start)}
            </span>
          </span>
          <span className="inline-flex flex-col">
            <span className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Weight
            </span>
            <span className="text-sm font-semibold text-zinc-800 tabular-nums">
              {trip.available_capacity.weight_kg} kg
            </span>
          </span>
          <span className="inline-flex flex-col">
            <span className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Volume
            </span>
            <span className="text-sm font-semibold text-zinc-800 tabular-nums">
              {trip.available_capacity.volume_m3} m³
            </span>
          </span>
        </div>
      </div>
      </button>
      {onCancel && (
        <button
          onClick={() => onCancel(trip.id)}
          className="absolute bottom-4 right-4 z-10 text-[11px] font-medium text-zinc-400 hover:text-red-500 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
