"use client";

import type { ActiveOrdersTab } from "./types";

interface ActiveOrdersTabsProps {
  activeTab: ActiveOrdersTab;
  onChange: (tab: ActiveOrdersTab) => void;
  requestCount: number;
  tripCount: number;
}

export function ActiveOrdersTabs({
  activeTab,
  onChange,
  requestCount,
  tripCount,
}: ActiveOrdersTabsProps) {
  const tabClass = (isActive: boolean) =>
    `pb-3 text-sm font-medium transition-colors ${
      isActive
        ? "border-b-2 border-orange-500 text-orange-500"
        : "text-gray-400 hover:text-gray-600"
    }`;

  return (
    <div className="flex border-b border-gray-200 gap-6">
      <button
        onClick={() => onChange("requests")}
        className={tabClass(activeTab === "requests")}
      >
        Requests ({requestCount})
      </button>
      <button
        onClick={() => onChange("trips")}
        className={tabClass(activeTab === "trips")}
      >
        Trip Listings ({tripCount})
      </button>
    </div>
  );
}
