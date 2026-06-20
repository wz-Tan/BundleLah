"use client";

import { useEffect, useState } from "react";

import {
  cargoRequests,
  tripListings,
  cargoMatches,
  estimateBudgetRm,
  ApiError,
} from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/session";
import {
  ActiveOrdersTabs,
  RequestCard,
  TripListingCard,
  PoolingModal,
  formatDateTime,
  type ActiveOrdersTab,
  type OrderRequest,
  type TripListingDisplay,
} from "@/app/components/activeOrders";

export default function ActiveOrdersPage() {
  const [activeTab, setActiveTab] = useState<ActiveOrdersTab>("requests");

  // Fetched data + load state
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [trips, setTrips] = useState<TripListingDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected items for modal/pop-up logic
  const [selectedTrip, setSelectedTrip] = useState<TripListingDisplay | null>(
    null
  );
  const [selectedPoolRequest, setSelectedPoolRequest] =
    useState<OrderRequest | null>(null);

  useEffect(() => {
    const companyId = getCurrentCompanyId();
    if (companyId === null) {
      setError("You need to be logged in to view your orders.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load(id: number) {
      setLoading(true);
      setError(null);
      try {
        const [cargo, listings] = await Promise.all([
          cargoRequests.list({ company_id: id }),
          tripListings.list({ company_id: id }),
        ]);
        if (cancelled) return;

        // Pull pooling requests/offers (cargo_matches) tied to this company,
        // both as the trip owner and as the cargo owner.
        const matchLists = await Promise.all([
          ...listings.map((tl) =>
            cargoMatches.list({ trip_listing_id: tl.id })
          ),
          ...cargo.map((cr) => cargoMatches.list({ cargo_request_id: cr.id })),
        ]);
        if (cancelled) return;

        // Dedupe matches by id.
        const matchById = new Map<number, (typeof matchLists)[number][number]>();
        for (const list of matchLists) {
          for (const m of list) matchById.set(m.id, m);
        }
        const matches = [...matchById.values()];

        // Resolve cargo request details for every match (fetch any we don't
        // already have from this company's own requests).
        const cargoById = new Map(cargo.map((cr) => [cr.id, cr]));
        const missingIds = [
          ...new Set(
            matches
              .map((m) => m.cargo_request_id)
              .filter(
                (cid): cid is number => cid != null && !cargoById.has(cid)
              )
          ),
        ];
        const fetched = await Promise.all(
          missingIds.map((cid) => cargoRequests.get(cid))
        );
        if (cancelled) return;
        for (const cr of fetched) cargoById.set(cr.id, cr);

        const toOrderRequest = (
          match: (typeof matches)[number]
        ): OrderRequest => {
          const cr =
            match.cargo_request_id != null
              ? cargoById.get(match.cargo_request_id)
              : undefined;
          const price =
            match.agreed_price_rm != null
              ? Number(match.agreed_price_rm)
              : estimateBudgetRm(cr?.weight_kg);
          return {
            id: `MATCH-${match.id}`,
            pickup: cr?.pickup_address ?? "Unknown pickup",
            destination: cr?.dropoff_address ?? "Unknown destination",
            price,
            status: match.status ?? "pending",
          };
        };

        // Requests tab: every pooling request/offer involving this company.
        setRequests(matches.map(toOrderRequest));

        // Trip Listings tab: each trip with the pooling requests made on it.
        setTrips(
          listings.map((tl) => ({
            id: `TRIP-${tl.id}`,
            pickup: tl.origin_region,
            destination: tl.destination_region,
            dateTime: formatDateTime(tl.departure_window_start),
            status: tl.status,
            poolingRequests: matches
              .filter((m) => m.trip_listing_id === tl.id)
              .map(toOrderRequest),
          }))
        );
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? `Failed to load orders (${err.status}): ${err.message}`
            : "Failed to load orders. Is the backend running?";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load(companyId);

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenPoolModal = (
    trip: TripListingDisplay,
    req: OrderRequest
  ) => {
    setSelectedTrip(trip);
    setSelectedPoolRequest(req);
  };

  const handleDeleteRequest = async (id: string) => {
    // Card ids look like "CR-123"; the backend wants the raw numeric id.
    const numericId = Number(id.replace(/^CR-/, ""));
    if (Number.isNaN(numericId)) return;

    const prev = requests;
    setRequests((current) => current.filter((r) => r.id !== id));
    try {
      await cargoRequests.remove(numericId);
    } catch {
      // Restore the list if the backend rejected the deletion.
      setRequests(prev);
    }
  };

  const handleCloseModal = () => {
    setSelectedTrip(null);
    setSelectedPoolRequest(null);
  };

  console.log(requests, trips)
  return (
    <main className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Active Orders
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your active container requests and trip listings
            </p>
          </div>
        </div>

        <ActiveOrdersTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          requestCount={requests.length}
          tripCount={trips.length}
        />

        {/* Loading / error states */}
        {loading && (
          <div className="py-16 text-center text-sm text-gray-400">
            Loading your orders…
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {/* Requests Content */}
        {!loading && !error && activeTab === "requests" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.length === 0 && (
              <p className="text-sm text-gray-400 col-span-full">
                No cargo requests yet.
              </p>
            )}
            {requests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}

        {/* Trip Listings Content */}
        {!loading && !error && activeTab === "trips" && (
          <div className="flex flex-col gap-6">
            {trips.length === 0 && (
              <p className="text-sm text-gray-400">No trip listings yet.</p>
            )}
            {trips.map((trip) => (
              <TripListingCard
                key={trip.id}
                trip={trip}
                onOpenPool={handleOpenPoolModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pooling detail modal */}
      {selectedTrip && selectedPoolRequest && (
        <PoolingModal
          trip={selectedTrip}
          request={selectedPoolRequest}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}
