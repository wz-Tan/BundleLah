"use client";

import { useState } from "react";
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

export default function DashboardPage() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <main className="mx-12 my-8">
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
    </main>
  );
}
