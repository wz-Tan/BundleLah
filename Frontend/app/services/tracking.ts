import { API_BASE_URL } from "@/lib/api";

export interface TrackingRecord {
    id: number;
    device_id: number;
    device_time: number | null;
    humidity: number | null;
    temperature: number | null;
    longitude: number | null;
    latitude: number | null;
    ethylene_level: number | null;
    motion_detected: boolean;
    recorded_at: string;
}

export interface CreateTrackingRecordPayload {
    device_id: number;
    secret: string;
    device_time?: number | null;
    humidity?: number | null;
    temperature?: number | null;
    longitude?: number | null;
    latitude?: number | null;
    ethylene_level?: number | null;
    motion_detected?: boolean;
}

/**
 * Fetch tracking records for a device
 */
export async function fetchTrackingRecords(
    deviceId: number,
    limit: number = 100,
    skip: number = 0
): Promise<TrackingRecord[]> {
    const response = await fetch(
        `${API_BASE_URL}/tracking?device_id=${deviceId}&limit=${limit}&skip=${skip}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch tracking records");
    }

    return response.json();
}

/**
 * Create a new tracking record
 */
export async function createTrackingRecord(
    payload: CreateTrackingRecordPayload
): Promise<TrackingRecord> {
    const response = await fetch(`${API_BASE_URL}/tracking`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create tracking record");
    }

    return response.json();
}

/**
 * Get a single tracking record by ID
 */
export async function fetchTrackingRecordById(recordId: number): Promise<TrackingRecord> {
    const response = await fetch(`${API_BASE_URL}/tracking/${recordId}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Tracking record not found");
    }

    return response.json();
}
