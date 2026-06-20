"use client";

import { useEffect, useState } from "react";
import RequestBreakdown from "./RequestBreakdown";
import {
  cargoRequests,
  tripListings,
  cargoMatches,
  companies,
  estimateBudgetRm,
  ApiError,
} from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/session";
import {
  formatDateTime,
  RequestCard,
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

        // The Requests tab shows offers from logistics providers who want to
        // carry my cargo (matches they initiated against my cargo requests).
        const myCargoIds = new Set(cargo.map((cr) => cr.id));
        const cargoOffers = matches.filter(
          (m) =>
            m.cargo_request_id != null &&
            myCargoIds.has(m.cargo_request_id) &&
            m.initiated_by === "logistics_provider"
        );

        // Resolve who made each offer: the company owning the offering trip.
        const offerTripIds = [
          ...new Set(
            cargoOffers
              .map((m) => m.trip_listing_id)
              .filter((tid): tid is number => tid != null)
          ),
        ];
        const [offerTrips, comps] = await Promise.all([
          Promise.all(offerTripIds.map((tid) => tripListings.get(tid))),
          companies.list({ limit: 200 }),
        ]);
        if (cancelled) return;
        const tripCompanyId = new Map(
          offerTrips.map((t) => [t.id, t.company_id])
        );
        const companyName = new Map(comps.map((c) => [c.id, c.name]));

        setRequests(
          cargoOffers.map((m) => {
            const cr =
              m.cargo_request_id != null
                ? cargoById.get(m.cargo_request_id)
                : undefined;
            const companyId =
              m.trip_listing_id != null
                ? tripCompanyId.get(m.trip_listing_id)
                : undefined;
            const offeredBy =
              companyId != null
                ? companyName.get(companyId) ?? `Company #${companyId}`
                : "Unknown company";
            const price =
              m.agreed_price_rm != null
                ? Number(m.agreed_price_rm)
                : estimateBudgetRm(cr?.weight_kg);
            return {
              id: `MATCH-${m.id}`,
              matchId: m.id,
              offeredBy,
              pickup: cr?.pickup_address ?? "Unknown pickup",
              destination: cr?.dropoff_address ?? "Unknown destination",
              price,
              status: m.status ?? "pending",
            };
          })
        );

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

  const handleCloseModal = () => {
    setSelectedTrip(null);
    setSelectedPoolRequest(null);
  };

  // Accept an offer to carry my cargo: marks the match accepted.
  async function handleAcceptOffer(matchId: number) {
    await cargoMatches.update(matchId, { status: "accepted" });
    setRequests((prev) =>
      prev.map((r) =>
        r.matchId === matchId ? { ...r, status: "accepted" } : r
      )
    );
  }

  // Reject an offer: marks the match rejected and drops it from the list.
  async function handleRejectOffer(matchId: number) {
    await cargoMatches.update(matchId, { status: "rejected" });
    setRequests((prev) => prev.filter((r) => r.matchId !== matchId));
  }

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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs underline mt-1 hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        )}

        {/* Content - only show when not loading */}
        {!loading && (
          <>
            {/* Custom Tab Switcher */}
            <div className="flex border-b border-gray-200 gap-6">
              <button
                onClick={() => setActiveTab("requests")}
                className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === "requests"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                Requests ({requests.length})
              </button>
              <button
                onClick={() => setActiveTab("trips")}
                className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${activeTab === "trips"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                Trip Listings ({trips.length})
              </button>
            </div>

            {/* Requests Content */}
            {activeTab === "requests" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    onAccept={handleAcceptOffer}
                    onReject={handleRejectOffer}
                  />
                ))}
              </div>
            )}

            {/* Trip Listings Content */}
            {activeTab === "trips" && (
              <div className="flex flex-col gap-6">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    {/* Left Side: Trip Details */}
                    <div className="flex flex-col justify-between lg:border-r lg:border-gray-100 lg:pr-6">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Listing ID
                            </span>
                            <h3 className="text-sm font-bold text-gray-900">
                              {trip.id}
                            </h3>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                          {trip.dateTime}
                        </p>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div>
                            <strong className="text-gray-900">Pick Up:</strong>{" "}
                            {trip.pickup}
                          </div>
                          <div>
                            <strong className="text-gray-900">Destination:</strong>{" "}
                            {trip.destination}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                          Pooling Requests ({trip.poolingRequests.length})
                        </span>
                        <div className="flex flex-col gap-2">
                          {trip.poolingRequests.map((req) => (
                            <button
                              key={req.id}
                              onClick={() => handleOpenPoolModal(trip, req)}
                              className="w-full text-left text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 p-2.5 rounded-xl border border-orange-200/50 transition-colors flex justify-between items-center font-medium cursor-pointer"
                            >
                              <span>
                                {req.id} ({req.pickup.split(",")[0]} &rarr;{" "}
                                {req.destination.split(",")[0]})
                              </span>
                              <span className="font-bold">+RM {req.price}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Side: Map Canvas Area */}
                    <div className="lg:col-span-2 bg-orange-50/50 border border-orange-100 rounded-xl min-h-[220px] flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <span className="text-xs font-medium text-orange-400 uppercase tracking-wider z-10">
                        Route Map Visualizer
                      </span>
                      <p className="text-xs text-gray-400 mt-1 z-10">
                        {trip.pickup} &rarr; {trip.destination}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Pooling Request Modal */}
      {selectedTrip && selectedPoolRequest && (
        <RequestBreakdown
          selectedTrip={selectedTrip}
          selectedPoolRequest={selectedPoolRequest}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}
