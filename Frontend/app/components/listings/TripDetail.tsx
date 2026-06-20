"use client";

import { useEffect, useState } from "react";
import { GetTripListingItem, CargoRequest } from "@/type";
import { cargoRequests, cargoMatches } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/session";
import { TripStatusBadge } from "./StatusBadge";

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
}: {
    trip: GetTripListingItem;
    onClose: () => void;
}) {
    const details = [
        ["Available weight", `${trip.available_capacity.weight_kg} kg`],
        ["Available volume", `${trip.available_capacity.volume_m3} m³`],
        ["Departure", formatTripDate(trip.departure_window_start)],
    ];

    const pricePerKg = trip.estimated_price_per_kg_rm ?? 0;

    const [myRequests, setMyRequests] = useState<CargoRequest[]>([]);
    const [selectedReqId, setSelectedReqId] = useState<number | null>(null);
    const [loadingReqs, setLoadingReqs] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        const companyId = getCurrentCompanyId();
        if (companyId == null) {
            setLoadingReqs(false);
            return;
        }
        cargoRequests
            .list({ company_id: companyId, status_filter: "open" })
            .then((reqs) => {
                if (cancelled) return;
                setMyRequests(reqs);
                setSelectedReqId(reqs[0]?.id ?? null);
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setLoadingReqs(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const selectedReq = myRequests.find((r) => r.id === selectedReqId) ?? null;
    const agreedPrice = selectedReq
        ? Math.round(pricePerKg * (Number(selectedReq.weight_kg) || 0) * 100) / 100
        : 0;

    async function handleRequest() {
        if (selectedReqId == null) return;
        setSubmitting(true);
        setResult(null);
        try {
            await cargoMatches.create({
                trip_listing_id: trip.id,
                cargo_request_id: selectedReqId,
                initiated_by: "shipper",
                agreed_price_rm: agreedPrice,
            });
            setResult({ ok: true, msg: "Request sent — the carrier will review it." });
        } catch (err) {
            setResult({
                ok: false,
                msg: err instanceof Error ? err.message : "Failed to send request.",
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:w-96 sm:rounded-2xl dark:bg-zinc-900">
                <div className="border-b border-l-4 border-l-emerald-500 border-black/[.06] px-5 py-4 dark:border-white/[.08]">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-400">
                            #TRIP-{String(trip.id).padStart(4, "0")}
                        </span>
                        <button
                            onClick={onClose}
                            className="text-xl leading-none text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
                        >
                            ×
                        </button>
                    </div>
                    <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {trip.logistics_provider.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                        {trip.logistics_provider.vehicle_type} · {trip.logistics_provider.license_plate}
                    </p>
                    <div className="mt-2">
                        <TripStatusBadge status={trip.match_status} />
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
                                <span className="min-h-[24px] w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-zinc-700 dark:bg-zinc-300" />
                            </div>
                            <div className="flex flex-1 flex-col gap-3">
                                <div>
                                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-400">From</p>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                        {trip.origin_region}
                                    </p>
                                </div>
                                <div>
                                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-400">To</p>
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                        {trip.destination_region}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                            Trip Details
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            {details.map(([label, value]) => (
                                <div key={label} className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800">
                                    <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                        {label}
                                    </p>
                                    <p className="text-sm font-semibold text-zinc-800 tabular-nums dark:text-zinc-100">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-solid border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900 dark:bg-emerald-950/40">
                        <div>
                            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                                Estimated Price
                            </p>
                            <p className="text-2xl font-bold text-zinc-900 tabular-nums dark:text-zinc-50">
                                RM {(trip.estimated_price_per_kg_rm ?? 0).toFixed(2)}
                            </p>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                            per kg
                        </span>
                    </div>
                </div>

                <div className="border-t border-black/[.06] px-5 py-4 dark:border-white/[.08] flex flex-col gap-3">
                    {result && (
                        <p
                            className={`text-xs font-medium ${
                                result.ok ? "text-emerald-600" : "text-red-500"
                            }`}
                        >
                            {result.msg}
                        </p>
                    )}

                    {loadingReqs ? (
                        <button
                            disabled
                            className="h-11 w-full rounded-full bg-zinc-200 text-sm font-semibold text-zinc-500 dark:bg-zinc-700"
                        >
                            Loading your cargo…
                        </button>
                    ) : myRequests.length === 0 ? (
                        <div className="text-center">
                            <p className="mb-2 text-xs text-zinc-400">
                                You need an open cargo request to pool onto this trip.
                            </p>
                            <button
                                disabled
                                className="h-11 w-full cursor-not-allowed rounded-full bg-zinc-200 text-sm font-semibold text-zinc-500 dark:bg-zinc-700"
                            >
                                Create a request first
                            </button>
                        </div>
                    ) : result?.ok ? (
                        <button
                            onClick={onClose}
                            className="h-11 w-full rounded-full bg-emerald-600 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                        >
                            Done
                        </button>
                    ) : (
                        <>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                                    Pool which cargo
                                </label>
                                <select
                                    value={selectedReqId ?? ""}
                                    onChange={(e) => setSelectedReqId(Number(e.target.value))}
                                    className="h-10 rounded-lg border border-solid border-black/[.08] bg-zinc-50 px-3 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-white/[.1] dark:bg-zinc-800 dark:text-zinc-100"
                                >
                                    {myRequests.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            #{r.id} · {r.pickup_address} → {r.dropoff_address}
                                        </option>
                                    ))}
                                </select>
                                {selectedReq && (
                                    <p className="text-[11px] text-zinc-400 tabular-nums">
                                        Est. cost RM {agreedPrice.toFixed(2)} ({selectedReq.weight_kg} kg × RM {pricePerKg.toFixed(2)}/kg)
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleRequest}
                                disabled={submitting || selectedReqId == null}
                                className="h-11 w-full rounded-full bg-zinc-900 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                {submitting ? "Sending request…" : "Request To Pool Cargo"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
