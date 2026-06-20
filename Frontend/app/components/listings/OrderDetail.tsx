"use client";

import { useEffect, useState } from "react";

import type { GetCargoRequestItem, TripListing } from "@/type";
import { tripListings } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/session";
import { formatDate } from "./listingUtils";

type PoolStatus = "idle" | "loading" | "success" | "error";

export function OrderDetail({
  order,
  onClose,
  onOfferPool,
  existingMatchId = null,
  onCancelRequest,
}: {
  order: GetCargoRequestItem;
  onClose: () => void;
  onOfferPool?: (
    order: GetCargoRequestItem,
    tripListingId: number
  ) => Promise<number>;
  existingMatchId?: number | null;
  onCancelRequest?: (orderId: number, matchId: number) => Promise<void>;
}) {
  const pickupStart = order.pickup.window_start
    ? formatDate(order.pickup.window_start)
    : "Flexible";

  // The current company's own open trips, to pick which one carries this cargo.
  const [trips, setTrips] = useState<TripListing[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [tripsLoading, setTripsLoading] = useState(true);

  const [poolStatus, setPoolStatus] = useState<PoolStatus>("idle");
  const [poolError, setPoolError] = useState<string | null>(null);
  // Match id of an offer already sent for this cargo (null = none yet).
  const [matchId, setMatchId] = useState<number | null>(existingMatchId);
  const [cancelling, setCancelling] = useState(false);

  const alreadyRequested = matchId !== null;

  useEffect(() => {
    const companyId = getCurrentCompanyId();
    if (companyId === null) {
      setTripsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const listings = await tripListings.list({
          company_id: companyId,
          status_filter: "open",
        });
        if (!cancelled) setTrips(listings);
      } catch {
        // Leave the list empty; the button stays disabled.
      } finally {
        if (!cancelled) setTripsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleOffer() {
    if (
      !onOfferPool ||
      selectedTripId === null ||
      poolStatus === "loading" ||
      alreadyRequested
    ) {
      return;
    }
    setPoolStatus("loading");
    setPoolError(null);
    try {
      const newMatchId = await onOfferPool(order, selectedTripId);
      setMatchId(newMatchId);
      setPoolStatus("success");
    } catch (err) {
      setPoolError(
        err instanceof Error ? err.message : "Failed to send pool offer."
      );
      setPoolStatus("error");
    }
  }

  async function handleCancelRequest() {
    if (!onCancelRequest || matchId === null || cancelling) return;
    setCancelling(true);
    setPoolError(null);
    try {
      await onCancelRequest(order.id, matchId);
      setMatchId(null);
      setPoolStatus("idle");
    } catch (err) {
      setPoolError(
        err instanceof Error ? err.message : "Failed to cancel the request."
      );
    } finally {
      setCancelling(false);
    }
  }

  const offerLabel =
    poolStatus === "loading"
      ? "Sending offer..."
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
          <div className="flex items-center gap-2 mt-2">
            {order.priority_flag && (
              <span className="inline-flex text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                Priority
              </span>
            )}
            {alreadyRequested && (
              <span className="inline-flex text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-100 px-2 py-1 rounded-md">
                Requested
              </span>
            )}
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

          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">
              Assign one of your trips
            </p>
            {alreadyRequested ? (
              <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
                You&apos;ve already offered one of your trips to carry this
                cargo. Cancel the request below to choose a different trip.
              </p>
            ) : tripsLoading ? (
              <p className="text-sm text-zinc-400">Loading your trips...</p>
            ) : trips.length === 0 ? (
              <p className="text-sm text-zinc-500">
                You have no open trips. List a trip first to offer a pool.
              </p>
            ) : (
              <select
                value={selectedTripId ?? ""}
                onChange={(e) =>
                  setSelectedTripId(
                    e.target.value === "" ? null : Number(e.target.value)
                  )
                }
                className="w-full h-11 rounded-xl border border-solid border-black/[.08] bg-white px-3 text-sm text-zinc-800 outline-none focus:border-amber-400 transition-colors"
              >
                <option value="">Select a trip...</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    #TRIP-{String(trip.id).padStart(4, "0")} ·{" "}
                    {trip.origin_region} → {trip.destination_region}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-black/[.06]">
          {poolError && (
            <p className="mb-2 text-xs text-red-600">{poolError}</p>
          )}
          {alreadyRequested ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Pool offer sent
              </div>
              <button
                onClick={handleCancelRequest}
                disabled={cancelling || !onCancelRequest}
                className="w-full h-11 rounded-full border border-red-200 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cancelling ? "Cancelling..." : "Cancel request"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleOffer}
              disabled={selectedTripId === null || poolStatus === "loading"}
              className="w-full h-11 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {offerLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
