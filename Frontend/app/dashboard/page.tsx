"use client";

import { useEffect, useRef, useState } from "react";
import { CargoMap, type CargoMarker } from "../components/CargoMap";
import {
  fetchCargoMatches,
  fetchCargoRequests,
  fetchCargoRequestById,
  fetchTripListings,
} from "@/app/services/listings";
import { fetchDevicesByCargoMatch, fetchDeviceAlerts } from "@/app/services/device";
import { getCurrentCompanyId } from "@/lib/session";
import {
  METRICS,
  computeDashboardMetrics,
  computePendingSummary,
  type DashboardMetrics,
  type PendingSummary,
} from "@/lib/metrics";
import type { CargoMatch, CargoRequest } from "@/type";

interface Notification {
  id: string;
  message: string;
  time: string;
  deviceId: number;
  alertType: string;
}

const SAMPLE_MARKERS: CargoMarker[] = [
  {
    id: "m-001",
    orderId: "ORD-1001",
    lat: 1.3521,
    lng: 103.8198,
    label: "Order #ORD-1001 — Pickup, Jurong East",
  },
  {
    id: "m-002",
    orderId: "ORD-1002",
    lat: 1.3036,
    lng: 103.8318,
    label: "Order #ORD-1002 — Dropoff, Tanjong Pagar",
  },
  {
    id: "m-003",
    orderId: "ORD-1003",
    lat: 1.3496,
    lng: 103.9568,
    label: "Order #ORD-1003 — Pickup, Tampines",
  },
  {
    id: "m-004",
    orderId: "ORD-1004",
    lat: 1.4382,
    lng: 103.7891,
    label: "Order #ORD-1004 — Dropoff, Woodlands",
  },
  {
    id: "m-005",
    orderId: "ORD-1005",
    lat: 1.3329,
    lng: 103.7436,
    label: "Order #ORD-1005 — Pickup, Jurong West",
  },
  {
    id: "m-006",
    orderId: "ORD-1006",
    lat: 1.3644,
    lng: 103.9915,
    label: "Order #ORD-1006 — Dropoff, Changi",
  },
  {
    id: "m-007",
    orderId: "ORD-1007",
    lat: 1.2966,
    lng: 103.852,
    label: "Order #ORD-1007 — In Transit, Marina Bay",
  },
  {
    id: "m-008",
    orderId: "ORD-1008",
    lat: 1.3151,
    lng: 103.7644,
    label: "Order #ORD-1008 — Pickup, Clementi",
  },
  {
    id: "m-009",
    orderId: "ORD-1009",
    lat: 1.3868,
    lng: 103.7479,
    label: "Order #ORD-1009 — Dropoff, Bukit Panjang",
  },
  {
    id: "m-010",
    orderId: "ORD-1010",
    lat: 1.3691,
    lng: 103.8454,
    label: "Order #ORD-1010 — Pickup, Bishan",
  },
];

// One line of a worked calculation: the formula (with live constants) and the
// same formula with this drive's REAL numbers plugged in → result.
interface CalcStep {
  label: string;
  formula: string;
  working: string;
}

interface Panel {
  id: string;
  label: string;
  value: string;
  sub: string;
  detail: { label: string; value: string }[];
  /** Step-by-step maths from assigned drives (omitted for pending). */
  calc?: CalcStep[];
}

const money = (n: number) =>
  `RM ${n.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Build the carbon calculation, one line per assigned drive plus the total.
function carbonCalc(metrics: DashboardMetrics): CalcStep[] {
  const steps: CalcStep[] = metrics.deliveries.map((d) => ({
    label: `Drive · cargo #${d.cargoRequestId} (${d.role})`,
    formula: `distance × ${METRICS.TRUCK_CO2_KG_PER_KM} kg/km`,
    working: `${d.distanceKm} km × ${METRICS.TRUCK_CO2_KG_PER_KM} ≈ ${d.co2AvoidedKg} kg`,
  }));
  steps.push({
    label: "Total CO₂ avoided",
    formula: "Σ all assigned drives",
    working: `${metrics.co2FromSharedRidesKg} kg (shared) + ${metrics.co2FromCarryingKg} kg (carried) = ${metrics.co2AvoidedKg} kg`,
  });
  steps.push({
    label: "Trees equivalent",
    formula: `total ÷ ${METRICS.CO2_KG_PER_TREE_YEAR} kg per tree/year`,
    working: `${metrics.co2AvoidedKg} ÷ ${METRICS.CO2_KG_PER_TREE_YEAR} ≈ ${metrics.treesEquivalent} trees`,
  });
  steps.push({
    label: "Monthly goal progress",
    formula: `total ÷ ${metrics.monthlyGoalKg} kg goal × 100`,
    working: `${metrics.co2AvoidedKg} ÷ ${metrics.monthlyGoalKg} × 100 ≈ ${metrics.goalProgressPct}%`,
  });
  return steps;
}

