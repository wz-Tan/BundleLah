"use client";

import { useState } from "react";
import type { GetTripListingItem, GetTripListingsResponse } from "@/type";
import {
  ListingModeTabs,
  TripCard,
  TripDetail
} from "@/app/components/listings";

const MOCK_TRIP_LISTINGS: GetTripListingsResponse = {
  results: [
    {
      id: 1,
      logistics_provider: {
        company_id: 11,
        name: "Sarawak Freight Co.",
        license_plate: "QAA 2381",
        vehicle_type: "5-ton box truck",
      },
      origin_region: "Bintawa Industrial Estate, Kuching",
      destination_region: "Demak Laut Industrial Park, Kuching",
      departure_window_start: "2026-06-21T08:30:00Z",
      available_capacity: {
        weight_kg: 420,
        volume_m3: 5.4,
      },
      match_status: "open",
      estimated_price_per_kg_rm: 0.42,
    },
    {
      id: 2,
      logistics_provider: {
        company_id: 12,
        name: "Kuching Consolidated Logistics",
        license_plate: "QAB 9027",
        vehicle_type: "3-ton lorry",
      },
      origin_region: "Pending Industrial Park, Kuching",
      destination_region: "Kuching City Centre",
      departure_window_start: "2026-06-21T09:15:00Z",
      available_capacity: {
        weight_kg: 260,
        volume_m3: 3.1,
      },
      match_status: "open",
      estimated_price_per_kg_rm: 0.38,
    },
    {
      id: 3,
      logistics_provider: {
        company_id: 13,
        name: "Borneo RouteLink",
        license_plate: "QAC 6615",
        vehicle_type: "10-ton curtain sider",
      },
      origin_region: "Kuching Port Authority, Pending",
      destination_region: "Batu Kawa New Township, Kuching",
      departure_window_start: "2026-06-22T06:00:00Z",
      available_capacity: {
        weight_kg: 1100,
        volume_m3: 11.8,
      },
      match_status: "locked",
      estimated_price_per_kg_rm: 0.33,
    },
    {
      id: 4,
      logistics_provider: {
        company_id: 14,
        name: "Tabuan Fleet Services",
        license_plate: "QAD 4472",
        vehicle_type: "van",
      },
      origin_region: "Tabuan Jaya Commercial Centre, Kuching",
      destination_region: "Jalan Padungan, Kuching",
      departure_window_start: "2026-06-22T13:00:00Z",
      available_capacity: {
        weight_kg: 95,
        volume_m3: 1.6,
      },
      match_status: "open",
      estimated_price_per_kg_rm: 0.55,
    },
  ],
};

const CAPACITY_FILTERS = [
  { value: "all", label: "All capacity" },
  { value: "small", label: "Under 200 kg" },
  { value: "medium", label: "200-600 kg" },
  { value: "large", label: "600 kg+" },
] as const;

type CapacityFilter = (typeof CAPACITY_FILTERS)[number]["value"];

export default function AvailableTripsPage() {
  const [search, setSearch] = useState("");
  const [capacityFilter, setCapacityFilter] = useState<CapacityFilter>("all");
  const [selected, setSelected] = useState<GetTripListingItem | null>(null);

  const filtered = MOCK_TRIP_LISTINGS.results.filter((trip) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      trip.origin_region.toLowerCase().includes(q) ||
      trip.destination_region.toLowerCase().includes(q) ||
      trip.logistics_provider.name.toLowerCase().includes(q);

    const matchesCapacity =
      capacityFilter === "all" ||
      (capacityFilter === "small" && trip.available_capacity.weight_kg < 200) ||
      (capacityFilter === "medium" &&
        trip.available_capacity.weight_kg >= 200 &&
        trip.available_capacity.weight_kg <= 600) ||
      (capacityFilter === "large" && trip.available_capacity.weight_kg > 600);

    return matchesSearch && matchesCapacity;
  });

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col px-6 py-12 sm:px-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold leading-8 tracking-tight text-zinc-900 dark:text-zinc-50">
              Available Trips
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              For companies that need logistics capacity
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-2xl font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
              {filtered.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              trips found
            </p>
          </div>
        </div>

        <ListingModeTabs />

        <div className="relative mb-4">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search trips by route or provider..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-solid border-black/[.08] bg-white pl-10 pr-4 text-sm text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-200"
          />
        </div>

        <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
          {CAPACITY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setCapacityFilter(filter.value)}
              className={`h-8 flex-shrink-0 rounded-full px-3.5 text-xs font-medium transition-colors ${
                capacityFilter === filter.value
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "border border-solid border-black/[.08] bg-white text-zinc-600 hover:border-black/[.15] dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-white/[.18]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl dark:bg-zinc-800">
              +
            </div>
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No trips found
            </p>
            <p className="mt-1 max-w-xs text-sm text-zinc-400">
              Try another route, provider, or capacity range.
            </p>
          </div>
        )}
      </main>

      {selected && (
        <TripDetail trip={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
