"use client";

import { useState } from "react";
import type { GetTripResponse } from "@/type";
import {
  ListingModeTabs,
  TripCard,
  TripDetail,
} from "@/app/components/listings";

const MOCK_TRIPS: GetTripResponse[] = [
  {
    id: 1,
    driver_id: 11,
    status: "scheduled",
    total_distance_km: 18.4,
    load_factor_pct: 62,
    route_score: 96,
    dispatched_at: "2026-06-21T08:30:00Z",
    route: {
      polyline: "",
      stops: [
        {
          order_id: "ORD-0008",
          company_name: "Kenyalang Office Supplies",
          address: "Bintawa Industrial Estate, Kuching",
          lat: 1.55,
          lng: 110.3333,
          sequence: 1,
          weight_kg: 260,
          arrived_at: null,
        },
        {
          order_id: "ORD-0010",
          company_name: "Demak Components",
          address: "Demak Laut Industrial Park, Kuching",
          lat: 1.603,
          lng: 110.287,
          sequence: 2,
          weight_kg: 160,
          arrived_at: null,
        },
      ],
    },
    driver: {
      id: 11,
      name: "Sarawak Freight Co.",
      vehicle_type: "5-ton box truck",
      license_plate: "QAA 2381",
      tier_badge: "gold",
    },
    cost_splits: [
      {
        id: 1,
        company_id: 8,
        company_name: "Kenyalang Office Supplies",
        amount_rm: 128,
        weight_share_pct: 62,
        route_share_pct: 58,
        payment_status: "pending",
        paid_at: null,
        trip_id: 1,
      },
      {
        id: 2,
        company_id: 10,
        company_name: "Demak Components",
        amount_rm: 88,
        weight_share_pct: 38,
        route_share_pct: 42,
        payment_status: "pending",
        paid_at: null,
        trip_id: 1,
      },
    ],
    cost_summary: {
      total_trip_cost_rm: 216,
      platform_fee_rm: 21.6,
      driver_earnings_rm: 194.4,
      solo_equivalent_rm: 340,
      savings_rm: 124,
    },
    carbon_log: {
      id: 1,
      co2_emitted_kg: 24,
      co2_avoided_kg: 31,
      credits_awarded: 6,
      logged_at: "2026-06-21T12:00:00Z",
    },
  },
  {
    id: 2,
    driver_id: 12,
    status: "scheduled",
    total_distance_km: 9.8,
    load_factor_pct: 48,
    route_score: 89,
    dispatched_at: "2026-06-21T09:15:00Z",
    route: {
      polyline: "",
      stops: [
        {
          order_id: "ORD-0011",
          company_name: "Pending Hardware",
          address: "Pending Industrial Park, Kuching",
          lat: 1.562,
          lng: 110.348,
          sequence: 1,
          weight_kg: 180,
          arrived_at: null,
        },
        {
          order_id: "ORD-0012",
          company_name: "Abell Retail",
          address: "Kuching City Centre",
          lat: 1.559,
          lng: 110.343,
          sequence: 2,
          weight_kg: 80,
          arrived_at: null,
        },
      ],
    },
    driver: {
      id: 12,
      name: "Kuching Consolidated Logistics",
      vehicle_type: "3-ton lorry",
      license_plate: "QAB 9027",
      tier_badge: "silver",
    },
    cost_splits: [
      {
        id: 3,
        company_id: 11,
        company_name: "Pending Hardware",
        amount_rm: 71,
        weight_share_pct: 69,
        route_share_pct: 64,
        payment_status: "pending",
        paid_at: null,
        trip_id: 2,
      },
      {
        id: 4,
        company_id: 12,
        company_name: "Abell Retail",
        amount_rm: 37,
        weight_share_pct: 31,
        route_share_pct: 36,
        payment_status: "pending",
        paid_at: null,
        trip_id: 2,
      },
    ],
    cost_summary: {
      total_trip_cost_rm: 108,
      platform_fee_rm: 10.8,
      driver_earnings_rm: 97.2,
      solo_equivalent_rm: 188,
      savings_rm: 80,
    },
    carbon_log: {
      id: 2,
      co2_emitted_kg: 13,
      co2_avoided_kg: 18,
      credits_awarded: 4,
      logged_at: "2026-06-21T13:00:00Z",
    },
  },
  {
    id: 3,
    driver_id: 13,
    status: "scheduled",
    total_distance_km: 27.2,
    load_factor_pct: 72,
    route_score: 84,
    dispatched_at: "2026-06-22T06:00:00Z",
    route: {
      polyline: "",
      stops: [
        {
          order_id: "ORD-0015",
          company_name: "Port Importers",
          address: "Kuching Port Authority, Pending",
          lat: 1.568,
          lng: 110.332,
          sequence: 1,
          weight_kg: 650,
          arrived_at: null,
        },
        {
          order_id: "ORD-0016",
          company_name: "Batu Kawa Grocers",
          address: "Batu Kawa New Township, Kuching",
          lat: 1.507,
          lng: 110.296,
          sequence: 2,
          weight_kg: 450,
          arrived_at: null,
        },
      ],
    },
    driver: {
      id: 13,
      name: "Borneo RouteLink",
      vehicle_type: "10-ton curtain sider",
      license_plate: "QAC 6615",
      tier_badge: "platinum",
    },
    cost_splits: [
      {
        id: 5,
        company_id: 15,
        company_name: "Port Importers",
        amount_rm: 202,
        weight_share_pct: 59,
        route_share_pct: 54,
        payment_status: "pending",
        paid_at: null,
        trip_id: 3,
      },
      {
        id: 6,
        company_id: 16,
        company_name: "Batu Kawa Grocers",
        amount_rm: 158,
        weight_share_pct: 41,
        route_share_pct: 46,
        payment_status: "pending",
        paid_at: null,
        trip_id: 3,
      },
    ],
    cost_summary: {
      total_trip_cost_rm: 360,
      platform_fee_rm: 36,
      driver_earnings_rm: 324,
      solo_equivalent_rm: 520,
      savings_rm: 160,
    },
    carbon_log: {
      id: 3,
      co2_emitted_kg: 41,
      co2_avoided_kg: 46,
      credits_awarded: 9,
      logged_at: "2026-06-22T11:30:00Z",
    },
  },
  {
    id: 4,
    driver_id: 14,
    status: "scheduled",
    total_distance_km: 7.1,
    load_factor_pct: 34,
    route_score: 78,
    dispatched_at: "2026-06-22T13:00:00Z",
    route: {
      polyline: "",
      stops: [
        {
          order_id: "ORD-0018",
          company_name: "Tabuan Stationery",
          address: "Tabuan Jaya Commercial Centre, Kuching",
          lat: 1.528,
          lng: 110.374,
          sequence: 1,
          weight_kg: 55,
          arrived_at: null,
        },
        {
          order_id: "ORD-0019",
          company_name: "Padungan Cafe Supply",
          address: "Jalan Padungan, Kuching",
          lat: 1.551,
          lng: 110.346,
          sequence: 2,
          weight_kg: 40,
          arrived_at: null,
        },
      ],
    },
    driver: {
      id: 14,
      name: "Tabuan Fleet Services",
      vehicle_type: "van",
      license_plate: "QAD 4472",
      tier_badge: "bronze",
    },
    cost_splits: [
      {
        id: 7,
        company_id: 18,
        company_name: "Tabuan Stationery",
        amount_rm: 32,
        weight_share_pct: 58,
        route_share_pct: 55,
        payment_status: "pending",
        paid_at: null,
        trip_id: 4,
      },
      {
        id: 8,
        company_id: 19,
        company_name: "Padungan Cafe Supply",
        amount_rm: 28,
        weight_share_pct: 42,
        route_share_pct: 45,
        payment_status: "pending",
        paid_at: null,
        trip_id: 4,
      },
    ],
    cost_summary: {
      total_trip_cost_rm: 60,
      platform_fee_rm: 6,
      driver_earnings_rm: 54,
      solo_equivalent_rm: 95,
      savings_rm: 35,
    },
    carbon_log: {
      id: 4,
      co2_emitted_kg: 8,
      co2_avoided_kg: 9,
      credits_awarded: 2,
      logged_at: "2026-06-22T15:30:00Z",
    },
  },
];