// Build the money calculation, one line per assigned drive plus totals.
function moneyCalc(metrics: DashboardMetrics): CalcStep[] {
  const steps: CalcStep[] = metrics.deliveries.map((d) =>
    d.role === "buyer"
      ? {
          label: `Saved · cargo #${d.cargoRequestId} (buyer)`,
          formula:
            d.dedicatedCostRm >= d.pooledPriceRm
              ? "est. dedicated cost − bundled price paid"
              : "max(est. dedicated cost − bundled price, 0)",
          working:
            d.dedicatedCostRm >= d.pooledPriceRm
              ? `${money(d.dedicatedCostRm)} − ${money(d.pooledPriceRm)} = ${money(d.moneyRm)}`
              : `max(${money(d.dedicatedCostRm)} − ${money(d.pooledPriceRm)}, 0) = ${money(d.moneyRm)}`,
        }
      : {
          label: `Earned · cargo #${d.cargoRequestId} (driver)`,
          formula: "agreed bundled price (spare-space revenue)",
          working: `${money(d.pooledPriceRm)}`,
        }
  );
  steps.push({
    label: "Saved as buyer",
    formula: "Σ savings on own bundled cargo",
    working: money(metrics.savedAsBuyerRm),
  });
  steps.push({
    label: "Earned as driver",
    formula: "Σ revenue carrying others' cargo",
    working: money(metrics.earnedAsDriverRm),
  });
  steps.push({
    label: "Combined total",
    formula: "saved as buyer + earned as driver",
    working: `${money(metrics.savedAsBuyerRm)} + ${money(metrics.earnedAsDriverRm)} = ${money(metrics.totalMoneyRm)}`,
  });
  steps.push({
    label: "Average per drive",
    formula: "combined total ÷ assigned drives",
    working: metrics.deliveriesCount
      ? `${money(metrics.totalMoneyRm)} ÷ ${metrics.deliveriesCount} ≈ ${money(metrics.avgPerDeliveryRm)}`
      : "no assigned drives",
  });
  return steps;
}

// Derive the three dashboard panels from real metrics + pending summary.
function buildPanels(
  metrics: DashboardMetrics,
  pending: PendingSummary
): Panel[] {
  return [
    {
      id: "carbon",
      label: "Carbon Footprint Reduction",
      value: `${metrics.co2AvoidedKg} kg`,
      sub: `CO₂ avoided · ${metrics.deliveriesCount} assigned drives`,
      detail: [
        { label: "Shared rides (own cargo)", value: `${metrics.co2FromSharedRidesKg} kg` },
        { label: "Carried for others", value: `${metrics.co2FromCarryingKg} kg` },
        { label: "Trees equivalent", value: `${metrics.treesEquivalent}` },
        { label: "Monthly goal", value: `${metrics.monthlyGoalKg} kg` },
        { label: "Progress", value: `${metrics.goalProgressPct}%` },
      ],
      calc: carbonCalc(metrics),
    },
    {
      id: "money",
      label: "Money Made or Saved",
      value: money(metrics.totalMoneyRm),
      sub: `from ${metrics.deliveriesCount} assigned drives`,
      detail: [
        { label: "Saved as buyer", value: money(metrics.savedAsBuyerRm) },
        { label: "Earned as driver", value: money(metrics.earnedAsDriverRm) },
        { label: "Assigned drives", value: `${metrics.deliveriesCount}` },
        { label: "Avg per drive", value: money(metrics.avgPerDeliveryRm) },
      ],
      calc: moneyCalc(metrics),
    },
    {
      id: "pending",
      label: "Pending Cargo",
      value: `${pending.total} orders`,
      sub: `${pending.inTransit} in transit · ${pending.queued} queued`,
      detail: [
        { label: "In transit", value: `${pending.inTransit}` },
        { label: "Queued (awaiting match)", value: `${pending.queued}` },
        { label: "Total pending", value: `${pending.total}` },
      ],
    },
  ];
}

