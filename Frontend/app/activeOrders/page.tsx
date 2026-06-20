"use client";

import { useState, useEffect } from "react";
import RequestBreakdown from "./RequestBreakdown";
import {
  fetchCargoRequests,
  fetchTripListings,
  fetchCargoMatches,
  fetchCargoRequestById,
} from "@/app/services/listings";

// Display types for the UI
interface OrderRequest {
  id: string;
  pickup: string;
  destination: string;
  price: number;
  status: "pending" | "accepted";
  cargoRequestId?: number; // Store the actual backend ID
  cargoMatchId?: number; // Store the match ID
}

interface TripListing {
  id: string;
  pickup: string;
  destination: string;
  dateTime: string;
  poolingRequests: OrderRequest[];
  tripListingId?: number; // Store the actual backend ID
}

export default function ActiveOrdersPage() {
  // Tabs: "requests" or "trips"
  const [activeTab, setActiveTab] = useState<"requests" | "trips">("requests");

  // Selected items for modal/pop-up logic
  const [selectedTrip, setSelectedTrip] = useState<TripListing | null>(null);
  const [selectedPoolRequest, setSelectedPoolRequest] =
    useState<OrderRequest | null>(null);

  // Data from backend
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [trips, setTrips] = useState<TripListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch cargo requests for the current user
      // TODO: Replace with actual company_id from auth context
      const cargoRequests = await fetchCargoRequests({
        // company_id: currentUser.company_id,
        limit: 50,
      });

      // Transform cargo requests to OrderRequest format
      const transformedRequests: OrderRequest[] = cargoRequests.map((req) => ({
        id: `ORD-${req.id}`,
        pickup: req.pickup_address,
        destination: req.dropoff_address,
        price: 0, // TODO: Get price from cargo match or calculate
        status: req.status === "matched" || req.status === "in_transit" ? "accepted" : "pending",
        cargoRequestId: req.id,
      }));

      setRequests(transformedRequests);

      // Fetch trip listings for the current user
      const tripListings = await fetchTripListings({
        // company_id: currentUser.company_id,
        limit: 50,
      });

      // For each trip listing, fetch associated cargo matches
      const transformedTrips: TripListing[] = await Promise.all(
        tripListings.map(async (trip) => {
          // Fetch cargo matches for this trip
          const matches = await fetchCargoMatches({
            trip_listing_id: trip.id,
          });

          // Fetch cargo request details for each match
          const poolingRequests: OrderRequest[] = await Promise.all(
            matches.map(async (match) => {
              const cargoReq = await fetchCargoRequestById(match.cargo_request_id);
              return {
                id: `REQ-${match.id}`,
                pickup: cargoReq.pickup_address,
                destination: cargoReq.dropoff_address,
                price: match.agreed_price_rm,
                status: match.status === "accepted" ? "accepted" : "pending",
                cargoRequestId: cargoReq.id,
                cargoMatchId: match.id,
              };
            })
          );

          return {
            id: `TRIP-${trip.id}`,
            pickup: trip.origin_region,
            destination: trip.destination_region,
            dateTime: new Date(trip.departure_window_start).toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            poolingRequests,
            tripListingId: trip.id,
          };
        })
      );

      setTrips(transformedTrips);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenPoolModal = (trip: TripListing, req: OrderRequest) => {
    setSelectedTrip(trip);
    setSelectedPoolRequest(req);
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchAllData}
              className="text-xs underline mt-1 hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        )}

        {/* Content - only show when not loading */}
        {!isLoading && (
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
                  <div
                    key={req.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Order ID
                        </span>
                        <h3 className="text-sm font-bold text-gray-900">
                          {req.id}
                        </h3>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${req.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                          }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div>
                        <strong className="text-gray-900">Pick Up:</strong>{" "}
                        {req.pickup}
                      </div>
                      <div>
                        <strong className="text-gray-900">Destination:</strong>{" "}
                        {req.destination}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-medium uppercase">
                        Price
                      </span>
                      <span className="text-lg font-semibold text-orange-500">
                        RM {req.price}
                      </span>
                    </div>
                  </div>
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
