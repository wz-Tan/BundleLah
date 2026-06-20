"use client";

import {
  ListingModeTabs,
  OrderCard,
  OrderDetail,
} from "@/app/components/listings";
import type { GetCargoRequestItem } from "@/type";
import { useState } from "react";

const MOCK_CARGO_REQUESTS: GetCargoRequestItem[] = [
  {
    id: 1,
    sender_company: "Kenyalang Office Supplies",
    pickup: {
      address: "Warehouse 5, Bintawa Industrial Estate, 93450 Kuching",
      lat: 1.55,
      lng: 110.3333,
      window_start: "2026-06-21T08:00:00Z",
    },
    dropoff: {
      address: "Lot 88, Demak Laut Industrial Park, Kuching",
      lat: 1.603,
      lng: 110.287,
    },
    cargo_details: {
      weight_kg: 320.5,
      volume_m3: 4.2,
    },
    priority_flag: false,
    suggested_budget_rm: 185.2,
  },
  {
    id: 2,
    sender_company: "Pending Hardware",
    pickup: {
      address: "Lot 7, Pending Industrial Park, Kuching",
      lat: 1.562,
      lng: 110.348,
      window_start: "2026-06-21T09:00:00Z",
    },
    dropoff: {
      address: "Jalan Abell, Kuching City Centre",
      lat: 1.559,
      lng: 110.343,
    },
    cargo_details: {
      weight_kg: 195,
      volume_m3: 2.8,
    },
    priority_flag: false,
    suggested_budget_rm: 113.1,
  },
  {
    id: 3,
    sender_company: "Saberkas Electronics",
    pickup: {
      address: "Wisma Saberkas Loading Bay, Kuching",
      lat: 1.547,
      lng: 110.341,
      window_start: "2026-06-22T07:30:00Z",
    },
    dropoff: {
      address: "Kuching Sentral, Jalan Padungan",
      lat: 1.551,
      lng: 110.346,
    },
    cargo_details: {
      weight_kg: 510,
      volume_m3: 6.1,
    },
    priority_flag: true,
    suggested_budget_rm: 240,
  },
  {
    id: 4,
    sender_company: "CMS Materials",
    pickup: {
      address: "CMS Depot, Jalan Bako, Kuching",
      lat: 1.558,
      lng: 110.352,
      window_start: "2026-06-22T08:00:00Z",
    },
    dropoff: {
      address: "Tabuan Jaya Commercial Centre, Kuching",
      lat: 1.528,
      lng: 110.374,
    },
    cargo_details: {
      weight_kg: 88,
      volume_m3: 1.4,
    },
    priority_flag: false,
    suggested_budget_rm: 62.5,
  },
  {
    id: 5,
    sender_company: "Port Importers",
    pickup: {
      address: "Kuching Port Authority, Pending",
      lat: 1.568,
      lng: 110.332,
      window_start: "2026-06-23T06:00:00Z",
    },
    dropoff: {
      address: "Batu Kawa New Township, Kuching",
      lat: 1.507,
      lng: 110.296,
    },
    cargo_details: {
      weight_kg: 750,
      volume_m3: 9.3,
    },
    priority_flag: false,
    suggested_budget_rm: 320,
  },
];

const PRIORITY_FILTERS = [
  { value: "all", label: "All requests" },
  { value: "priority", label: "Priority" },
  { value: "standard", label: "Standard" },
] as const;

type PriorityFilter = (typeof PRIORITY_FILTERS)[number]["value"];

export default function CargoRequestsPage() {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [selected, setSelected] = useState<GetCargoRequestItem | null>(null);

  const filtered = MOCK_CARGO_REQUESTS.filter((request) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      request.sender_company.toLowerCase().includes(q) ||
      request.pickup.address.toLowerCase().includes(q) ||
      request.dropoff.address.toLowerCase().includes(q);
    const matchesPriority =
      priorityFilter === "all" ||
      (priorityFilter === "priority" && request.priority_flag) ||
      (priorityFilter === "standard" && !request.priority_flag);

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black font-sans min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-6 sm:px-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-8">
              Pool Requests
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              For companies with their own logistics team
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-2xl font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
              {filtered.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              requests found
            </p>
          </div>
        </div>

        <ListingModeTabs />

        <div className="relative mb-4">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search pool requests by company or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-full border border-solid border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 pl-10 pr-4 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {PRIORITY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setPriorityFilter(filter.value)}
              className={`flex-shrink-0 h-8 px-3.5 rounded-full text-xs font-medium transition-colors ${
                priorityFilter === filter.value
                  ? "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900"
                  : "bg-white dark:bg-zinc-900 border border-solid border-black/[.08] dark:border-white/[.1] text-zinc-600 dark:text-zinc-400 hover:border-black/[.15] dark:hover:border-white/[.18]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-2xl">
              +
            </div>
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No pool requests found
            </p>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </main>

      {selected && (
        <OrderDetail order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
