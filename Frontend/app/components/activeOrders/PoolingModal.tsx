"use client";

import type { OrderRequest, TripListingDisplay } from "./types";

interface PoolingModalProps {
  trip: TripListingDisplay;
  request: OrderRequest;
  onClose: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

export function PoolingModal({
  trip,
  request,
  onClose,
  onAccept,
  onDecline,
}: PoolingModalProps) {
  const handleAccept = onAccept ?? onClose;
  const handleDecline = onDecline ?? onClose;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl flex flex-col gap-4 my-auto">
        {/* 1. TOP POPUP: Financials & Time Metrics */}
        <div className="bg-orange-500 text-white rounded-xl p-4 shadow-lg flex justify-between items-center px-6">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
              Pooling Optimization Breakdown
            </h4>
            <p className="text-sm font-light mt-0.5">
              Accepting this pool scales up your logistics efficiency.
            </p>
          </div>
          <div className="flex gap-8 text-right">
            <div>
              <span className="text-xs opacity-80 block uppercase tracking-wide">
                Extra Earnings
              </span>
              <span className="text-xl font-bold">+RM {request.price}</span>
            </div>
            <div>
              <span className="text-xs opacity-80 block uppercase tracking-wide">
                Time Impact
              </span>
              <span className="text-xl font-bold text-green-200">
                -15 mins delay
              </span>
            </div>
          </div>
        </div>

        {/* 2. SIDE-BY-SIDE POPUPS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Side: Pool Request Info */}
          <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col justify-between border border-gray-100">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-lg">
                  Request Breakdown
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {request.id}
                </span>
              </div>

              <div className="space-y-3 mt-4 text-sm">
                <div>
                  <label className="text-xs text-gray-400 uppercase block tracking-wider">
                    Pickup Location
                  </label>
                  <p className="text-gray-900 font-medium">{request.pickup}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase block tracking-wider">
                    Dropoff Location
                  </label>
                  <p className="text-gray-900 font-medium">
                    {request.destination}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase block tracking-wider">
                    Base Payout
                  </label>
                  <p className="text-base font-semibold text-gray-900">
                    RM {request.price}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 py-2.5 rounded-xl transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 py-2.5 rounded-xl transition-colors"
              >
                Accept Pool
              </button>
            </div>
          </div>

          {/* Right Side: Re-routed Live Map Preview */}
          <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col border border-gray-100 min-h-[320px]">
            <div className="mb-3">
              <span className="text-xs font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2.5 py-1 rounded-lg">
                Optimized Route
              </span>
            </div>

            {/* Visual Route Graphic Placeholder */}
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:14px_24px]"></div>

              {/* Pseudo Route Flow */}
              <div className="flex flex-col items-start gap-4 z-10 w-full px-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                  <span className="text-gray-400">Start:</span>
                  <span className="font-semibold text-gray-700">
                    {trip.pickup}
                  </span>
                </div>
                <div className="flex items-center gap-2 border-l-2 border-dashed border-orange-400 ml-1.5 pl-3 py-1 bg-orange-50/60 rounded-r-md pr-2 w-full">
                  <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0"></span>
                  <span className="text-orange-600 font-medium">
                    Deviation:
                  </span>
                  <span className="font-semibold text-orange-800">
                    {request.pickup}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-900 shrink-0"></span>
                  <span className="text-gray-400">End:</span>
                  <span className="font-semibold text-gray-700">
                    {trip.destination}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
