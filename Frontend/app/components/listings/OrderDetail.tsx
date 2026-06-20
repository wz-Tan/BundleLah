"use client";

import type { GetOrderResponse } from "@/type";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatTime, STATUS_STYLES } from "./listingUtils";

export function OrderDetail({
  order,
  onClose,
}: {
  order: GetOrderResponse;
  onClose: () => void;
}) {
  const s = STATUS_STYLES[order.status];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:w-96 h-full sm:h-auto sm:max-h-[90vh] bg-white dark:bg-zinc-900 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className={`border-l-4 ${s.border} pl-4 pr-5 py-4 border-b border-black/[.06] dark:border-white/[.08]`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-zinc-400">
              #ORD-{String(order.id).padStart(4, "0")}
            </span>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
            Company #{order.company_id}
          </p>
          <div className="mt-1.5">
            <StatusBadge status={order.status} />
          </div>
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
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{order.supplier_address}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-0.5">To</p>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{order.dropoff_address}</p>
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
                ["Weight",        `${order.weight_kg} kg`],
                ["Volume",        `${order.volume_m3} m³`],
                ["Pickup opens",  formatTime(order.pickup_window_start)],
                ["Pickup closes", formatTime(order.pickup_window_end)],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l} className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{l}</p>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 tabular-nums">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-solid border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-0.5">
                Estimated Cost
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                RM {order.estimated_cost_rm.toFixed(2)}
              </p>
            </div>
            {order.priority_flag && (
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300 px-2 py-1 rounded-md">
                Priority
              </span>
            )}
          </div>

          {order.trip && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">
                Assigned Driver
              </p>
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold text-sm flex-shrink-0">
                  {order.trip.driver_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    {order.trip.driver_name}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">{order.trip.vehicle_plate}</p>
                </div>
                <span className="ml-auto text-xs text-violet-600 dark:text-violet-400 font-medium capitalize">
                  {order.trip.status.replace("_", " ")}
                </span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-zinc-400">
            Created {formatDate(order.created_at)}
          </p>
        </div>

        {order.status === "pending" && (
          <div className="px-5 py-4 border-t border-black/[.06] dark:border-white/[.08]">
            <button className="w-full h-11 rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors">
              Request To Pool This Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
