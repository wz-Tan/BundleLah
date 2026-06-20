"use client";

import Link from "next/link";
import { useState } from "react";

// Mock Data Type Definitions
interface OrderRequest {
  id: string;
  pickup: string;
  destination: string;
  price: number;
  status: "pending" | "accepted";
}

interface TripListing {
  id: string;
  pickup: string;
  destination: string;
  dateTime: string;
  poolingRequests: OrderRequest[];
}

export default function ActiveOrdersPage() {
  // Tabs: "requests" or "trips"
  const [activeTab, setActiveTab] = useState<"requests" | "trips">("requests");

  // Selected items for modal/pop-up logic
  const [selectedTrip, setSelectedTrip] = useState<TripListing | null>(null);
  const [selectedPoolRequest, setSelectedPoolRequest] =
    useState<OrderRequest | null>(null);

  // Mock Data
  const requests: OrderRequest[] = [
    {
      id: "ORD-9482",
      pickup: "Port Klang, MY",
      destination: "Shah Alam, MY",
      price: 450,
      status: "pending",
    },
    {
      id: "ORD-7391",
      pickup: "Penang Port, MY",
      destination: "Ipoh, MY",
      price: 820,
      status: "accepted",
    },
  ];

  const trips: TripListing[] = [
    {
      id: "TRIP-001",
      pickup: "Johor Port, MY",
      destination: "Kuala Lumpur, MY",
      dateTime: "June 25, 2026 - 08:30 AM",
      poolingRequests: [
        {
          id: "REQ-112",
          pickup: "Melaka Hub, MY",
          destination: "Seremban, MY",
          price: 200,
          status: "pending",
        },
        {
          id: "REQ-113",
          pickup: "Muar, MY",
          destination: "Kuala Lumpur, MY",
          price: 350,
          status: "pending",
        },
      ],
    },
  ];

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

        {/* Custom Tab Switcher */}
        <div className="flex border-b border-gray-200 gap-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "requests"
                ? "border-b-2 border-orange-500 text-orange-500"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "trips"
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
                    className={`text-xs px-2.5 py-1 rounded-full font-medium uppercase tracking-wide ${
                      req.status === "accepted"
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
                          className="w-full text-left text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 p-2.5 rounded-xl border border-orange-200/50 transition-colors flex justify-between items-center font-medium"
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
      </div>

      {/* Popups overlay block */}
      {selectedTrip && selectedPoolRequest && (
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
                  <span className="text-xl font-bold">
                    +RM {selectedPoolRequest.price}
                  </span>
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
                      {selectedPoolRequest.id}
                    </span>
                  </div>

                  <div className="space-y-3 mt-4 text-sm">
                    <div>
                      <label className="text-xs text-gray-400 uppercase block tracking-wider">
                        Pickup Location
                      </label>
                      <p className="text-gray-900 font-medium">
                        {selectedPoolRequest.pickup}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase block tracking-wider">
                        Dropoff Location
                      </label>
                      <p className="text-gray-900 font-medium">
                        {selectedPoolRequest.destination}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase block tracking-wider">
                        Base Payout
                      </label>
                      <p className="text-base font-semibold text-gray-900">
                        RM {selectedPoolRequest.price}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 py-2.5 rounded-xl transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleCloseModal}
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
                        {selectedTrip.pickup}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 border-l-2 border-dashed border-orange-400 ml-1.5 pl-3 py-1 bg-orange-50/60 rounded-r-md pr-2 w-full">
                      <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0"></span>
                      <span className="text-orange-600 font-medium">
                        Deviation:
                      </span>
                      <span className="font-semibold text-orange-800">
                        {selectedPoolRequest.pickup}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-900 shrink-0"></span>
                      <span className="text-gray-400">End:</span>
                      <span className="font-semibold text-gray-700">
                        {selectedTrip.destination}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
