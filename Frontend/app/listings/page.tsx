"use client";

import type { GetCargoRequestItem, CargoRequest } from "@/type";
import {
  CreateCargoRequestModal,
  ListingModeTabs,
  OrderCard,
  OrderDetail,
} from "@/app/components/listings";
import {
  cargoRequests,
  companies,
  buildCompanyNameMap,
  toCargoRequestItem,
} from "@/lib/api";
import { useEffect, useState } from "react";

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
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate(req: CargoRequest) {
    console.log("New cargo request:", req);
    setShowCreate(false);
  }

  const [requests, setRequests] = useState<GetCargoRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [reqs, comps] = await Promise.all([
          cargoRequests.list({ status_filter: "open" }),
          companies.list({ limit: 200 }),
        ]);
        if (cancelled) return;
        const nameMap = buildCompanyNameMap(comps);
        setRequests(
          reqs.map((r) =>
            toCargoRequestItem(
              r,
              nameMap.get(r.company_id) ?? `Company #${r.company_id}`
            )
          )
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load cargo requests"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = requests.filter((request) => {
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
    <div className="flex flex-col flex-1 items-center bg-gray-50 min-h-screen relative">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-6 sm:px-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Pool Requests
            </h1>
            <p className="text-sm text-zinc-500  mt-1">
              For companies with their own logistics team
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {filtered.length}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              requests found
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="mb-6 self-start h-10 px-4 rounded-full bg-orange-500 text-white  text-sm font-semibold hover:bg-orange-400 transition-colors"
        >
          + New request
        </button>

        <ListingModeTabs />

        <div className="relative mb-4">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
            className="w-full h-11 rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-orange-400 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {PRIORITY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setPriorityFilter(filter.value)}
              className={`flex-shrink-0 h-8 px-4 rounded-xl text-xs font-medium transition-colors ${
                priorityFilter === filter.value
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-zinc-400">Loading pool requests...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-base font-semibold text-red-500">
              Couldn&apos;t load requests
            </p>
            <p className="text-sm text-zinc-400 mt-1 max-w-xs">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-gray-200 bg-white p-6">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mb-4 text-2xl font-semibold">
              +
            </div>
            <p className="font-semibold text-gray-900">
              No pool requests found
            </p>
            <p className="text-xs text-gray-400 mt-0.5 max-w-xs">
              Try adjusting your search or filters.
            </p>
          </div>
        )}
      </main>

      {selected && (
        <OrderDetail order={selected} onClose={() => setSelected(null)} />
      )}

      {showCreate && (
        <CreateCargoRequestModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