// Helper function to calculate time ago
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export default function DashboardPage() {
  const [active, setActive] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [pending, setPending] = useState<PendingSummary | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Compute carbon + money metrics from assigned drives (active + completed).
  useEffect(() => {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      setIsLoadingMetrics(false);
      return;
    }

    let cancelled = false;

    async function loadMetrics(company: number) {
      try {
        // My own cargo requests and trip listings.
        const [myCargo, myTrips] = await Promise.all([
          fetchCargoRequests({ company_id: company, limit: 200 }),
          fetchTripListings({ company_id: company, limit: 200 }),
        ]);
        if (cancelled) return;

        const myCargoIds = new Set(myCargo.map((c) => c.id));
        const myTripIds = new Set(myTrips.map((t) => t.id));

        // Matches that involve my cargo (buyer side) or my trips (driver side).
        const [cargoMatchArrays, tripMatchArrays] = await Promise.all([
          Promise.all(
            myCargo.map((c) =>
              fetchCargoMatches({ cargo_request_id: c.id, limit: 100 }).catch(
                () => [] as CargoMatch[]
              )
            )
          ),
          Promise.all(
            myTrips.map((t) =>
              fetchCargoMatches({ trip_listing_id: t.id, limit: 100 }).catch(
                () => [] as CargoMatch[]
              )
            )
          ),
        ]);
        if (cancelled) return;

        // De-duplicate matches by id.
        const matchesById = new Map<number, CargoMatch>();
        for (const m of [...cargoMatchArrays.flat(), ...tripMatchArrays.flat()]) {
          matchesById.set(m.id, m);
        }
        const matches = [...matchesById.values()];

        // Build cargo lookup: my cargo + any others' cargo I carried.
        const cargoById = new Map<number, CargoRequest>();
        for (const c of myCargo) cargoById.set(c.id, c);

        const missingCargoIds = [
          ...new Set(
            matches
              .map((m) => m.cargo_request_id)
              .filter((id) => id != null && !cargoById.has(id))
          ),
        ];
        const fetchedCargo = await Promise.all(
          missingCargoIds.map((id) =>
            fetchCargoRequestById(id).catch(() => null)
          )
        );
        if (cancelled) return;
        for (const c of fetchedCargo) if (c) cargoById.set(c.id, c);

        const computed = computeDashboardMetrics({
          companyId: company,
          matches,
          cargoById,
          myCargoIds,
          myTripIds,
        });

        setMetrics(computed);
        setPending(computePendingSummary(myCargo));
      } catch (err) {
        console.error("Failed to compute dashboard metrics:", err);
      } finally {
        if (!cancelled) setIsLoadingMetrics(false);
      }
    }

    loadMetrics(companyId);

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch device alerts for notifications
  useEffect(() => {
    const companyId = getCurrentCompanyId();
    if (!companyId) {
      setIsLoadingNotifications(false);
      return;
    }

    let cancelled = false;

    async function fetchAlerts() {
      try {
        // Get all cargo matches for this company
        const [cargoMatches, tripMatches] = await Promise.all([
          fetchCargoMatches({ cargo_request_id: undefined, limit: 100 }),
          fetchCargoMatches({ trip_listing_id: undefined, limit: 100 }),
        ]);

        if (cancelled) return;

        // Get unique cargo match IDs
        const matchIds = new Set([
          ...cargoMatches.map(m => m.id),
          ...tripMatches.map(m => m.id),
        ]);

        // Fetch devices for each cargo match
        const devicePromises = Array.from(matchIds).map(async (matchId) => {
          try {
            return await fetchDevicesByCargoMatch(matchId);
          } catch {
            return [];
          }
        });

        const deviceArrays = await Promise.all(devicePromises);
        if (cancelled) return;

        const allDevices = deviceArrays.flat();

        // Fetch alerts for each device
        const alertPromises = allDevices.map(async (device) => {
          try {
            return await fetchDeviceAlerts(device.id);
          } catch {
            return { device_id: device.id, alerts: [] };
          }
        });

        const deviceAlerts = await Promise.all(alertPromises);
        if (cancelled) return;

        // Transform alerts into notifications
        const allNotifications: Notification[] = [];
        deviceAlerts.forEach((deviceAlert) => {
          deviceAlert.alerts.forEach((alert) => {
            const timeAgo = getTimeAgo(new Date(alert.timestamp));
            allNotifications.push({
              id: `${deviceAlert.device_id}-${alert.alert_type}-${alert.timestamp}`,
              message: alert.message,
              time: timeAgo,
              deviceId: deviceAlert.device_id,
              alertType: alert.alert_type,
            });
          });
        });

        // Sort by timestamp (most recent first)
        allNotifications.sort((a, b) => {
          const extractTime = (notif: Notification) => {
            const match = notif.id.match(/\d{4}-\d{2}-\d{2}T[\d:.]+/);
            return match ? new Date(match[0]).getTime() : 0;
          };
          return extractTime(b) - extractTime(a);
        });

        setNotifications(allNotifications);
      } catch (err) {
        console.error("Failed to fetch device alerts:", err);
      } finally {
        if (!cancelled) setIsLoadingNotifications(false);
      }
    }

    fetchAlerts();
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Close the notification popup if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  const hasNotifications = notifications.length > 0;

  const panels = metrics && pending ? buildPanels(metrics, pending) : [];
  const activePanel = panels.find((p) => p.id === active);

  return (
    <main className="mx-12 my-8 relative min-h-screen pb-24">
      <div className="grid grid-cols-10 gap-6">
        {/* 7-col left */}
        <div className="col-span-7 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Cargo Progress</h2>
          <div className="flex-1 min-h-196 rounded-xl border border-gray-200 overflow-hidden">
            <CargoMap
              center={{ lat: 1.3521, lng: 103.8198 }}
              markers={SAMPLE_MARKERS}
            />
          </div>
        </div>

        {/* 3-col right */}
        <div className="col-span-3 flex flex-col gap-4">
          {isLoadingMetrics ? (
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-full rounded-xl border border-gray-200 bg-white px-5 py-4 animate-pulse"
              >
                <div className="h-3 w-32 rounded bg-gray-100" />
                <div className="mt-2 h-7 w-24 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-40 rounded bg-gray-100" />
              </div>
            ))
          ) : (
            panels.map(({ id, label, value, sub }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className="w-full text-left rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-orange-400 hover:bg-orange-50 transition-all duration-150"
              >
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {label}
                </span>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {value}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {active && activePanel && (() => {
        const theme = {
          gradient: "from-gray-700 to-gray-900",
          ring: "ring-gray-200",
          accentText: "text-gray-900",
          chip: "bg-gray-100 text-gray-600",
          working: "text-gray-700",
        };
        return (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
            onClick={() => setActive(null)}
          >
            <div
              className={`bg-white rounded-3xl w-full max-w-2xl shadow-2xl ring-1 ${theme.ring} max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Hero header */}
              <div
                className={`relative bg-gradient-to-br ${theme.gradient} px-8 py-10 text-white`}
              >
                <button
                  onClick={() => setActive(null)}
                  aria-label="Close"
                  className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <p className="text-sm font-medium uppercase tracking-widest text-white/80">
                  {activePanel.label}
                </p>
                <p className="mt-2 text-6xl font-extrabold leading-none">
                  {activePanel.value}
                </p>
                <p className="mt-3 text-base text-white/90">{activePanel.sub}</p>
              </div>

              {/* Detail stat grid */}
              <div className="px-8 pt-8">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {activePanel.detail.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <p className="text-xs text-gray-500">{row.label}</p>
                      <p className={`mt-1 text-xl font-bold ${theme.accentText}`}>
                        {row.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it's calculated — from assigned drives */}
              {activePanel.calc && activePanel.calc.length > 0 && (
                <div className="px-8 pb-8 pt-8">
                  <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    How it&apos;s calculated
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${theme.chip}`}
                    >
                      from active + completed drives
                    </span>
                  </h4>
                  <div className="mt-4 flex flex-col gap-3">
                    {activePanel.calc.map((step) => (
                      <div
                        key={step.label}
                        className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                      >
                        <p className="text-sm font-semibold text-gray-900">
                          {step.label}
                        </p>
                        <p className="mt-1 font-mono text-xs text-gray-500">
                          {step.formula}
                        </p>
                        <p
                          className={`mt-1 font-mono text-sm font-medium ${theme.working}`}
                        >
                          {step.working}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* --- Notification Component System --- */}
      <div className="fixed bottom-8 right-12 z-40" ref={popoverRef}>
        {/* Small Popup Alerts */}
        {showNotifications && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h4 className="font-semibold text-sm text-gray-800">Alerts</h4>
              {hasNotifications && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {isLoadingNotifications ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-xs text-gray-400 mt-2">Loading alerts...</p>
                </div>
              ) : hasNotifications ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm text-gray-700 leading-snug">
                      {notif.message}
                    </p>
                    <span className="text-xs text-gray-400 block mt-1">
                      {notif.time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">
                  No new notifications
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`relative p-3.5 rounded-full shadow-lg border transition-all duration-200 focus:outline-none ${showNotifications
              ? "bg-orange-500 border-orange-500 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-500"
            }`}
        >
          {/* Bell Icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>

          {/* Circle indicator on top right */}
          {hasNotifications && (
            <span className="absolute top-0 right-0 block h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
      </div>
    </main>
  );
}
