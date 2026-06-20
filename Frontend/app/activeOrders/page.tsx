"use client";

import { useEffect, useState } from "react";

import {
  cargoRequests,
  tripListings,
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

        setRequests(
          cargo.map((cr) => ({
            id: `CR-${cr.id}`,
            pickup: cr.pickup_address,
            destination: cr.dropoff_address,
            price: estimateBudgetRm(cr.weight_kg),
            status: cr.status,
          }))
        );

        setTrips(
          listings.map((tl) => ({
            id: `TRIP-${tl.id}`,
            pickup: tl.origin_region,
            destination: tl.destination_region,
            dateTime: formatDateTime(tl.departure_window_start),
            status: tl.status,
            poolingRequests: [],
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
