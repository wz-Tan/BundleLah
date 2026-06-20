"use client";

import type { GetCargoRequestItem } from "@/type";
import { DataPill } from "./DataPill";
import { formatTime, truncate } from "./listingUtils";

export function OrderCard({
  order,
  onSelect,
  onCancel,
  isOwn = false,
  requested = false,
}: {
  order: GetCargoRequestItem;
  onSelect: (o: GetCargoRequestItem) => void;
  onCancel?: (id: number) => void;
  isOwn?: boolean;
  requested?: boolean;
}) {
  const pickupStart = order.pickup.window_start
    ? formatTime(order.pickup.window_start)
    : "Flexible";
  const pickupDate = order.pickup.window_start
    ? new Date(order.pickup.window_start).toLocaleDateString("en-MY", {
        day: "2-digit",
        month: "short",
      })
    : "Any day";

  return (
    <div className="relative">
      <button
        onClick={() => onSelect(order)}
        className={`w-full text-left border border-solid border-l-4 ${
          order.priority_flag ? "border-l-amber-400" : "border-l-emerald-500"
        } ${
          isOwn
            ? "border-orange-300 ring-2 ring-orange-200 bg-orange-50/50"
            : "border-black/[.06] bg-white hover:border-black/[.12]"
        } rounded-lg p-4 transition-all hover:shadow-md active:scale-[0.995]`}
      >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {order.priority_flag && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                Priority
              </span>
            )}
            {isOwn && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                Your request
              </span>
            )}
            {requested && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                Requested
              </span>
            )}
            <span className="text-[11px] text-zinc-400 font-mono">
              #REQ-{String(order.id).padStart(4, "0")}
            </span>
          </div>
          <p className="text-sm font-semibold text-zinc-900 truncate">
            {order.sender_company}
          </p>
        </div>
        <span className="text-base font-bold text-zinc-900 tabular-nums">
          RM {order.suggested_budget_rm.toFixed(2)}
        </span>
      </div>

      <div className="flex items-stretch gap-2 mb-3">
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <span className="w-2 h-2 rounded-full border-2 border-zinc-400 flex-shrink-0" />
          <span className="w-px flex-1 bg-zinc-200" />
          <span className="w-2 h-2 rounded-full bg-zinc-700 flex-shrink-0" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <p className="text-xs text-zinc-500 leading-tight">
            {truncate(order.pickup.address, 60)}
          </p>
          <p className="text-xs font-medium text-zinc-700 leading-tight">
            {truncate(order.dropoff.address, 60)}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex gap-5">
          <DataPill label="Weight" value={`${order.cargo_details.weight_kg} kg`} />
          <DataPill label="Volume" value={`${order.cargo_details.volume_m3} m³`} />
          <DataPill label="Pickup" value={`${pickupDate}, ${pickupStart}`} />
        </div>
      </div>
      </button>
      {onCancel && (
        <button
          onClick={() => onCancel(order.id)}
          className="absolute bottom-4 right-4 z-10 text-[11px] font-medium text-zinc-400 hover:text-red-500 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
