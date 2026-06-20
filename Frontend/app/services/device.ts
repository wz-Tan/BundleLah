import { API_BASE_URL } from "@/lib/api";

export interface Device {
    id: number;
    cargo_match_id: number;
    secret: string;
    temperature_threshold: number | null;
    humidity_threshold: number | null;
    ethylene_threshold: number | null;
    motion_alarm: boolean;
    created_at: string;
}

export interface DevicePublic {
    id: number;
    cargo_match_id: number;
    temperature_threshold: number | null;
    humidity_threshold: number | null;
    ethylene_threshold: number | null;
    motion_alarm: boolean;
    created_at: string;
}

export interface CreateDevicePayload {
    cargo_match_id: number;
    secret: string;
    temperature_threshold: number | null;
    humidity_threshold: number | null;
    ethylene_threshold: number | null;
    motion_alarm: boolean;
}

/**
 * Fetch all devices for a specific cargo match
 */
export async function fetchDevicesByCargoMatch(
    cargoMatchId: number,
    skip: number = 0,
    limit: number = 50
): Promise<DevicePublic[]> {
    const response = await fetch(
        `${API_BASE_URL}/devices?cargo_match_id=${cargoMatchId}&skip=${skip}&limit=${limit}`
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch devices");
    }

    return response.json();
}

/**
 * Create a new device for tracking
 */
export async function createDevice(payload: CreateDevicePayload): Promise<Device> {
    const response = await fetch(`${API_BASE_URL}/devices`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create device");
    }

    return response.json();
}

/**
 * Get a single device by ID
 */
export async function fetchDeviceById(deviceId: number): Promise<DevicePublic> {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Device not found");
    }

    return response.json();
}
export interface AlertDetail {
    alert_type: string;
    current_value: number | boolean | null;
    threshold: number | boolean | null;
    message: string;
    timestamp: string;
}

export interface DeviceAlerts {
    device_id: number;
    alerts: AlertDetail[];
}

/**
 * Get alerts for a specific device
 */
export async function fetchDeviceAlerts(deviceId: number): Promise<DeviceAlerts> {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/alerts`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to fetch device alerts");
    }

    return response.json();
}