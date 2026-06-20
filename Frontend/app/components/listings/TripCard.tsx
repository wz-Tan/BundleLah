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
}: {
  trip: GetTripListingItem;
  onSelect: (trip: GetTripListingItem) => void;
  onCancel?: (id: number) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => onSelect(trip)}
        className="w-full rounded-lg border border-solid border-black/[.06] bg-white p-4 text-left transition-all hover:border-black/[.12] hover:shadow-md active:scale-[0.995] dark:border-white/[.08] dark:bg-zinc-900 dark:hover:border-white/[.14]"
      >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {trip.logistics_provider.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {trip.logistics_provider.vehicle_type} · {trip.logistics_provider.license_plate}
          </p>
        </div>
        <TripStatusBadge status={trip.match_status} />
      </div>

      <div className="mb-3 flex items-stretch gap-2">
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <span className="h-2 w-2 flex-shrink-0 rounded-full border-2 border-zinc-400 dark:border-zinc-500" />
          <span className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-zinc-700 dark:bg-zinc-300" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {trip.origin_region}
          </p>
          <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
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
            <span className="text-sm font-semibold text-zinc-800 tabular-nums dark:text-zinc-200">
              {formatTripDate(trip.departure_window_start)}
            </span>
          </span>
          <span className="inline-flex flex-col">
            <span className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Weight
            </span>
            <span className="text-sm font-semibold text-zinc-800 tabular-nums dark:text-zinc-200">
              {trip.available_capacity.weight_kg} kg
            </span>
          </span>
          <span className="inline-flex flex-col">
            <span className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Volume
            </span>
            <span className="text-sm font-semibold text-zinc-800 tabular-nums dark:text-zinc-200">
              {trip.available_capacity.volume_m3} m³
            </span>
          </span>
        </div>
        {trip.estimated_price_per_kg_rm != null && (
          <span className="inline-flex flex-col items-end">
            <span className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Per kg
            </span>
            <span className="text-sm font-bold text-emerald-600 tabular-nums">
              RM {trip.estimated_price_per_kg_rm.toFixed(2)}
            </span>
          </span>
        )}
      </div>
      </button>

      {onCancel && (
        <button
          onClick={() => onCancel(trip.id)}
          className="absolute bottom-4 right-4 h-7 px-3 rounded-full border border-solid border-red-200 dark:border-red-900 bg-white dark:bg-zinc-900 text-[11px] font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          Cancel posting
        </button>
      )}
    </div>
  );
}
