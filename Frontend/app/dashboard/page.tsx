"use client";

import { useState, useRef, useEffect } from "react";
import { CargoMap } from "../components/CargoMap";

const PANELS = [
  {
    id: "carbon",
    label: "Carbon Footprint Reduction",
    value: "147 kg",
    sub: "CO₂ offset this month",
    detail: [
      { label: "Shared rides", value: "106 kg" },
      { label: "Route optimisation", value: "41 kg" },
      { label: "Monthly goal", value: "500 kg" },
      { label: "Progress", value: "29%" },
    ],
  },
  {
    id: "money",
    label: "Money Made or Saved",
    value: "RM 1,050",
    sub: "combined this week",
    detail: [
      { label: "Saved as buyer", value: "RM 840" },
      { label: "Earned as driver", value: "RM 210" },
      { label: "Deliveries made", value: "2" },
      { label: "Avg saving/order", value: "RM 62" },
    ],
  },
  {
    id: "pending",
    label: "Pending Cargo",
    value: "4 orders",
    sub: "2 in transit · 2 queued",
    detail: [
      { label: "Office stationery", value: "In transit" },
      { label: "Cleaning supplies", value: "Pooling" },
      { label: "Hardware parts", value: "Scheduled" },
      { label: "Packaging", value: "Queued" },
    ],
  },
];

// Mock notifications data
const NOTIFICATIONS = [
  { id: 1, message: "Cargo 'Office stationery' has entered transit.", time: "10m ago" },
  { id: 2, message: "Route optimization saved you an additional RM 12!", time: "1h ago" },
  { id: 3, message: "New pool match found for 'Cleaning supplies'.", time: "3h ago" },
];

export default function DashboardPage() {
  const [active, setActive] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close the notification popup if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const hasNotifications = notifications.length > 0;

  return (
    <main className="mx-12 my-8 relative min-h-screen pb-24">
      <div className="grid grid-cols-10 gap-6">
        {/* 7-col left */}
        <div className="col-span-7 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Cargo Progress</h2>
          <div className="flex-1 min-h-196 rounded-xl border border-gray-200 overflow-hidden">
            <CargoMap
              center={{ lat: 1.3521, lng: 103.8198 }}
              markers={[
                { lat: 1.3521, lng: 103.8198, label: "Origin" },
                { lat: 22.3193, lng: 114.1694, label: "Current position" },
                { lat: 35.6762, lng: 139.6503, label: "Destination" },
              ]}
            />
          </div>
        </div>

        {/* 3-col right */}
        <div className="col-span-3 flex flex-col gap-4">
          {PANELS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className="w-full text-left rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-orange-400 hover:bg-orange-50 transition-all duration-150"
            >
              <span className="text-xs text-gray-400 uppercase tracking-wide">
                {label}
              </span>
              <p className="text-2xl font-semibold text-gray-900 mt-1">
                {PANELS.find((p) => p.id === id)?.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {PANELS.find((p) => p.id === id)?.sub}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {active && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setActive(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1">
              {PANELS.find((p) => p.id === active)?.label}
            </h3>
            <p className="text-3xl font-bold text-orange-500 mb-4">
              {PANELS.find((p) => p.id === active)?.value}
            </p>
            <div className="divide-y divide-gray-100">
              {PANELS.find((p) => p.id === active)?.detail.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between py-2.5 text-sm"
                >
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActive(null)}
              className="mt-6 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- Notification Component System --- */}
      <div className="fixed bottom-8 right-12 z-40" ref={popoverRef}>
        {/* Small Popup Alerts */}
        {showNotifications && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h4 className="font-semibold text-sm text-gray-800">Alerts</h4>
              {hasNotifications && (
                <button 
                  onClick={() => setNotifications([])}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {hasNotifications ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <p className="text-sm text-gray-700 leading-snug">{notif.message}</p>
                    <span className="text-xs text-gray-400 block mt-1">{notif.time}</span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">
                  No new notifications
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-3.5 rounded-full shadow-lg border transition-all duration-200 focus:outline-none ${
            showNotifications
              ? "bg-orange-500 border-orange-500 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-500"
          }`}
        >
          {/* Bell Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>

          {/* Circle indicator on top right */}
          {hasNotifications && (
            <span className="absolute top-0 right-0 block h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
      </div>
    </main>
  );
}