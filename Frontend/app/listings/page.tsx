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
  cargoMatches,
  companies,
  buildCompanyNameMap,
  toCargoRequestItem,
} from "@/lib/api";
import { getCurrentCompanyId, getStoredCompany } from "@/lib/session";
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
  const [requests, setRequests] = useState<GetCargoRequestItem[]>([]);
  // Ids of postings created by the current user this session (cancellable).
  const [myIds, setMyIds] = useState<Set<number>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleCreate(req: CargoRequest) {
    setSubmitError(null);
    const company = getStoredCompany();
    const companyId = company?.id ?? 1;
    try {
      const created = await cargoRequests.create({
        company_id: companyId,
        pickup_address: req.pickup_address,
        pickup_lat: req.pickup_lat,
        pickup_lng: req.pickup_lng,
        dropoff_address: req.dropoff_address,
        dropoff_lat: req.dropoff_lat,
        dropoff_lng: req.dropoff_lng,
        weight_kg: req.weight_kg,
        volume_m3: req.volume_m3,
        pickup_window_start: req.pickup_window_start,
        pickup_window_end: req.pickup_window_end,
        priority_flag: req.priority_flag,
      });
      const item = toCargoRequestItem(created, company?.name ?? `Company #${companyId}`);
      // Backend has no budget column; keep the chosen budget for this session.
      if (req.budget_rm && req.budget_rm > 0) item.suggested_budget_rm = req.budget_rm;
      setRequests((prev) => [item, ...prev]);
      setMyIds((prev) => new Set(prev).add(created.id));
      setShowCreate(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save the request."
      );
    }
  }

  async function handleCancel(id: number) {
    const prevRequests = requests;
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setMyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      await cargoRequests.remove(id);
    } catch {
      // Roll back if the backend rejected the deletion.
      setRequests(prevRequests);
    }
  }

  // Offer the chosen trip to carry this cargo request.
  async function handleOfferPool(
    order: GetCargoRequestItem,
    tripListingId: number
  ) {
    await cargoMatches.create({
      trip_listing_id: tripListingId,
      cargo_request_id: order.id,
      initiated_by: "logistics_provider",
      agreed_price_rm: order.suggested_budget_rm,
    });
  }

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
        const company = getStoredCompany();
        const companyId = company?.id ?? null;
        // Make sure the current company's own name is resolvable even if it
        // isn't part of the fetched companies list.
        if (company) nameMap.set(company.id, company.name);
        // Mark the current company's own requests so they can be cancelled.
        if (companyId != null) {
          setMyIds((prev) => {
            const next = new Set(prev);
            reqs.forEach((r) => {
              if (r.company_id === companyId) next.add(r.id);
            });
            return next;
          });
        }
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

        {submitError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {submitError}
          </div>
        )}

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
              <OrderCard
                key={order.id}
                order={order}
                onSelect={setSelected}
                isOwn={myIds.has(order.id)}
                onCancel={myIds.has(order.id) ? handleCancel : undefined}
              />
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
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onOfferPool={handleOfferPool}
        />
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
