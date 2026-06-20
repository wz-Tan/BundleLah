// =========================
// Shared Enums
// =========================

export type CargoRequestStatus =
  | "open"
  | "matched"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type TripListingStatus =
  | "open"
  | "locked"
  | "in_progress"
  | "completed"
  | "cancelled";

export type MatchStatus = 
  | "pending" 
  | "accepted" 
  | "rejected";

export type InitiatedBy = 
  | "logistics_provider" 
  | "cargo_owner";

export type PaymentStatus =
  | "paid"
  | "pending";

// =========================
// Base Models
// =========================

export interface VehicleInfo {
  vehicle_type: string;
  license_plate: string;
  max_payload_kg: number;
}

export interface Vehicle {
  id: number;
  company_id: number;
  vehicle_type: string | null;
  license_plate: string | null;
  max_payload_kg: number | null;
}

export interface Company {
  id: number;
  name: string;
  username: string; // Updated from email based on your schema
  ssm_number: string;
  address: string;
  wallet_balance: number;
  created_at: string;
  vehicle_info?: VehicleInfo | null; // Null if Customer 2 (No logistics)
}

export interface CargoRequest {
  id: number;
  company_id: number;

  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;

  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;

  weight_kg: number;
  volume_m3: number;

  pickup_window_start: string;
  pickup_window_end: string;

  status: CargoRequestStatus;
  priority_flag: boolean;
  created_at: string;

  /** Budget the requester is willing to pay (RM). Frontend pricing field. */
  budget_rm?: number;
}

export interface TripListing {
  id: number;
  company_id: number;
  vehicle_id: number | null;

  origin_region: string;
  destination_region: string;
  route_json: unknown; // Ideally typed to a specific RouteData interface if keeping map polyline

  departure_window_start: string;

  available_weight_kg: number;
  available_volume_m3: number;

  status: TripListingStatus;
  created_at: string;

  /** Price per kg the provider charges (RM). Frontend pricing field. */
  price_per_kg_rm?: number;
}

export interface CargoMatch {
  id: number;
  trip_listing_id: number;
  cargo_request_id: number;
  
  initiated_by: InitiatedBy;
  status: MatchStatus;
  agreed_price_rm: number;
  
  matched_at: string;
}

// =========================
// Auxiliary Models
// =========================

export interface CostSplit {
  id: number;
  match_id: number;
  payer_company_id: number;
  payee_company_id: number;

  amount_rm: number;
  platform_fee_rm: number;

  payment_status: PaymentStatus;
  paid_at: string | null;
}

export interface CarbonLog {
  id: number;
  trip_listing_id: number;
  cargo_request_id?: number; // Nullable if log is for the whole trip rather than specific cargo

  co2_emitted_kg: number;
  co2_avoided_kg: number;
  credits_awarded: number;
  
  logged_at: string;
}

// =========================
// API Responses: Listing Pages
// =========================

// Listing Page 2: Used by non-logistics companies looking for a truck
export interface GetTripListingItem {
  id: number;
  logistics_provider: {
    company_id: number;
    name: string;
    license_plate: string;
    vehicle_type: string;
  };
  origin_region: string;
  destination_region: string;
  departure_window_start: string;
  available_capacity: {
    weight_kg: number;
    volume_m3: number;
  };
  match_status: TripListingStatus;
  estimated_price_per_kg_rm?: number;
}

export interface GetTripListingsResponse {
  results: GetTripListingItem[];
}

// Listing Page 1: Used by logistics providers looking for extra cargo
export interface LocationDetails {
  address: string;
  lat: number;
  lng: number;
  window_start?: string; // Optional for dropoff
}

export interface GetCargoRequestItem {
  id: number;
  sender_company: string;
  pickup: LocationDetails;
  dropoff: LocationDetails;
  cargo_details: {
    weight_kg: number;
    volume_m3: number;
  };
  priority_flag: boolean;
  suggested_budget_rm: number;
}

export interface GetCargoRequestsResponse {
  results: GetCargoRequestItem[];
}

// =========================
// API Responses: Matching
// =========================

export interface CreateMatchRequest {
  trip_listing_id: number;
  cargo_request_id: number;
  initiated_by: InitiatedBy;
  proposed_price_rm: number;
}

export interface MatchActionResponse {
  match_id: number;
  status: MatchStatus;
  message?: string;
  agreed_price_rm?: number;
  trip_status_updated?: boolean;
  cargo_status_updated?: boolean;
}

// =========================
// API Responses: Unified Dashboard
// =========================

export interface DashboardCompanyInfo {
  id: number;
  name: string;
  wallet_balance: number;
}

export interface MyActiveCargo {
  id: number;
  status: CargoRequestStatus;
  matched_trip_id: number | null;
  logistics_provider: string | null;
  departure_time: string | null;
}

export interface MyActiveTrip {
  id: number;
  status: TripListingStatus;
  origin_region: string;
  destination_region: string;
  departure_window_start: string;
  remaining_weight_kg: number;
}

export interface PendingMatchApproval {
  match_id: number;
  type: "incoming_request_for_my_trip" | "incoming_offer_for_my_cargo";
  from_company: string;
  cargo_weight_kg?: number;
  offered_price_rm: number;
}

export interface CarbonSummary {
  co2_avoided_kg_this_month: number;
  credits_balance: number;
}

export interface UnifiedDashboardResponse {
  company_info: DashboardCompanyInfo;
  my_active_cargo_requests: MyActiveCargo[];
  my_active_trip_listings: MyActiveTrip[];
  pending_match_approvals: PendingMatchApproval[];
  carbon_summary: CarbonSummary;
}
