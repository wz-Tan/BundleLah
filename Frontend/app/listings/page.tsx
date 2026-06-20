"use client";

import {
  ListingModeTabs,
  OrderCard,
  OrderDetail,
} from "@/app/components/listings";
import type { GetCargoRequestItem } from "@/type";
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
