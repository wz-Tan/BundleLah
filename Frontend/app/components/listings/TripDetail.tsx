import { GetTripListingItem } from "@/type";
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
        ["Price/kg", `RM ${trip.estimated_price_per_kg_rm.toFixed(2)}`],
    ];

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
                                RM {trip.estimated_price_per_kg_rm.toFixed(2)}
                            </p>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
                            per kg
                        </span>
                    </div>
                </div>

                <div className="border-t border-black/[.06] px-5 py-4 dark:border-white/[.08]">
                    <button className="h-11 w-full rounded-full bg-zinc-900 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                        Request To Pool Cargo
                    </button>
                </div>
            </div>
        </div>
    );
}
