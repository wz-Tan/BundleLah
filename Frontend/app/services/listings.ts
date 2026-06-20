// Used to Fetch Listings
import { API_BASE_URL } from "@/lib/api";
import type {
    CargoRequest,
    TripListing,
    CargoMatch,
    CargoRequestStatus,
    TripListingStatus,
} from "@/type";

/**
 * Fetch cargo requests with optional filters
 */
export async function fetchCargoRequests(params?: {
    company_id?: number;
    status_filter?: CargoRequestStatus;
    skip?: number;
    limit?: number;
}): Promise<CargoRequest[]> {
    const queryParams = new URLSearchParams();
    if (params?.company_id) queryParams.append("company_id", params.company_id.toString());
    if (params?.status_filter) queryParams.append("status_filter", params.status_filter);
    if (params?.skip !== undefined) queryParams.append("skip", params.skip.toString());
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
        `${API_BASE_URL}/cargo-requests?${queryParams.toString()}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch cargo requests");
    }

    return response.json();
}

/**
 * Fetch a single cargo request by ID
 */
export async function fetchCargoRequestById(id: number): Promise<CargoRequest> {
    const response = await fetch(`${API_BASE_URL}/cargo-requests/${id}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Cargo request not found");
    }

    return response.json();
}

/**
 * Fetch trip listings with optional filters
 */
export async function fetchTripListings(params?: {
    company_id?: number;
    origin_region?: string;
    destination_region?: string;
    status_filter?: TripListingStatus;
    skip?: number;
    limit?: number;
}): Promise<TripListing[]> {
    const queryParams = new URLSearchParams();
    if (params?.company_id) queryParams.append("company_id", params.company_id.toString());
    if (params?.origin_region) queryParams.append("origin_region", params.origin_region);
    if (params?.destination_region) queryParams.append("destination_region", params.destination_region);
    if (params?.status_filter) queryParams.append("status_filter", params.status_filter);
    if (params?.skip !== undefined) queryParams.append("skip", params.skip.toString());
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
        `${API_BASE_URL}/trip-listings?${queryParams.toString()}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch trip listings");
    }

    return response.json();
}

/**
 * Fetch a single trip listing by ID
 */
export async function fetchTripListingById(id: number): Promise<TripListing> {
    const response = await fetch(`${API_BASE_URL}/trip-listings/${id}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Trip listing not found");
    }

    return response.json();
}

/**
 * Fetch cargo matches with optional filters
 */
export async function fetchCargoMatches(params?: {
    trip_listing_id?: number;
    cargo_request_id?: number;
    status_filter?: string;
    skip?: number;
    limit?: number;
}): Promise<CargoMatch[]> {
    const queryParams = new URLSearchParams();
    if (params?.trip_listing_id) queryParams.append("trip_listing_id", params.trip_listing_id.toString());
    if (params?.cargo_request_id) queryParams.append("cargo_request_id", params.cargo_request_id.toString());
    if (params?.status_filter) queryParams.append("status_filter", params.status_filter);
    if (params?.skip !== undefined) queryParams.append("skip", params.skip.toString());
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
        `${API_BASE_URL}/cargo-matches?${queryParams.toString()}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch cargo matches");
    }

    return response.json();
}

/**
 * Fetch a single cargo match by ID
 */
export async function fetchCargoMatchById(id: number): Promise<CargoMatch> {
    const response = await fetch(`${API_BASE_URL}/cargo-matches/${id}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Cargo match not found");
    }

    return response.json();
}

