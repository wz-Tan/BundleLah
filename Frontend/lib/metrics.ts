// =========================================================================
// BundleLah dashboard metrics
// Pure, transparent calculations for the home dashboard. Every headline
// number is derived from real cargo/trip/match data using the documented
// constants and formulas below — no magic numbers in the UI.
// =========================================================================

import type { CargoMatch, CargoRequest, TripListing } from "@/type";
import { haversineKm, recommendCargoPrice, PRICING } from "@/lib/pricing";

// -------------------------------------------------------------------------
// Emission + reference constants (documented & defensible)
// -------------------------------------------------------------------------

export const METRICS = {
  /**
   * Tailpipe CO₂ of an average diesel delivery truck, per vehicle-km.
   * Real-world light/medium diesel goods vehicles emit ~0.7–1.0 kg CO₂/km;
   * 0.85 is a mid-range figure.
   */
  TRUCK_CO2_KG_PER_KM: 0.85,
  /**
   * A mature tree absorbs roughly 21 kg of CO₂ per year — used only to make
   * the avoided-CO₂ figure relatable ("= N trees for a year").
   */
  CO2_KG_PER_TREE_YEAR: 21,
  /** Monthly CO₂-avoided goal used for the progress bar (kg). */
  MONTHLY_CO2_GOAL_KG: 500,
  /** Kilograms of CO₂ that make up one tradeable carbon credit (1 tonne). */
  CO2_KG_PER_CREDIT: 1000,
} as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Distance of a cargo request's own pickup → dropoff leg (km).
export function cargoDistanceKm(cr: CargoRequest): number {
  if (
    cr.pickup_lat == null ||
    cr.pickup_lng == null ||
    cr.dropoff_lat == null ||
    cr.dropoff_lng == null
  ) {
    return 0;
  }
  return haversineKm(
    { lat: cr.pickup_lat, lng: cr.pickup_lng },
    { lat: cr.dropoff_lat, lng: cr.dropoff_lng }
  );
}

// -------------------------------------------------------------------------
// Per-delivery breakdown
// -------------------------------------------------------------------------

export interface DeliveryMetric {
  matchId: number;
  cargoRequestId: number;
  role: "buyer" | "driver"; // buyer = pooled own cargo; driver = carried others'
  weightKg: number;
  distanceKm: number;
  priority: boolean;
  /** What a dedicated (non-pooled) delivery would have cost (RM). */
  dedicatedCostRm: number;
  /** What was actually agreed for the pooled ride (RM). */
  pooledPriceRm: number;
  /** Money saved (buyer) or earned (driver) on this delivery (RM). */
  moneyRm: number;
  /** CO₂ avoided by pooling instead of running a dedicated truck (kg). */
  co2AvoidedKg: number;
}

export interface DashboardMetrics {
  // Carbon
  co2AvoidedKg: number;
  co2FromSharedRidesKg: number; // buyer side (own cargo pooled)
  co2FromCarryingKg: number; // driver side (carried others' cargo)
  treesEquivalent: number;
  carbonCreditsEarned: number; // tradeable credits = CO₂ avoided ÷ 1 tonne
  monthlyGoalKg: number;
  goalProgressPct: number;
  totalPooledDistanceKm: number;
  // Money
  totalMoneyRm: number;
  savedAsBuyerRm: number;
  earnedAsDriverRm: number;
  deliveriesCount: number;
  avgPerDeliveryRm: number;
  // Per-delivery detail
  deliveries: DeliveryMetric[];
}

/**
 * Compute dashboard metrics from a company's accepted cargo matches.
 *
 * For each accepted match we know which side the company is on:
 *  - It owns the cargo_request  -> "buyer": it pooled its own cargo and SAVED
 *    (dedicated delivery cost − pooled price paid).
 *  - It owns the trip_listing   -> "driver": it carried someone else's cargo
 *    and EARNED the agreed pooled price (revenue from otherwise-empty space).
 *
 * Carbon: pooling a shipment onto a trip that was already running avoids a
 * whole dedicated truck trip over the shipment's distance, so
 *   co2Avoided = distanceKm × TRUCK_CO2_KG_PER_KM.
 */
