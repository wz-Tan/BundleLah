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
  TripListingCard,
  TrackingModal,
  type OrderRequest,
  type TripListingDisplay,
} from "@/app/components/activeOrders";

export default function ActiveOrdersPage() {
  const [mainTab, setMainTab] = useState<"requests" | "trips">("requests");
  const [subTab, setSubTab] = useState<"pending" | "completed">("pending");

  // Fetched data + load state
  // Requests tab: offers from logistics providers to carry my cargo.
  const [requests, setRequests] = useState<OrderRequest[]>([]); // pending
  const [requestsCompleted, setRequestsCompleted] = useState<OrderRequest[]>(
    []
  ); // accepted
  // Trip Listings tab: pooling requests made on my trips.
  const [trips, setTrips] = useState<TripListingDisplay[]>([]); // pending pooling
  const [tripsCompleted, setTripsCompleted] = useState<TripListingDisplay[]>(
    []
  ); // accepted handshakes (one card per accepted match)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected items for modal/pop-up logic
  const [selectedTrip, setSelectedTrip] = useState<TripListingDisplay | null>(
    null
  );
  const [selectedPoolRequest, setSelectedPoolRequest] =
    useState<OrderRequest | null>(null);
  // Trip whose IoT device tracking popup is open.
  const [trackingTrip, setTrackingTrip] = useState<TripListingDisplay | null>(
    null
  );

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
            matchId: match.id,
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

        // Resolve the counterpart company shown on a match card:
        // - an offer on my cargo -> the offering trip's company
        // - a request on my trip  -> the requesting cargo's company
        const counterpartName = (m: (typeof matches)[number]): string => {
          if (m.initiated_by === "logistics_provider") {
            const cid =
              m.trip_listing_id != null
                ? tripCompanyId.get(m.trip_listing_id)
                : undefined;
            return cid != null
              ? companyName.get(cid) ?? `Company #${cid}`
              : "Unknown company";
          }
          const cr =
            m.cargo_request_id != null
              ? cargoById.get(m.cargo_request_id)
              : undefined;
          const cid = cr?.company_id;
          return cid != null
            ? companyName.get(cid) ?? `Company #${cid}`
            : "Unknown company";
        };

        const toCardItem = (m: (typeof matches)[number]): OrderRequest => {
          const cr =
            m.cargo_request_id != null
              ? cargoById.get(m.cargo_request_id)
              : undefined;
          const price =
            m.agreed_price_rm != null
              ? Number(m.agreed_price_rm)
              : estimateBudgetRm(cr?.weight_kg);
          return {
            id: `MATCH-${m.id}`,
            matchId: m.id,
            offeredBy: counterpartName(m),
            pickup: cr?.pickup_address ?? "Unknown pickup",
            destination: cr?.dropoff_address ?? "Unknown destination",
            price,
            status: m.status ?? "pending",
          };
        };

        // Requests tab: offers on my cargo — split by pending vs accepted.
        setRequests(
          cargoOffers
            .filter((m) => (m.status ?? "pending") === "pending")
            .map(toCardItem)
        );
        setRequestsCompleted(
          cargoOffers
            .filter((m) => (m.status ?? "") === "accepted")
            .map(toCardItem)
        );

        // Trip Listings tab: pooling requests on my trips.
        const myTripIds = new Set(listings.map((tl) => tl.id));
        const tripById = new Map(listings.map((tl) => [tl.id, tl]));
        // Completed = accepted pooling requests on any of my trips. One card
        // per accepted match (each carries the match id for IoT tracking).
        setTripsCompleted(
          matches
            .filter(
              (m) =>
                (m.status ?? "") === "accepted" &&
                m.trip_listing_id != null &&
                myTripIds.has(m.trip_listing_id)
            )
            .map((m) => {
              const tl =
                m.trip_listing_id != null
                  ? tripById.get(m.trip_listing_id)
                  : undefined;
              return {
                id: `TRIP-${m.trip_listing_id}`,
                pickup: tl?.origin_region ?? "Unknown origin",
                destination: tl?.destination_region ?? "Unknown destination",
                dateTime: tl
                  ? formatDateTime(tl.departure_window_start)
                  : "—",
                status: tl?.status ?? "locked",
                poolingRequests: [],
                trackingMatchId: m.id,
              };
            })
        );

        // Pending = each trip with its still-pending pooling requests.
        setTrips(
          listings.map((tl) => ({
            id: `TRIP-${tl.id}`,
            pickup: tl.origin_region,
            destination: tl.destination_region,
            dateTime: formatDateTime(tl.departure_window_start),
            status: tl.status,
            poolingRequests: matches
              .filter(
                (m) =>
                  m.trip_listing_id === tl.id &&
                  (m.status ?? "pending") === "pending"
              )
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

  // Accept an offer to carry my cargo: mark accepted, move to Requests/Completed.
  async function handleAcceptOffer(matchId: number) {
    await cargoMatches.update(matchId, { status: "accepted" });
    setRequests((prev) => {
      const target = prev.find((r) => r.matchId === matchId);
      if (target) {
        setRequestsCompleted((acc) =>
          acc.some((a) => a.matchId === matchId)
            ? acc
            : [{ ...target, status: "accepted" }, ...acc]
        );
      }
      return prev.filter((r) => r.matchId !== matchId);
    });
  }

  // Reject an offer: marks the match rejected and drops it from the list.
  async function handleRejectOffer(matchId: number) {
    await cargoMatches.update(matchId, { status: "rejected" });
    setRequests((prev) => prev.filter((r) => r.matchId !== matchId));
  }

  // Accept a pooling request made on one of my trips (from the modal).
  async function handleAcceptPool(req: OrderRequest, trip: TripListingDisplay) {
    if (req.matchId == null) return;
    await cargoMatches.update(req.matchId, { status: "accepted" });
    // Move it into Trip Listings/Completed as a completed handshake card.
    setTripsCompleted((acc) =>
      acc.some((a) => a.trackingMatchId === req.matchId)
        ? acc
        : [
            {
              id: trip.id,
              pickup: trip.pickup,
              destination: trip.destination,
              dateTime: trip.dateTime,
              status: "accepted",
              poolingRequests: [],
              trackingMatchId: req.matchId,
            },
            ...acc,
          ]
    );
    // Drop it from the originating trip's pending pooling requests.
    setTrips((prev) =>
      prev.map((t) =>
        t.id === trip.id
          ? {
              ...t,
              poolingRequests: t.poolingRequests.filter(
                (p) => p.matchId !== req.matchId
              ),
            }
          : t
      )
    );
    handleCloseModal();
  }

  // Decline a pooling request on my trip: reject and drop it.
  async function handleDeclinePool(req: OrderRequest, trip: TripListingDisplay) {
    if (req.matchId == null) {
      handleCloseModal();
      return;
    }
    await cargoMatches.update(req.matchId, { status: "rejected" });
    setTrips((prev) =>
      prev.map((t) =>
        t.id === trip.id
          ? {
              ...t,
              poolingRequests: t.poolingRequests.filter(
                (p) => p.matchId !== req.matchId
              ),
            }
          : t
      )
    );
    handleCloseModal();
  }


  console.log(trips, tripsCompleted)
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
              Manage your active bundle requests and trip listings
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
            {/* Main Tabs */}
            <div className="flex border-b border-gray-200 gap-6">
              <button
                onClick={() => {
                  setMainTab("requests");
                  setSubTab("pending");
                }}
                className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${mainTab === "requests"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                Requests ({requests.length + requestsCompleted.length})
              </button>
              <button
                onClick={() => {
                  setMainTab("trips");
                  setSubTab("pending");
                }}
                className={`pb-3 text-sm font-medium transition-colors cursor-pointer ${mainTab === "trips"
                  ? "border-b-2 border-orange-500 text-orange-500"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
              >
                Trip Listings ({trips.length + tripsCompleted.length})
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex gap-2">
              {(() => {
                const pendingCount =
                  mainTab === "requests" ? requests.length : trips.length;
                const completedCount =
                  mainTab === "requests"
                    ? requestsCompleted.length
                    : tripsCompleted.length;
                const pillClass = (active: boolean) =>
                  `px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${active
                    ? "bg-orange-500 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`;
                return (
                  <>
                    <button
                      onClick={() => setSubTab("pending")}
                      className={pillClass(subTab === "pending")}
                    >
                      Pending ({pendingCount})
                    </button>
                    <button
                      onClick={() => setSubTab("completed")}
                      className={pillClass(subTab === "completed")}
                    >
                      Completed ({completedCount})
                    </button>
                  </>
                );
              })()}
            </div>

            {/* Requests / Pending */}
            {mainTab === "requests" && subTab === "pending" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.length === 0 ? (
                  <p className="text-sm text-gray-400 col-span-full py-8 text-center">
                    No pending offers right now.
                  </p>
                ) : (
                  requests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      onAccept={handleAcceptOffer}
                      onReject={handleRejectOffer}
                    />
                  ))
                )}
              </div>
            )}

            {/* Requests / Completed */}
            {mainTab === "requests" && subTab === "completed" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requestsCompleted.length === 0 ? (
                  <p className="text-sm text-gray-400 col-span-full py-8 text-center">
                    No accepted offers yet.
                  </p>
                ) : (
                  requestsCompleted.map((item) => (
                    <RequestCard key={item.id} request={item} />
                  ))
                )}
              </div>
            )}

            {/* Trip Listings / Pending */}
            {mainTab === "trips" && subTab === "pending" && (
              <div className="flex flex-col gap-6">
                {trips.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">
                    No trip listings yet.
                  </p>
                ) : (
                  trips.map((trip) => (
                    <TripListingCard
                      key={trip.id}
                      trip={trip}
                      onOpenPool={handleOpenPoolModal}
                    />
                  ))
                )}
              </div>
            )}

            {/* Trip Listings / Completed */}
            {mainTab === "trips" && subTab === "completed" && (
              <div className="flex flex-col gap-6">
                {tripsCompleted.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">
                    No accepted bundle requests on your trips yet.
                  </p>
                ) : (
                  tripsCompleted.map((trip) => (
                    <TripListingCard
                      key={trip.trackingMatchId ?? trip.id}
                      trip={trip}
                      showPoolingRequests={false}
                      onTrack={setTrackingTrip}
                    />
                  ))
                )}
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
          onAccept={() =>
            handleAcceptPool(selectedPoolRequest, selectedTrip)
          }
          onDecline={() =>
            handleDeclinePool(selectedPoolRequest, selectedTrip)
          }
        />
      )}

      {/* IoT Device Tracking Modal */}
      {trackingTrip && trackingTrip.trackingMatchId != null && (
        <TrackingModal
          cargoMatchId={trackingTrip.trackingMatchId}
          title={`${trackingTrip.id} · ${trackingTrip.pickup} → ${trackingTrip.destination}`}
          onClose={() => setTrackingTrip(null)}
        />
      )}
    </main>
  );
}
