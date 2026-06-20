"use client";

import { useState } from "react";
import type {
  OrderStatus,
  GetOrderResponse,
  CreateOrderRequest,
} from "@/type"; // adjust path to match your project
import {
  CreateOrderModal,
  ListingModeTabs,
  OrderCard,
  OrderDetail,
} from "@/app/components/listings";

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ORDERS: GetOrderResponse[] = [
  {
    id: 1,
    company_id: 1,
    supplier_address: "Warehouse 5, Bintawa Industrial Estate, 93450 Kuching",
    weight_kg: 320.5,
    volume_m3: 4.2,
    pickup_lat: 1.55,
    pickup_lng: 110.3333,
    dropoff_address: "Lot 88, Demak Laut Industrial Park, Kuching",
    dropoff_lat: 1.603,
    dropoff_lng: 110.287,
    pickup_window_start: "2026-06-21T08:00:00Z",
    pickup_window_end: "2026-06-21T12:00:00Z",
    status: "dispatched",
    priority_flag: false,
    created_at: "2026-06-20T10:32:00Z",
    estimated_cost_rm: 185.2,
    trip: {
      id: 1,
      status: "in_progress",
      dispatched_at: "2026-06-21T08:15:00Z",
      driver_name: "Ahmad bin Samat",
      vehicle_plate: "QA1234B",
    },
  },
  {
    id: 2,
    company_id: 2,
    supplier_address: "Lot 7, Pending Industrial Park, Kuching",
    weight_kg: 195.0,
    volume_m3: 2.8,
    pickup_lat: 1.562,
    pickup_lng: 110.348,
    dropoff_address: "Jalan Abell, Kuching City Centre",
    dropoff_lat: 1.559,
    dropoff_lng: 110.343,
    pickup_window_start: "2026-06-21T09:00:00Z",
    pickup_window_end: "2026-06-21T13:00:00Z",
    status: "grouped",
    priority_flag: false,
    created_at: "2026-06-20T11:05:00Z",
    estimated_cost_rm: 113.1,
    trip: null,
  },
  {
    id: 3,
    company_id: 3,
    supplier_address: "Wisma Saberkas Loading Bay, Kuching",
    weight_kg: 510.0,
    volume_m3: 6.1,
    pickup_lat: 1.547,
    pickup_lng: 110.341,
    dropoff_address: "Kuching Sentral, Jalan Padungan",
    dropoff_lat: 1.551,
    dropoff_lng: 110.346,
    pickup_window_start: "2026-06-22T07:30:00Z",
    pickup_window_end: "2026-06-22T11:30:00Z",
    status: "pending",
    priority_flag: true,
    created_at: "2026-06-20T14:18:00Z",
    estimated_cost_rm: 240.0,
    trip: null,
  },
  {
    id: 4,
    company_id: 1,
    supplier_address: "CMS Depot, Jalan Bako, Kuching",
    weight_kg: 88.0,
    volume_m3: 1.4,
    pickup_lat: 1.558,
    pickup_lng: 110.352,
    dropoff_address: "Tabuan Jaya Commercial Centre, Kuching",
    dropoff_lat: 1.528,
    dropoff_lng: 110.374,
    pickup_window_start: "2026-06-22T08:00:00Z",
    pickup_window_end: "2026-06-22T14:00:00Z",
    status: "pending",
    priority_flag: false,
    created_at: "2026-06-20T15:44:00Z",
    estimated_cost_rm: 62.5,
    trip: null,
  },
  {
    id: 5,
    company_id: 4,
    supplier_address: "Kuching Port Authority, Pending",
    weight_kg: 750.0,
    volume_m3: 9.3,
    pickup_lat: 1.568,
    pickup_lng: 110.332,
    dropoff_address: "Batu Kawa New Township, Kuching",
    dropoff_lat: 1.507,
    dropoff_lng: 110.296,
    pickup_window_start: "2026-06-23T06:00:00Z",
    pickup_window_end: "2026-06-23T10:00:00Z",
    status: "pending",
    priority_flag: false,
    created_at: "2026-06-20T16:00:00Z",
    estimated_cost_rm: 320.0,
    trip: null,
  },
];

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<GetOrderResponse[]>(MOCK_ORDERS);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState<OrderStatus | "all">("all");
  const [showCreate, setShowCreate]       = useState(false);
  const [selected, setSelected]           = useState<GetOrderResponse | null>(null);

  const filtered = orders.filter(o => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      o.supplier_address.toLowerCase().includes(q) ||
      o.dropoff_address.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  function handleCreate(req: CreateOrderRequest) {
    // In production, POST to /orders then refetch; here we optimistically append.
    const newOrder: GetOrderResponse = {
      id: orders.length + 1,
      company_id: req.company_id,
      supplier_address: req.supplier_address,
      pickup_lat: req.pickup_lat,
      pickup_lng: req.pickup_lng,
      dropoff_address: req.dropoff_address,
      dropoff_lat: req.dropoff_lat,
      dropoff_lng: req.dropoff_lng,
      weight_kg: req.weight_kg,
      volume_m3: req.volume_m3,
      pickup_window_start: req.pickup_window_start,
      pickup_window_end: req.pickup_window_end,
      status: "pending",
      priority_flag: req.priority_flag,
      created_at: new Date().toISOString(),
      estimated_cost_rm: Math.round(req.weight_kg * 0.4 + req.volume_m3 * 10),
      trip: null,
    };
    setOrders(prev => [newOrder, ...prev]);
    setShowCreate(false);
  }

  const statusTabs: Array<{ value: OrderStatus | "all"; label: string }> = [
    { value: "all",        label: "All"        },
    { value: "pending",    label: "Pending"    },
    { value: "grouped",    label: "Grouped"    },
    { value: "dispatched", label: "Dispatched" },
    { value: "delivered",  label: "Delivered"  },
  ];

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black font-sans min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-6 sm:px-16">

        {/* Page header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold mb-1">
              CargoPool
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-8">
              Pool Requests
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              For companies with their own logistics team
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex h-11 items-center gap-2 rounded-full bg-zinc-900 dark:bg-zinc-50 px-5 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors flex-shrink-0"
          >
            <span className="text-lg leading-none">+</span>
            New Order
          </button>
        </div>

        <ListingModeTabs />

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none" stroke="currentColor" strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search pool requests by address…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 rounded-full border border-solid border-black/[.08] dark:border-white/[.1] bg-white dark:bg-zinc-900 pl-10 pr-4 text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {statusTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex-shrink-0 h-8 px-3.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900"
                  : "bg-white dark:bg-zinc-900 border border-solid border-black/[.08] dark:border-white/[.1] text-zinc-600 dark:text-zinc-400 hover:border-black/[.15] dark:hover:border-white/[.18]"
              }`}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className={`ml-1.5 tabular-nums ${statusFilter === tab.value ? "opacity-60" : "text-zinc-400"}`}>
                  {orders.filter(o => o.status === tab.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-2xl">
              📦
            </div>
            <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
              No pool requests found
            </p>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">
              {search
                ? "Try adjusting your search or filters."
                : "New shipper requests will appear here when they need spare logistics capacity."}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-5 h-10 px-5 rounded-full bg-zinc-900 dark:bg-zinc-50 text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-700 transition-colors"
              >
                Place an order
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreate && (
        <CreateOrderModal onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
      {selected && (
        <OrderDetail order={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
