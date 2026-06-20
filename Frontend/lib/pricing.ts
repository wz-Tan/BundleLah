// =========================================================================
// BundleLah pricing engine (frontend display + recommendations)
// The backend has no pricing engine yet, so recommendations are computed
// client-side from weight, distance and priority.
// =========================================================================

export const PRICING = {
  /** Flat handling fee applied to every shipment (RM). */
  BASE_HANDLING_RM: 5,
  /** Cost per kilogram of cargo (RM). */
  RM_PER_KG: 0.55,
  /** Cost per kilometre of route distance (RM). */
  RM_PER_KM: 1.5,
  /** Multiplier applied when a shipment is flagged as priority. */
  PRIORITY_MULTIPLIER: 1.3,
  /** Recommended baseline price per kg offered on a trip (RM). */
  TRIP_RM_PER_KG: 0.55,
} as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Great-circle distance between two coordinates in kilometres. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface CargoPriceInputs {
  weightKg: number;
  distanceKm?: number;
  priority?: boolean;
}

/**
 * Recommended budget (RM) for a cargo request.
 * Priority shipments incur a surcharge so they are always more expensive
 * than an equivalent standard shipment.
 */
export function recommendCargoPrice({
  weightKg,
  distanceKm = 0,
  priority = false,
}: CargoPriceInputs): number {
  if (!weightKg || weightKg <= 0) return 0;
  const base =
    PRICING.BASE_HANDLING_RM +
    weightKg * PRICING.RM_PER_KG +
    distanceKm * PRICING.RM_PER_KM;
  const withPriority = priority ? base * PRICING.PRIORITY_MULTIPLIER : base;
  return round2(withPriority);
}

/** Extra cost (RM) added purely by the priority flag, for display. */
export function prioritySurchargeRm({
  weightKg,
  distanceKm = 0,
}: CargoPriceInputs): number {
  const standard = recommendCargoPrice({ weightKg, distanceKm, priority: false });
  const priority = recommendCargoPrice({ weightKg, distanceKm, priority: true });
  return round2(priority - standard);
}

/** Recommended price per kg a logistics provider should charge on a trip. */
export function recommendTripPricePerKg(): number {
  return PRICING.TRIP_RM_PER_KG;
}
