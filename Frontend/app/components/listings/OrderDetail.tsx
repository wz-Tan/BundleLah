"use client";

import { useState } from "react";

import type { GetCargoRequestItem } from "@/type";
import { formatTime } from "./listingUtils";

type PoolStatus = "idle" | "loading" | "success" | "error";

export function OrderDetail({
  order,
  onClose,
  onOfferPool,
}: {
  order: GetCargoRequestItem;
  onClose: () => void;
  onOfferPool?: (order: GetCargoRequestItem) => Promise<void>;
}) {
  const pickupStart = order.pickup.window_start
    ? formatTime(order.pickup.window_start)
    : "Flexible";

  const [poolStatus, setPoolStatus] = useState<PoolStatus>("idle");
  const [poolError, setPoolError] = useState<string | null>(null);

  async function handleOffer() {
    if (!onOfferPool || poolStatus === "loading" || poolStatus === "success") {
      return;
    }
    setPoolStatus("loading");
    setPoolError(null);
    try {
      await onOfferPool(order);
      setPoolStatus("success");
    } catch (err) {
      setPoolError(
        err instanceof Error ? err.message : "Failed to send pool offer."
      );
      setPoolStatus("error");
    }
  }

  const offerLabel =
    poolStatus === "loading"
      ? "Sending offer..."
      : poolStatus === "success"
      ? "Offer sent ✓"
      : poolStatus === "error"
      ? "Retry offer"
      : "Offer To Pool This Cargo";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:w-96 h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className={`border-l-4 ${order.priority_flag ? "border-l-amber-400" : "border-l-emerald-500"} pl-4 pr-5 py-4 border-b border-black/[.06]`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-400">
              #REQ-{String(order.id).padStart(4, "0")}
            </span>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-base font-semibold text-zinc-900 mt-1">
            {order.sender_company}
          </p>
          {order.priority_flag && (
            <span className="inline-flex mt-2 text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
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
                <span className="w-px flex-1 min-h-[24px] bg-zinc-200" />
                <span className="w-2 h-2 rounded-full bg-zinc-700 flex-shrink-0" />
              </div>
              <div className="flex flex-col gap-3 flex-1">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">From</p>
                  <p className="text-sm text-zinc-700">{order.pickup.address}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">To</p>
                  <p className="text-sm font-medium text-zinc-800">{order.dropoff.address}</p>
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
                <div key={label} className="bg-zinc-50 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-zinc-800 tabular-nums">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-solid border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold mb-0.5">
              Suggested Budget
            </p>
            <p className="text-2xl font-bold text-zinc-900 tabular-nums">
              RM {order.suggested_budget_rm.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-black/[.06]">
          {poolError && (
            <p className="mb-2 text-xs text-red-600">{poolError}</p>
          )}
          <button
            onClick={handleOffer}
            disabled={poolStatus === "loading" || poolStatus === "success"}
            className="w-full h-11 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {offerLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