export function computeDashboardMetrics(params: {
  companyId: number;
  matches: CargoMatch[];
  cargoById: Map<number, CargoRequest>;
  myCargoIds: Set<number>;
  myTripIds: Set<number>;
}): DashboardMetrics {
  const { matches, cargoById, myCargoIds, myTripIds } = params;

  const deliveries: DeliveryMetric[] = [];

  for (const m of matches) {
    if ((m.status ?? "") !== "accepted") continue;
    const cr =
      m.cargo_request_id != null ? cargoById.get(m.cargo_request_id) : undefined;
    if (!cr) continue;

    // Count a drive as soon as a driver is assigned (the match is accepted),
    // covering active orders (matched / in_transit) as well as delivered ones.
    // Only still-open, unassigned cargo is excluded.
    const cargoStatus = cr.status ?? "open";
    if (cargoStatus === "open" || cargoStatus === "cancelled") continue;

    const isBuyer = myCargoIds.has(cr.id);
    const isDriver = m.trip_listing_id != null && myTripIds.has(m.trip_listing_id);
    if (!isBuyer && !isDriver) continue;

    const weightKg = cr.weight_kg ?? 0;
    // Round distance once and derive cost + CO₂ from the SAME rounded value so
    // the figures shown to the user are internally consistent (the displayed
    // "distance × factor = CO₂" actually computes).
    const distanceKm = round2(cargoDistanceKm(cr));
    const priority = cr.priority_flag ?? false;

    const dedicatedCostRm = recommendCargoPrice({
      weightKg,
      distanceKm,
      priority,
    });
    const pooledPriceRm =
      m.agreed_price_rm != null ? Number(m.agreed_price_rm) : 0;

    const co2AvoidedKg = round2(distanceKm * METRICS.TRUCK_CO2_KG_PER_KM);

    // Money split per completed/assigned drive:
    //  - Buyer (cargo owner) SAVES a fixed share of the bundled price by
    //    bundling instead of running a dedicated delivery.
    //  - Driver (carrier) EARNS the agreed price minus the platform fee.
    const role: "buyer" | "driver" = isBuyer ? "buyer" : "driver";
    const moneyRm =
      role === "buyer"
        ? round2(pooledPriceRm * PRICING.BUYER_SAVINGS_RATE)
        : round2(pooledPriceRm * PRICING.DRIVER_REVENUE_SHARE);

    deliveries.push({
      matchId: m.id,
      cargoRequestId: cr.id,
      role,
      weightKg,
      distanceKm,
      priority,
      dedicatedCostRm,
      pooledPriceRm,
      moneyRm,
      co2AvoidedKg,
    });
  }

  const buyer = deliveries.filter((d) => d.role === "buyer");
  const driver = deliveries.filter((d) => d.role === "driver");

  const co2FromSharedRidesKg = round2(
    buyer.reduce((s, d) => s + d.co2AvoidedKg, 0)
  );
  const co2FromCarryingKg = round2(
    driver.reduce((s, d) => s + d.co2AvoidedKg, 0)
  );
  const co2AvoidedKg = round2(co2FromSharedRidesKg + co2FromCarryingKg);

  const savedAsBuyerRm = round2(buyer.reduce((s, d) => s + d.moneyRm, 0));
  const earnedAsDriverRm = round2(driver.reduce((s, d) => s + d.moneyRm, 0));
  const totalMoneyRm = round2(savedAsBuyerRm + earnedAsDriverRm);

  const totalPooledDistanceKm = round2(
    deliveries.reduce((s, d) => s + d.distanceKm, 0)
  );
  const deliveriesCount = deliveries.length;

  return {
    co2AvoidedKg,
    co2FromSharedRidesKg,
    co2FromCarryingKg,
    treesEquivalent: round2(co2AvoidedKg / METRICS.CO2_KG_PER_TREE_YEAR),
    carbonCreditsEarned:
      Math.round((co2AvoidedKg / METRICS.CO2_KG_PER_CREDIT) * 1000) / 1000,
    monthlyGoalKg: METRICS.MONTHLY_CO2_GOAL_KG,
    goalProgressPct: Math.min(
      100,
      Math.round((co2AvoidedKg / METRICS.MONTHLY_CO2_GOAL_KG) * 100)
    ),
    totalPooledDistanceKm,
    totalMoneyRm,
    savedAsBuyerRm,
    earnedAsDriverRm,
    deliveriesCount,
    avgPerDeliveryRm: deliveriesCount
      ? round2(totalMoneyRm / deliveriesCount)
      : 0,
    deliveries,
  };
}

// Pending-cargo summary derived from the company's own cargo requests.
export interface PendingSummary {
  total: number;
  inTransit: number; // matched / accepted, on the move
  queued: number; // still open, awaiting a match
}

export function computePendingSummary(
  myCargo: CargoRequest[]
): PendingSummary {
  let inTransit = 0;
  let queued = 0;
  for (const cr of myCargo) {
    const status = cr.status ?? "open";
    if (status === "matched" || status === "in_transit") inTransit += 1;
    else if (status === "open") queued += 1;
  }
  return { total: inTransit + queued, inTransit, queued };
}
