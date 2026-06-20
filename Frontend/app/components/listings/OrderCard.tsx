"use client";

import type { GetCargoRequestItem } from "@/type";
import { DataPill } from "./DataPill";
import { formatTime, truncate } from "./listingUtils";

export function OrderCard({
  order,
  onSelect,
}: {
  order: GetCargoRequestItem;
  onSelect: (o: GetCargoRequestItem) => void;
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
    <button
      onClick={() => onSelect(order)}
      className={`w-full text-left border border-solid border-black/[.06] dark:border-white/[.08] border-l-4 ${
        order.priority_flag ? "border-l-amber-400" : "border-l-emerald-500"
      } rounded-lg bg-white dark:bg-zinc-900 p-4 transition-all hover:shadow-md hover:border-black/[.12] dark:hover:border-white/[.14] active:scale-[0.995]`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {order.priority_flag && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 px-1.5 py-0.5 rounded">
                Priority
              </span>
            )}
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
              #REQ-{String(order.id).padStart(4, "0")}
            </span>
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {order.sender_company}
          </p>
        </div>
        <span className="text-base font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
          RM {order.suggested_budget_rm.toFixed(2)}
        </span>
      </div>

      <div className="flex items-stretch gap-2 mb-3">
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <span className="w-2 h-2 rounded-full border-2 border-zinc-400 dark:border-zinc-500 flex-shrink-0" />
          <span className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <span className="w-2 h-2 rounded-full bg-zinc-700 dark:bg-zinc-300 flex-shrink-0" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">
            {truncate(order.pickup.address, 60)}
          </p>
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-tight">
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
  );
}
