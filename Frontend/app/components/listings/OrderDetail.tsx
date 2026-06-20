"use client";

import { useEffect, useState } from "react";
import type { GetCargoRequestItem, TripListing } from "@/type";
import { tripListings, cargoMatches } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/session";
import { formatTime } from "./listingUtils";

export function OrderDetail({
  order,
  onClose,
}: {
  order: GetCargoRequestItem;
  onClose: () => void;
}) {
  const pickupStart = order.pickup.window_start
    ? formatTime(order.pickup.window_start)
    : "Flexible";

  const [myTrips, setMyTrips] = useState<TripListing[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const companyId = getCurrentCompanyId();
    if (companyId == null) {
      setLoadingTrips(false);
      return;
    }
    tripListings
      .list({ company_id: companyId, status_filter: "open" })
      .then((trips) => {
        if (cancelled) return;
        setMyTrips(trips);
        setSelectedTripId(trips[0]?.id ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingTrips(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleOffer() {
    if (selectedTripId == null) return;
    setSubmitting(true);
    setResult(null);
    try {
      await cargoMatches.create({
        trip_listing_id: selectedTripId,
        cargo_request_id: order.id,
        initiated_by: "carrier",
        agreed_price_rm: order.suggested_budget_rm,
      });
      setResult({ ok: true, msg: "Offer sent — the cargo owner will review it." });
    } catch (err) {
      setResult({
        ok: false,
        msg: err instanceof Error ? err.message : "Failed to send offer.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:w-96 h-full sm:h-auto sm:max-h-[90vh] bg-white dark:bg-zinc-900 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className={`border-l-4 ${order.priority_flag ? "border-l-amber-400" : "border-l-emerald-500"} pl-4 pr-5 py-4 border-b border-black/[.06] dark:border-white/[.08]`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-400">
              #REQ-{String(order.id).padStart(4, "0")}
            </span>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
            {order.sender_company}
          </p>
          {order.priority_flag && (
            <span className="inline-flex mt-2 text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-2 py-1 rounded-md">
              Priority
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">
              Route
            </p>
            <div className="flex items-stretch gap-2">
              <div className="flex flex-col items-center gap-0.5 pt-1">
                <span className="w-2 h-2 rounded-full border-2 border-zinc-400 flex-shrink-0" />
                <span className="w-px flex-1 min-h-[24px] bg-zinc-200 dark:bg-zinc-700" />
                <span className="w-2 h-2 rounded-full bg-zinc-700 dark:bg-zinc-300 flex-shrink-0" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">From</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{order.pickup.address}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">To</p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{order.dropoff.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">
              Cargo Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                ["Weight", `${order.cargo_details.weight_kg} kg`],
                ["Volume", `${order.cargo_details.volume_m3} m³`],
                ["Pickup opens", pickupStart],
                ["Suggested", `RM ${order.suggested_budget_rm.toFixed(2)}`],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-solid border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-0.5">
              Suggested Budget
            </p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
              RM {order.suggested_budget_rm.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-black/[.06] dark:border-white/[.08] flex flex-col gap-3">
          {result && (
            <p
              className={`text-xs font-medium ${
                result.ok ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {result.msg}
            </p>
          )}

          {loadingTrips ? (
            <button
              disabled
              className="w-full h-11 rounded-full bg-zinc-200 dark:bg-zinc-700 text-sm font-semibold text-zinc-500"
            >
              Loading your trips…
            </button>
          ) : myTrips.length === 0 ? (
            <div className="text-center">
              <p className="text-xs text-zinc-400 mb-2">
                You need an open trip to offer pooling on this cargo.
              </p>
              <button
                disabled
                className="w-full h-11 rounded-full bg-zinc-200 dark:bg-zinc-700 text-sm font-semibold text-zinc-500 cursor-not-allowed"
              >
                List a trip first
              </button>
            </div>
          ) : result?.ok ? (
            <button
              onClick={onClose}
              className="w-full h-11 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
            >
              Done
            </button>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                  Offer with trip
                </label>
                <select
                  value={selectedTripId ?? ""}
                  onChange={(e) => setSelectedTripId(Number(e.target.value))}
                  className="h-10 rounded-lg border border-solid border-black/[.08] dark:border-white/[.1] bg-zinc-50 dark:bg-zinc-800 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-400"
                >
                  {myTrips.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.id} · {t.origin_region} → {t.destination_region}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleOffer}
                disabled={submitting || selectedTripId == null}
                className="w-full h-11 rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-60"
              >
                {submitting ? "Sending offer…" : "Offer To Pool This Cargo"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
