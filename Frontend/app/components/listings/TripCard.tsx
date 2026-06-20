"use client";

import type { GetTripResponse } from "@/type";

function formatTripDate(iso: string) {
  return new Date(iso).toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getTripSummary(trip: GetTripResponse) {
  const sortedStops = [...trip.route.stops].sort((a, b) => a.sequence - b.sequence);
  const origin = sortedStops[0]?.address ?? "Origin unavailable";
  const destination = sortedStops[sortedStops.length - 1]?.address ?? "Destination unavailable";
  const totalWeight = sortedStops.reduce((sum, stop) => sum + stop.weight_kg, 0);
  const pricePerKg = totalWeight > 0 ? trip.cost_summary.total_trip_cost_rm / totalWeight : 0;

  return {
    origin,
    destination,
    totalWeight,
    pricePerKg,
    stopCount: sortedStops.length,
  };
}

export function TripCard({
  trip,
  onSelect,
}: {
  trip: GetTripResponse;
  onSelect: (trip: GetTripResponse) => void;
}) {
  const summary = getTripSummary(trip);

  return (
    <button
      onClick={() => onSelect(trip)}
      className="w-full rounded-lg border border-solid border-black/[.06] bg-white p-4 text-left transition-all hover:border-black/[.12] hover:shadow-md active:scale-[0.995] dark:border-white/[.08] dark:bg-zinc-900 dark:hover:border-white/[.14]"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {trip.driver.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {trip.driver.vehicle_type} · {trip.driver.license_plate}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {trip.route_score}% score
        </span>
      </div>

      <div className="mb-3 flex items-stretch gap-2">
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <span className="h-2 w-2 flex-shrink-0 rounded-full border-2 border-zinc-400 dark:border-zinc-500" />
          <span className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-zinc-700 dark:bg-zinc-300" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{summary.origin}</p>
          <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
            {summary.destination}
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
              {formatTripDate(trip.dispatched_at)}
            </span>
          </span>
          <span className="inline-flex flex-col">
            <span className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Load
            </span>
            <span className="text-sm font-semibold text-zinc-800 tabular-nums dark:text-zinc-200">
              {trip.load_factor_pct}%
            </span>
          </span>
          <span className="inline-flex flex-col">
            <span className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Stops
            </span>
            <span className="text-sm font-semibold text-zinc-800 tabular-nums dark:text-zinc-200">
              {summary.stopCount}
            </span>
          </span>
        </div>
        <span className="text-base font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
          RM {summary.pricePerKg.toFixed(2)}/kg
        </span>
      </div>
    </button>
  );
}

export function TripDetail({
  trip,
  onClose,
}: {
  trip: GetTripResponse;
  onClose: () => void;
}) {
  const summary = getTripSummary(trip);
  const details = [
    ["Current load", `${trip.load_factor_pct}%`],
    ["Route distance", `${trip.total_distance_km} km`],
    ["Total cargo", `${summary.totalWeight} kg`],
    ["CO₂ avoided", `${trip.carbon_log.co2_avoided_kg} kg`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:w-96 sm:rounded-2xl dark:bg-zinc-900">
        <div className="border-b border-l-4 border-l-emerald-500 border-black/[.06] px-5 py-4 dark:border-white/[.08]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-400">
              #TRIP-{String(trip.id).padStart(4, "0")}
            </span>
            <button
              onClick={onClose}
              className="text-xl leading-none text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              ×
            </button>
          </div>
          <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {trip.driver.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            {trip.driver.vehicle_type} · {trip.driver.license_plate}
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Route
            </p>
            <div className="flex items-stretch gap-2">
              <div className="flex flex-col items-center gap-0.5 pt-1">
                <span className="h-2 w-2 flex-shrink-0 rounded-full border-2 border-zinc-400" />
                <span className="min-h-[24px] w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-zinc-700 dark:bg-zinc-300" />
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <div>
                  <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-400">From</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{summary.origin}</p>
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-400">To</p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {summary.destination}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Trip Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              {details.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800">
                  <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-zinc-800 tabular-nums dark:text-zinc-100">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-solid border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                Route Score
              </p>
              <p className="text-2xl font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
                {trip.route_score}%
              </p>
            </div>
            <span className="text-base font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
              RM {summary.pricePerKg.toFixed(2)}/kg
            </span>
          </div>
        </div>

        <div className="border-t border-black/[.06] px-5 py-4 dark:border-white/[.08]">
          <button className="h-11 w-full rounded-full bg-zinc-900 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
            Request To Pool Cargo
          </button>
        </div>
      </div>
    </div>
  );
}