const LOAD_FILTERS = [
  { value: "all", label: "All trips" },
  { value: "open", label: "Most open" },
  { value: "balanced", label: "Balanced load" },
  { value: "nearly-full", label: "Nearly full" },
] as const;

type LoadFilter = (typeof LOAD_FILTERS)[number]["value"];

function getRouteEndpoints(trip: GetTripResponse) {
  const sortedStops = [...trip.route.stops].sort((a, b) => a.sequence - b.sequence);

  return {
    origin: sortedStops[0]?.address ?? "",
    destination: sortedStops[sortedStops.length - 1]?.address ?? "",
  };
}

export default function AvailableTripsPage() {
  const [search, setSearch] = useState("");
  const [loadFilter, setLoadFilter] = useState<LoadFilter>("all");
  const [selected, setSelected] = useState<GetTripResponse | null>(null);

  const filtered = MOCK_TRIPS.filter((trip) => {
    const q = search.toLowerCase();
    const { origin, destination } = getRouteEndpoints(trip);
    const matchesSearch =
      !q ||
      origin.toLowerCase().includes(q) ||
      destination.toLowerCase().includes(q) ||
      trip.driver.name.toLowerCase().includes(q);

    const matchesLoad =
      loadFilter === "all" ||
      (loadFilter === "open" && trip.load_factor_pct < 50) ||
      (loadFilter === "balanced" &&
        trip.load_factor_pct >= 50 &&
        trip.load_factor_pct <= 75) ||
      (loadFilter === "nearly-full" && trip.load_factor_pct > 75);

    return matchesSearch && matchesLoad;
  });

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col px-6 py-12 sm:px-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              CargoPool
            </p>
            <h1 className="text-3xl font-semibold leading-8 tracking-tight text-zinc-900 dark:text-zinc-50">
              Available Trips
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              For companies that need logistics capacity
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-2xl font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
              {filtered.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400">
              trips found
            </p>
          </div>
        </div>

        <ListingModeTabs />

        <div className="relative mb-4">
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
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
            placeholder="Search trips by route or operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-solid border-black/[.08] bg-white pl-10 pr-4 text-sm text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500 dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-200"
          />
        </div>

        <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
          {LOAD_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setLoadFilter(filter.value)}
              className={`h-8 flex-shrink-0 rounded-full px-3.5 text-xs font-medium transition-colors ${
                loadFilter === filter.value
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "border border-solid border-black/[.08] bg-white text-zinc-600 hover:border-black/[.15] dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-white/[.18]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((trip) => (
              <TripCard key={trip.id} trip={trip} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl dark:bg-zinc-800">
              +
            </div>
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No trips found
            </p>
            <p className="mt-1 max-w-xs text-sm text-zinc-400">
              Try another route, operator, or load range.
            </p>
          </div>
        )}
      </main>

      {selected && (
        <TripDetail trip={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
