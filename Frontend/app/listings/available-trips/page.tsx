"use client";

import { tripListings, companies, vehicles, cargoRequests, cargoMatches, toTripListingItem } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/session";
import { useEffect, useState } from "react";
import type { GetTripListingItem, TripListing } from "@/type";
import {
  CreateTripModal,
  ListingModeTabs,
  TripCard,
  TripDetail
} from "@/app/components/listings";

export default function AvailableTripsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GetTripListingItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [trips, setTrips] = useState<GetTripListingItem[]>([]);
  // Ids of trips listed by the current user this session (cancellable).
  const [myIds, setMyIds] = useState<Set<number>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleCreate(trip: TripListing) {
    setSubmitError(null);
    const companyId = getCurrentCompanyId() ?? 1;
    try {
      const created = await tripListings.create({
        company_id: companyId,
        vehicle_id: trip.vehicle_id ?? undefined,
        origin_region: trip.origin_region,
        destination_region: trip.destination_region,
        // Persist the chosen price inside route_json (no dedicated column).
        route_json: {
          ...(trip.route_json && typeof trip.route_json === "object"
            ? (trip.route_json as Record<string, unknown>)
            : {}),
          price_per_kg_rm: trip.price_per_kg_rm,
        },
        departure_window_start: trip.departure_window_start,
        available_weight_kg: trip.available_weight_kg,
        available_volume_m3: trip.available_volume_m3,
      });
      const item = toTripListingItem(created, undefined, undefined);
      setTrips((prev) => [item, ...prev]);
      setMyIds((prev) => new Set(prev).add(created.id));
      setShowCreate(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save the trip."
      );
    }
  }

  async function handleCancel(id: number) {
    const prevTrips = trips;
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setMyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      await tripListings.remove(id);
    } catch {
      setTrips(prevTrips);
    }
  }

  // Request to put one of the current company's open cargo requests on this trip.
  async function handleRequestPool(trip: GetTripListingItem) {
    const companyId = getCurrentCompanyId() ?? 1;
    const myCargo = await cargoRequests.list({
      company_id: companyId,
      status_filter: "open",
    });
    if (myCargo.length === 0) {
      throw new Error(
        "Create a cargo request first before requesting to pool on a trip."
      );
    }
    const cargo = myCargo[0];
    const pricePerKg = trip.estimated_price_per_kg_rm;
    await cargoMatches.create({
      trip_listing_id: trip.id,
      cargo_request_id: cargo.id,
      initiated_by: "shipper",
      agreed_price_rm:
        pricePerKg != null && cargo.weight_kg != null
          ? Math.round(pricePerKg * cargo.weight_kg * 100) / 100
          : undefined,
    });
  }

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
        const companyId = getCurrentCompanyId();
        // Mark the current company's own trips so they can be cancelled.
        if (companyId != null) {
          setMyIds((prev) => {
            const next = new Set(prev);
            listings.forEach((tl) => {
              if (tl.company_id === companyId) next.add(tl.id);
            });
            return next;
          });
        }
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
            <p className="text-sm text-zinc-500 mt-1">
              For companies without their own logistics team
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-2xl font-bold text-zinc-900 tabular-nums">
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

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </div>
        )}

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
            className="w-full h-11 rounded-full border border-solid border-black/[.08]  bg-white pl-10 pr-4 text-sm text-zinc-800 placeholder:text-zinc-400 outline-none focus:border-amber-400 transition-colors"
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
              <TripCard
                key={trip.id}
                trip={trip}
                onSelect={setSelected}
                onCancel={myIds.has(trip.id) ? handleCancel : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4 text-2xl">
              +
            </div>
            <p className="text-base font-semibold text-zinc-700">
              No available trips found
            </p>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">
              Try adjusting your search.
            </p>
          </div>
        )}
      </main>

      {selected && (
        <TripDetail
          trip={selected}
          onClose={() => setSelected(null)}
          onRequestPool={handleRequestPool}
        />
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
