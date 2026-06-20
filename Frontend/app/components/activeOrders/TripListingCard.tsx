"use client";

import { RouteMap } from "./RouteMap";
import type { OrderRequest, TripListingDisplay } from "./types";

interface TripListingCardProps {
  trip: TripListingDisplay;
  onOpenPool?: (trip: TripListingDisplay, request: OrderRequest) => void;
  // Hide the pooling requests section (e.g. for completed trips).
  showPoolingRequests?: boolean;
  // When provided, the route panel becomes clickable to open IoT tracking.
  onTrack?: (trip: TripListingDisplay) => void;
}

export function TripListingCard({
  trip,
  onOpenPool,
  showPoolingRequests = true,
  onTrack,
}: TripListingCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Side: Trip Details */}
      <div className="flex flex-col justify-between lg:border-r lg:border-gray-100 lg:pr-6">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Listing ID
              </span>
              <h3 className="text-sm font-bold text-gray-900">{trip.id}</h3>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-4">{trip.dateTime}</p>

          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <strong className="text-gray-900">Pick Up:</strong> {trip.pickup}
            </div>
            <div>
              <strong className="text-gray-900">Destination:</strong>{" "}
              {trip.destination}
            </div>
          </div>
        </div>

        {showPoolingRequests && (
          <div className="mt-6">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">
              Pooling Requests ({trip.poolingRequests.length})
            </span>
            <div className="flex flex-col gap-2">
              {trip.poolingRequests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => onOpenPool?.(trip, req)}
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
        )}
      </div>

      {/* Right Side: Map / Tracking panel */}
      {onTrack ? (
        <button
          type="button"
          onClick={() => onTrack(trip)}
          className="lg:col-span-2 bg-orange-50/50 border border-orange-100 rounded-xl min-h-[220px] flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:bg-orange-100/60 transition-colors group"
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <span className="z-10 mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            View Live IoT Tracking
          </span>
          <p className="text-xs text-gray-400 z-10">
            {trip.pickup} &rarr; {trip.destination}
          </p>
          <span className="z-10 mt-2 text-[10px] text-orange-400 group-hover:text-orange-500">
            Click to open device tracking
          </span>
        </button>
      ) : (
        <div className="lg:col-span-2 bg-orange-50/50 border border-orange-100 rounded-xl h-[260px] overflow-hidden">
          <RouteMap pickup={trip.pickup} destination={trip.destination} />
        </div>
      )}
    </div>
  );
}
