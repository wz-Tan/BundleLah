"use client";

import { ListingModeTabs, TripCard, TripDetail } from "@/app/components/listings";
import type { GetTripListingItem } from "@/type";
import { tripListings, companies, vehicles, toTripListingItem } from "@/lib/api";
import { useEffect, useState } from "react";

export default function AvailableTripsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GetTripListingItem | null>(null);

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
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black font-sans min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-6 sm:px-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-8">
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
    </div>
  );
}
