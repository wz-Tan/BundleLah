// =========================
// Shared Enums
// =========================

export type OrderStatus =
  | "pending"
  | "grouped"
  | "dispatched"
  | "delivered"
  | "cancelled";

export type TripStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TierBadge =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum";

export type PaymentStatus =
  | "paid"
  | "pending";

// =========================
// Base Models
// =========================

export interface Company {
  id: number;
  name: string;
  email: string;
  password: string;
  ssm_number: string;
  address: string;
  wallet_balance: number;
  created_at: string;
}

export interface Driver {
  id: number;
  company_id: number;
  vehicle_type: string;
  max_payload_kg: number;
  license_plate: string;
  tier_badge: TierBadge;
  total_earned: number;
}

export interface Order {
  id: number;
  company_id: number;
  supplier_address: string;

  pickup_lat: number;
  pickup_lng: number;

  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;

  weight_kg: number;
  volume_m3: number;

  pickup_window_start: string;
  pickup_window_end: string;

  status: OrderStatus;
  priority_flag: boolean;

  created_at: string;
}

export interface Trip {
  id: number;
  driver_id: number;
  status: TripStatus;

  total_distance_km: number;
  load_factor_pct: number;
  route_score: number;

  dispatched_at: string;
}

// =========================
// Route
// =========================

export interface RouteStop {
  order_id: string;
  company_name: string;

  address: string;

  lat: number;
  lng: number;

  sequence: number;

  weight_kg: number;

  arrived_at: string | null;
}

export interface RouteData {
  polyline: string;
  stops: RouteStop[];
}

// =========================
// Carbon
// =========================

export interface CarbonLog {
  id: number;
  co2_emitted_kg: number;
  co2_avoided_kg: number;
  credits_awarded: number;
  logged_at: string;
}

export interface CarbonMonthlyBreakdown {
  month: string;
  avoided_kg: number;
  credits: number;
}

// =========================
// Cost Split
// =========================

export interface CostSplit {
  id: number;
  company_id: number;
  company_name: string;

  amount_rm: number;

  weight_share_pct: number;
  route_share_pct: number;

  payment_status: PaymentStatus;

  paid_at: string | null;

  trip_id: number;
}

export interface CostSummary {
  total_trip_cost_rm: number;
  platform_fee_rm: number;
  driver_earnings_rm: number;
  solo_equivalent_rm: number;
  savings_rm: number;
}

// =========================
// API Responses
// =========================

export interface CompanyStats {
  total_orders: number;
  active_orders: number;
  total_spent_rm: number;
  carbon_credits_earned: number;
  co2_avoided_kg: number;
}

export interface GetCompanyResponse extends Company {
  stats: CompanyStats;
}

// -------------------------

export interface CreateOrderRequest {
  company_id: number;

  supplier_address: string;

  pickup_lat: number;
  pickup_lng: number;

  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;

  weight_kg: number;
  volume_m3: number;

  pickup_window_start: string;
  pickup_window_end: string;

  priority_flag: boolean;
}

// -------------------------

export interface OrderTripInfo {
  id: number;
  status: TripStatus;
  dispatched_at: string;
  driver_name: string;
  vehicle_plate: string;
}

export interface GetOrderResponse extends Order {
  trip: OrderTripInfo | null;
  estimated_cost_rm: number;
}

// -------------------------

export interface DriverTripStats {
  total_trips: number;
  avg_load_factor_pct: number;
  avg_route_score: number;
  total_distance_km: number;
}

export interface ActiveTripSummary {
  id: number;
  status: TripStatus;
  dispatched_at: string;
  stops: number;
  estimated_km: number;
}

export interface GetDriverResponse extends Driver {
  trip_stats: DriverTripStats;
  active_trip: ActiveTripSummary | null;
}

// -------------------------

export interface TripDriverInfo {
  id: number;
  name: string;
  vehicle_type: string;
  license_plate: string;
  tier_badge: TierBadge;
}

export interface GetTripResponse extends Trip {
  route: RouteData;

  driver: TripDriverInfo;

  cost_splits: CostSplit[];

  cost_summary: CostSummary;

  carbon_log: CarbonLog;
}

// -------------------------

export interface GetCompanyCarbonResponse {
  company_id: number;

  period: string;

  co2_emitted_kg: number;
  co2_avoided_kg: number;

  credits_earned: number;
  credits_balance: number;

  monthly_breakdown: CarbonMonthlyBreakdown[];
}

// -------------------------

export interface DashboardActiveOrder {
  id: number;

  status: OrderStatus;

  weight_kg: number;

  supplier_address: string;

  trip_status: TripStatus;

  driver_name: string;

  estimated_cost_rm: number;
}

export interface DashboardCompany {
  id: number;
  name: string;
  wallet_balance: number;
}

export interface DashboardCarbonSummary {
  co2_avoided_kg_this_month: number;
  credits_balance: number;
}

export interface DashboardResponse {
  company: DashboardCompany;

  active_orders: DashboardActiveOrder[];

  carbon_summary: DashboardCarbonSummary;

  wallet_balance: number;
}

// -------------------------

export interface DriverDashboardDriver {
  id: string;
  name: string;
  tier_badge: TierBadge;
  total_earned: number;
}

export interface UpcomingTrip {
  id: string;
  dispatched_at: string;
  stops: number;
  estimated_km: number;
  estimated_earn_rm: number;
}

export interface WeeklyScheduleItem {
  date: string;
  trips: number;
  earn_rm: number;
}

export interface DriverDashboardResponse {
  driver: DriverDashboardDriver;

  active_trip: GetTripResponse | null;

  earnings_this_week: number;

  upcoming_trips: UpcomingTrip[];

  weekly_schedule: WeeklyScheduleItem[];
}

// -------------------------

export interface AdminAlert {
  type: string;
  company: string;
  amount_rm: number;
  cost_split_id: string;
}

export interface AdminOverviewResponse {
  active_trips: number;
  pending_orders: number;
  available_drivers: number;

  revenue_today_rm: number;

  co2_avoided_today_kg: number;

  load_factor_avg_pct: number;

  live_trips: GetTripResponse[];

  alerts: AdminAlert[];
}