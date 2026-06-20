// =========================================================================
// BundleLah API client
// Thin, typed wrapper around the FastAPI backend.
// Base URL comes from NEXT_PUBLIC_API_URL (defaults to local dev server).
// =========================================================================

import type {
  Company,
  Vehicle,
  CargoRequest,
  TripListing,
  CargoMatch,
  CostSplit,
  CarbonLog,
  GetCargoRequestItem,
  GetTripListingItem,
} from "@/type";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) {
        detail =
          typeof body.detail === "string"
            ? body.detail
            : JSON.stringify(body.detail);
      }
    } catch {
      // response had no JSON body
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

// =========================================================================
// Request payload types (mirror the backend create/update schemas)
// =========================================================================

export interface RegisterPayload {
  name: string;
  username: string;
  ssm_number: string;
  address: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface CompanyUpdatePayload {
  name?: string;
  password?: string;
  address?: string;
}

export interface VehicleCreatePayload {
  company_id: number;
  vehicle_type?: string;
  license_plate?: string;
  max_payload_kg?: number;
}

export interface VehicleUpdatePayload {
  vehicle_type?: string;
  license_plate?: string;
  max_payload_kg?: number;
}

export interface CargoRequestCreatePayload {
  company_id: number;
  pickup_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address: string;
  dropoff_lat?: number;
  dropoff_lng?: number;
  weight_kg?: number;
  volume_m3?: number;
  pickup_window_start?: string;
  pickup_window_end?: string;
  priority_flag?: boolean;
}

export interface TripListingCreatePayload {
  company_id: number;
  vehicle_id?: number;
  origin_region: string;
  destination_region: string;
  route_json?: unknown;
  departure_window_start: string;
  available_weight_kg?: number;
  available_volume_m3?: number;
}

export type InitiatedBy = "carrier" | "shipper";

export interface CargoMatchCreatePayload {
  trip_listing_id: number;
  cargo_request_id: number;
  initiated_by?: InitiatedBy;
  agreed_price_rm?: number;
}

export interface CargoMatchUpdatePayload {
  status?: "pending" | "accepted" | "rejected";
  agreed_price_rm?: number;
}

export interface CostSplitCreatePayload {
  match_id: number;
  payer_company_id: number;
  payee_company_id: number;
  amount_rm?: number;
  platform_fee_rm?: number;
}

// =========================================================================
// Endpoint groups
// =========================================================================

export const auth = {
  register: (payload: RegisterPayload) =>
    request<Company>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: LoginPayload) =>
    request<Company>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const companies = {
  list: (params: { skip?: number; limit?: number } = {}) =>
    request<Company[]>(`/companies${query(params)}`),
  get: (id: number) => request<Company>(`/companies/${id}`),
  update: (id: number, payload: CompanyUpdatePayload) =>
    request<Company>(`/companies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export const vehicles = {
  list: (params: { company_id?: number; skip?: number; limit?: number } = {}) =>
    request<Vehicle[]>(`/vehicles${query(params)}`),
  get: (id: number) => request<Vehicle>(`/vehicles/${id}`),
  create: (payload: VehicleCreatePayload) =>
    request<Vehicle>("/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: VehicleUpdatePayload) =>
    request<Vehicle>(`/vehicles/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<void>(`/vehicles/${id}`, { method: "DELETE" }),
};

export const cargoRequests = {
  list: (
    params: {
      company_id?: number;
      status_filter?: string;
      skip?: number;
      limit?: number;
    } = {}
  ) => request<CargoRequest[]>(`/cargo-requests${query(params)}`),
  get: (id: number) => request<CargoRequest>(`/cargo-requests/${id}`),
  create: (payload: CargoRequestCreatePayload) =>
    request<CargoRequest>("/cargo-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<void>(`/cargo-requests/${id}`, { method: "DELETE" }),
};

export const tripListings = {
  list: (
    params: {
      company_id?: number;
      origin_region?: string;
      destination_region?: string;
      status_filter?: string;
      skip?: number;
      limit?: number;
    } = {}
  ) => request<TripListing[]>(`/trip-listings${query(params)}`),
  get: (id: number) => request<TripListing>(`/trip-listings/${id}`),
  create: (payload: TripListingCreatePayload) =>
    request<TripListing>("/trip-listings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  remove: (id: number) =>
    request<void>(`/trip-listings/${id}`, { method: "DELETE" }),
};

export const cargoMatches = {
  list: (
    params: {
      trip_listing_id?: number;
      cargo_request_id?: number;
      status_filter?: string;
    } = {}
  ) => request<CargoMatch[]>(`/cargo-matches${query(params)}`),
  get: (id: number) => request<CargoMatch>(`/cargo-matches/${id}`),
  create: (payload: CargoMatchCreatePayload) =>
    request<CargoMatch>("/cargo-matches", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: number, payload: CargoMatchUpdatePayload) =>
    request<CargoMatch>(`/cargo-matches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export const costSplits = {
  list: (params: { company_id?: number; role?: "payer" | "payee" } = {}) =>
    request<CostSplit[]>(`/cost-splits${query(params)}`),
  get: (id: number) => request<CostSplit>(`/cost-splits/${id}`),
  create: (payload: CostSplitCreatePayload) =>
    request<CostSplit>("/cost-splits", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  pay: (id: number) =>
    request<CostSplit>(`/cost-splits/${id}/pay`, { method: "POST" }),
};

export const carbonLogs = {
  list: (
    params: { trip_listing_id?: number; cargo_request_id?: number } = {}
  ) => request<CarbonLog[]>(`/carbon-logs${query(params)}`),
  get: (id: number) => request<CarbonLog>(`/carbon-logs/${id}`),
};

// =========================================================================
// Mappers: flat backend models -> aggregated shapes used by the UI
// =========================================================================

// Rough cost estimate used for display only (backend has no pricing engine yet).
const ESTIMATED_RM_PER_KG = 0.55;

export function estimateBudgetRm(weightKg: number | null | undefined): number {
  if (!weightKg || weightKg <= 0) return 0;
  return Math.round(weightKg * ESTIMATED_RM_PER_KG * 100) / 100;
}

export function toCargoRequestItem(
  cr: CargoRequest,
  companyName: string
): GetCargoRequestItem {
  return {
    id: cr.id,
    sender_company: companyName,
    pickup: {
      address: cr.pickup_address,
      lat: cr.pickup_lat ?? 0,
      lng: cr.pickup_lng ?? 0,
      window_start: cr.pickup_window_start ?? undefined,
    },
    dropoff: {
      address: cr.dropoff_address,
      lat: cr.dropoff_lat ?? 0,
      lng: cr.dropoff_lng ?? 0,
    },
    cargo_details: {
      weight_kg: cr.weight_kg ?? 0,
      volume_m3: cr.volume_m3 ?? 0,
    },
    priority_flag: cr.priority_flag,
    suggested_budget_rm: estimateBudgetRm(cr.weight_kg),
  };
}

export function toTripListingItem(
  tl: TripListing,
  company: Company | undefined,
  vehicle: Vehicle | undefined
): GetTripListingItem {
  return {
    id: tl.id,
    logistics_provider: {
      company_id: tl.company_id,
      name: company?.name ?? `Company #${tl.company_id}`,
      license_plate: vehicle?.license_plate ?? "—",
      vehicle_type: vehicle?.vehicle_type ?? "Vehicle",
    },
    origin_region: tl.origin_region,
    destination_region: tl.destination_region,
    departure_window_start: tl.departure_window_start,
    available_capacity: {
      weight_kg: tl.available_weight_kg ?? 0,
      volume_m3: tl.available_volume_m3 ?? 0,
    },
    match_status: tl.status,
  };
}

// Build an id -> company-name lookup from a companies list.
export function buildCompanyNameMap(list: Company[]): Map<number, string> {
  return new Map(list.map((c) => [c.id, c.name]));
}
