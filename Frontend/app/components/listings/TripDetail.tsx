"use client";

import { GetTripListingItem, CargoRequest } from "@/type";
import { useEffect, useState } from "react";
import { cargoRequests } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/session";
import { TripStatusBadge } from "./StatusBadge";
import { DetourRouteMap } from "./DetourRouteMap";

type PoolStatus = "idle" | "loading" | "success" | "error";

function formatTripDate(iso: string) {
    return new Date(iso).toLocaleString("en-MY", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

export function TripDetail({
    trip,
    onClose,
    onRequestPool,
    existingMatchId = null,
    onCancelRequest,
}: {
    trip: GetTripListingItem;
    onClose: () => void;
    onRequestPool?: (
        trip: GetTripListingItem,
        cargoRequestId: number
    ) => Promise<number>;
    existingMatchId?: number | null;
    onCancelRequest?: (tripId: number, matchId: number) => Promise<void>;
}) {
    const details = [
        ["Available weight", `${trip.available_capacity.weight_kg} kg`],
        ["Available volume", `${trip.available_capacity.volume_m3} m³`],
        ["Departure", formatTripDate(trip.departure_window_start)],
    ];

    // The current company's own open cargo requests to pool onto this trip.
    const [requests, setRequests] = useState<CargoRequest[]>([]);
    const [selectedRequestId, setSelectedRequestId] = useState<number | null>(
        null
    );
    const [requestsLoading, setRequestsLoading] = useState(true);

    const [poolStatus, setPoolStatus] = useState<PoolStatus>("idle");
    const [poolError, setPoolError] = useState<string | null>(null);
    // Match id of a request already sent for this trip (null = none yet).
    const [matchId, setMatchId] = useState<number | null>(existingMatchId);
    const [cancelling, setCancelling] = useState(false);

    const alreadyRequested = matchId !== null;

    const selectedRequest =
        selectedRequestId !== null
            ? requests.find((r) => r.id === selectedRequestId) ?? null
            : null;

    useEffect(() => {
        const companyId = getCurrentCompanyId();
        if (companyId === null) {
            setRequestsLoading(false);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const list = await cargoRequests.list({
                    company_id: companyId,
                    status_filter: "open",
                });
                if (!cancelled) setRequests(list);
            } catch {
                // Leave the list empty; the button stays disabled.
            } finally {
                if (!cancelled) setRequestsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    async function handleRequest() {
        if (
            !onRequestPool ||
            selectedRequestId === null ||
            poolStatus === "loading" ||
            alreadyRequested
        ) {
            return;
        }
        setPoolStatus("loading");
        setPoolError(null);
        try {
            const newMatchId = await onRequestPool(trip, selectedRequestId);
            setMatchId(newMatchId);
            setPoolStatus("success");
        } catch (err) {
            setPoolError(
                err instanceof Error ? err.message : "Failed to send bundle request."
            );
            setPoolStatus("error");
        }
    }

    async function handleCancelRequest() {
        if (!onCancelRequest || matchId === null || cancelling) return;
        setCancelling(true);
        setPoolError(null);
        try {
            await onCancelRequest(trip.id, matchId);
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

    const requestLabel =
        poolStatus === "loading"
            ? "Sending request..."
            : poolStatus === "error"
            ? "Retry request"
            : "Request To Bundle Cargo";

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:w-96 sm:rounded-2xl">
                <div className="border-b border-l-4 border-l-emerald-500 border-black/[.06] px-5 py-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">
                            #TRIP-{String(trip.id).padStart(4, "0")}
                        </span>
                        <button
                            onClick={onClose}
                            className="text-xl leading-none text-zinc-400 transition-colors hover:text-zinc-700"
                        >
                            ×
                        </button>
                    </div>
                    <p className="mt-1 text-base font-semibold text-zinc-900">
                        {trip.logistics_provider.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                        {trip.logistics_provider.vehicle_type} · {trip.logistics_provider.license_plate}
                    </p>
                    <div className="mt-2">
                        <TripStatusBadge status={trip.match_status} />
                        {alreadyRequested && (
                            <span className="ml-2 inline-flex text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-100 px-2 py-1 rounded-md">
                                Requested
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                    <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                            Route
                        </p>
                        <div className="flex items-stretch gap-2">
                            <div className="flex flex-col items-center gap-0.5 pt-1">
                                <span className="h-2 w-2 flex-shrink-0 rounded-full border-2 border-zinc-400" />
                                <span className="min-h-[24px] w-px flex-1 bg-zinc-200" />
                                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-zinc-700" />
                            </div>
                            <div className="flex flex-1 flex-col gap-3">
                                <div>
                                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-400">From</p>
                                    <p className="text-sm text-zinc-700">
                                        {trip.origin_region}
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-400">To</p>
                                    <p className="text-sm font-medium text-zinc-800">
                                        {trip.destination_region}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3">
                            <DetourRouteMap
                                origin={{ address: trip.origin_region }}
                                destination={{ address: trip.destination_region }}
                                waypoints={
                                    selectedRequest
                                        ? [
                                              {
                                                  address: selectedRequest.pickup_address,
                                                  lat: selectedRequest.pickup_lat,
                                                  lng: selectedRequest.pickup_lng,
                                              },
                                              {
                                                  address: selectedRequest.dropoff_address,
                                                  lat: selectedRequest.dropoff_lat,
                                                  lng: selectedRequest.dropoff_lng,
                                              },
                                          ]
                                        : []
                                }
                            />
                            {selectedRequest ? (
                                <p className="mt-1.5 text-[11px] text-zinc-500">
                                    Detour via{" "}
                                    <span className="font-medium text-zinc-700">
                                        {selectedRequest.pickup_address}
                                    </span>{" "}
                                    →{" "}
                                    <span className="font-medium text-zinc-700">
                                        {selectedRequest.dropoff_address}
                                    </span>
                                </p>
                            ) : (
                                <p className="mt-1.5 text-[11px] text-zinc-400">
                                    Select a cargo request below to preview the detour.
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                            Trip Details
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {details.map(([label, value]) => (
                                <div key={label} className="rounded-lg bg-zinc-50 px-3 py-2.5">
                                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                        {label}
                                    </p>
                                    <p className="text-sm font-semibold text-zinc-800 tabular-nums">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                            Assign one of your bundle requests
                        </p>
                        {alreadyRequested ? (
                            <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
                                You&apos;ve already requested this trip for one of
                                your cargo requests. Cancel below to choose a
                                different one.
                            </p>
                        ) : requestsLoading ? (
                            <p className="text-sm text-zinc-400">
                                Loading your requests...
                            </p>
                        ) : requests.length === 0 ? (
                            <p className="text-sm text-zinc-500">
                                You have no open cargo requests. Create one first to
                                request a bundle.
                            </p>
                        ) : (
                            <select
                                value={selectedRequestId ?? ""}
                                onChange={(e) =>
                                    setSelectedRequestId(
                                        e.target.value === ""
                                            ? null
                                            : Number(e.target.value)
                                    )
                                }
                                className="w-full h-11 rounded-xl border border-solid border-black/[.08] bg-white px-3 text-sm text-zinc-800 outline-none focus:border-amber-400 transition-colors"
                            >
                                <option value="">Select a request...</option>
                                {requests.map((req) => (
                                    <option key={req.id} value={req.id}>
                                        #REQ-{String(req.id).padStart(4, "0")} ·{" "}
                                        {req.pickup_address} → {req.dropoff_address}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                <div className="border-t border-black/[.06] px-5 py-4">
                    {poolError && (
                        <p className="mb-2 text-xs text-red-600">{poolError}</p>
                    )}
                    {alreadyRequested ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                Bundle request sent
                            </div>
                            <button
                                onClick={handleCancelRequest}
                                disabled={cancelling || !onCancelRequest}
                                className="h-11 w-full rounded-full border border-red-200 bg-white text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {cancelling ? "Cancelling..." : "Cancel request"}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleRequest}
                            disabled={
                                selectedRequestId === null ||
                                poolStatus === "loading"
                            }
                            className="h-11 w-full rounded-full bg-zinc-900 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {requestLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
