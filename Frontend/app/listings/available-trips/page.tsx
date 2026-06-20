"use client";

import { tripListings, companies, vehicles, toTripListingItem } from "@/lib/api";
import { useEffect, useState } from "react";
import type { GetTripListingItem, GetTripListingsResponse, TripListing } from "@/type";
import {
  CreateTripModal,
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
  const [selected, setSelected] = useState<GetTripListingItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate(trip: TripListing) {
    console.log("New trip listing:", trip);
    setShowCreate(false);
  }

  const [trips, setTrips] = useState<GetTripListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [listings, comps, vehs] = await Promise.all([
          tripListings.list({ status_filter: "open" }),
          companies.list({ limit: 200 }),
          vehicles.list({ limit: 200 }),
        ]);
        if (cancelled) return;
        const companyMap = new Map(comps.map((c) => [c.id, c]));
        const vehicleMap = new Map(vehs.map((v) => [v.id, v]));
        setTrips(
          listings.map((tl) =>
            toTripListingItem(
              tl,
              companyMap.get(tl.company_id),
              tl.vehicle_id != null ? vehicleMap.get(tl.vehicle_id) : undefined
            )
          )
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load trip listings"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = trips.filter((trip) => {
    const q = search.toLowerCase();
    return (
      !q ||
      trip.logistics_provider.name.toLowerCase().includes(q) ||
      trip.origin_region.toLowerCase().includes(q) ||
      trip.destination_region.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col flex-1 items-center bg-gray-50 min-h-screen relative">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-6 sm:px-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Available Trips
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              For companies without their own logistics team
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

        <button
          onClick={() => setShowCreate(true)}
          className="mb-6 self-start h-10 px-4 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
        >
          + List a trip
        </button>

        <ListingModeTabs />

        <div className="relative mb-6">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
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
            placeholder="Search trips by company or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-full border border-solid border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 pl-10 pr-4 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-zinc-400">Loading available trips...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-base font-semibold text-red-500">
              Couldn&apos;t load trips
            </p>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-2xl">
              +
            </div>
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No available trips found
            </p>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">
              Try adjusting your search.
            </p>
          </div>
        )}
      </main>

      {selected && (
        <TripDetail trip={selected} onClose={() => setSelected(null)} />
      )}

      {showCreate && (
        <CreateTripModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
