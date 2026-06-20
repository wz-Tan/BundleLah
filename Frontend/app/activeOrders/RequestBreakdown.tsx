import { useState, useEffect } from "react";
import {
    fetchDevicesByCargoMatch,
    createDevice,
    type Device,
    type CreateDevicePayload,
} from "@/app/services/device";
import {
    fetchTrackingRecords as fetchTrackingRecordsService,
    type TrackingRecord,
} from "@/app/services/tracking";
import type { OrderRequest, TripListingDisplay } from "@/app/components/activeOrders";

interface RequestBreakdownProps {
    selectedTrip: TripListingDisplay;
    selectedPoolRequest: OrderRequest;
    onClose: () => void;
}

export default function RequestBreakdown({
    selectedTrip,
    selectedPoolRequest,
    onClose,
}: RequestBreakdownProps) {
    const [device, setDevice] = useState<Device | null>(null);
    const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]);
    const [showDeviceForm, setShowDeviceForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSecret, setShowSecret] = useState(false);
    const [deviceForm, setDeviceForm] = useState({
        secret: "",
        temperature_threshold: "",
        humidity_threshold: "",
        ethylene_threshold: "",
        motion_alarm: false,
    });

    const fetchDevices = async () => {
        try {
            // TODO: Replace with actual cargo_match_id from selectedPoolRequest
            const cargoMatchId = 1; // Mock for now
            const devices = await fetchDevicesByCargoMatch(cargoMatchId);
            if (devices.length > 0) {
                setDevice(devices[0] as Device);
            }
        } catch (err) {
            console.error("Failed to fetch devices:", err);
        }
    };

    const fetchTrackingRecordsData = async (deviceId: number) => {
        try {
            const records = await fetchTrackingRecordsService(deviceId, 50);
            setTrackingRecords((prev) => {
                if (prev.length !== records.length) {
                    return records;
                }

                const hasChanged = records.some((record, index) =>
                    !prev[index] || prev[index].id !== record.id
                );
                return hasChanged ? records : prev;
            });
        } catch (err) {
            console.error("Failed to fetch tracking records:", err);
        }
    };

    const handleCreateDevice = async () => {
        if (!deviceForm.secret.trim()) {
            setError("Secret (password) is required");
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            // TODO: Replace with actual cargo_match_id from selectedPoolRequest
            const cargoMatchId = 1; // Mock for now

            const payload: CreateDevicePayload = {
                cargo_match_id: cargoMatchId,
                secret: deviceForm.secret,
                temperature_threshold: deviceForm.temperature_threshold ? parseFloat(deviceForm.temperature_threshold) : null,
                humidity_threshold: deviceForm.humidity_threshold ? parseInt(deviceForm.humidity_threshold) : null,
                ethylene_threshold: deviceForm.ethylene_threshold ? parseFloat(deviceForm.ethylene_threshold) : null,
                motion_alarm: deviceForm.motion_alarm,
            };

            const newDevice = await createDevice(payload);
            setDevice(newDevice);
            setShowSecret(true); // Show secret only on initial creation
            setShowDeviceForm(false);
            setDeviceForm({
                secret: "",
                temperature_threshold: "",
                humidity_threshold: "",
                ethylene_threshold: "",
                motion_alarm: false,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create device");
        } finally {
            setIsCreating(false);
        }
    };

    // Fetch devices for this cargo match on mount
    useEffect(() => {
        fetchDevices();
    }, []);

    // Fetch tracking records when device changes
    useEffect(() => {
        if (device) {
            fetchTrackingRecordsData(device.id);
            const interval = setInterval(() => {
                fetchTrackingRecordsData(device.id);
                console.log('fetched');
            }, 500);
            return () => clearInterval(interval);
        }
    }, [device]);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-4xl flex flex-col gap-4 my-auto relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 z-10 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors cursor-pointer"
                    aria-label="Close modal"
                >
                    <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                {/* 1. TOP POPUP: Financials & Time Metrics */}
                <div className="bg-orange-500 text-white rounded-xl p-4 shadow-lg flex justify-between items-center px-6">
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                            Pooling Optimization Breakdown
                        </h4>
                        <p className="text-sm font-light mt-0.5">
                            Accepting this pool scales up your logistics efficiency.
                        </p>
                    </div>
                    <div className="flex gap-8 text-right">
                        <div>
                            <span className="text-xs opacity-80 block uppercase tracking-wide">
                                Extra Earnings
                            </span>
                            <span className="text-xl font-bold">
                                +RM {selectedPoolRequest.price}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs opacity-80 block uppercase tracking-wide">
                                Time Impact
                            </span>
                            <span className="text-xl font-bold text-green-200">
                                -15 mins delay
                            </span>
                        </div>
                    </div>
                </div>

                {/* 2. SIDE-BY-SIDE POPUPS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Side: Pool Request Info */}
                    <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col justify-between border border-gray-100">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest bg-orange-50 px-2.5 py-1 rounded-lg">
                                    Request Breakdown
                                </span>
                                <span className="text-xs font-mono text-gray-400">
                                    {selectedPoolRequest.id}
                                </span>
                            </div>

                            <div className="space-y-3 mt-4 text-sm">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase block tracking-wider">
                                        Pickup Location
                                    </label>
                                    <p className="text-gray-900 font-medium">
                                        {selectedPoolRequest.pickup}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase block tracking-wider">
                                        Dropoff Location
                                    </label>
                                    <p className="text-gray-900 font-medium">
                                        {selectedPoolRequest.destination}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase block tracking-wider">
                                        Base Payout
                                    </label>
                                    <p className="text-base font-semibold text-gray-900">
                                        RM {selectedPoolRequest.price}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 py-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                                Decline
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 py-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                                Accept Pool
                            </button>
                        </div>
                    </div>

                    {/* Right Side: Re-routed Live Map Preview */}
                    <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col border border-gray-100 min-h-[320px]">
                        <div className="mb-3">
                            <span className="text-xs font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2.5 py-1 rounded-lg">
                                Optimized Route
                            </span>
                        </div>

                        {/* Visual Route Graphic Placeholder */}
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:14px_24px]"></div>

                            {/* Pseudo Route Flow */}
                            <div className="flex flex-col items-start gap-4 z-10 w-full px-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                                    <span className="text-gray-400">Start:</span>
                                    <span className="font-semibold text-gray-700">
                                        {selectedTrip.pickup}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 border-l-2 border-dashed border-orange-400 ml-1.5 pl-3 py-1 bg-orange-50/60 rounded-r-md pr-2 w-full">
                                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0"></span>
                                    <span className="text-orange-600 font-medium">
                                        Deviation:
                                    </span>
                                    <span className="font-semibold text-orange-800">
                                        {selectedPoolRequest.pickup}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-900 shrink-0"></span>
                                    <span className="text-gray-400">End:</span>
                                    <span className="font-semibold text-gray-700">
                                        {selectedTrip.destination}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. DEVICE & TRACKING SECTION */}
                <div className="bg-white rounded-xl p-6 shadow-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">
                                IoT Device & Tracking
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Create and monitor device for this shipment
                            </p>
                        </div>
                        {!device && !showDeviceForm && (
                            <button
                                onClick={() => setShowDeviceForm(true)}
                                className="text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                            >
                                + Create Device
                            </button>
                        )}
                    </div>

                    {/* Device Creation Form */}
                    {showDeviceForm && !device && (
                        <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4 mb-4">
                            <h5 className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-3">
                                New Device Configuration
                            </h5>
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs mb-3">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-600 block mb-1 font-medium">
                                        Device Secret (Password) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={deviceForm.secret}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, secret: e.target.value })}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter a secure password for this device"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">This will be used to authenticate the device when sending tracking data</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">
                                        Temperature Threshold (°C)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={deviceForm.temperature_threshold}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, temperature_threshold: e.target.value })}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. 25.0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">
                                        Humidity Threshold (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={deviceForm.humidity_threshold}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, humidity_threshold: e.target.value })}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. 70"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-600 block mb-1">
                                        Ethylene Threshold (ppm)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={deviceForm.ethylene_threshold}
                                        onChange={(e) => setDeviceForm({ ...deviceForm, ethylene_threshold: e.target.value })}
                                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. 1.0"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={deviceForm.motion_alarm}
                                            onChange={(e) => setDeviceForm({ ...deviceForm, motion_alarm: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Motion Alarm</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setShowDeviceForm(false);
                                        setError(null);
                                    }}
                                    className="text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                                    disabled={isCreating}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateDevice}
                                    className="text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isCreating}
                                >
                                    {isCreating ? "Creating..." : "Create Device"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Device Info */}
                    {device && (
                        <div className="border border-green-200 bg-green-50/30 rounded-xl p-4 mb-4">
                            {showSecret && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-xs font-semibold text-yellow-800">
                                                ⚠️ One-time Secret Display
                                            </p>
                                            <p className="text-xs text-yellow-700 mt-1">
                                                Save this information now. The secret will not be shown again after closing this modal.
                                            </p>
                                            <div className="mt-2 bg-white border border-yellow-300 rounded-lg p-2 font-mono text-xs break-all">
                                                <div className="text-gray-600">Device ID: <span className="font-bold text-gray-900">{device.id}</span></div>
                                                <div className="text-gray-600 mt-1">Secret: <span className="font-bold text-gray-900">{device.secret}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                                        Device Active
                                    </span>
                                    <p className="text-sm font-mono text-gray-700 mt-1">
                                        ID: {device.id}
                                    </p>
                                </div>
                                <span className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-full font-medium">
                                    Online
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500">Temp</span>
                                    <p className="font-semibold text-gray-900">
                                        {device.temperature_threshold ?? "N/A"}°C
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Humidity</span>
                                    <p className="font-semibold text-gray-900">
                                        {device.humidity_threshold ?? "N/A"}%
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Ethylene</span>
                                    <p className="font-semibold text-gray-900">
                                        {device.ethylene_threshold ?? "N/A"} ppm
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Motion</span>
                                    <p className="font-semibold text-gray-900">
                                        {device.motion_alarm ? "Enabled" : "Disabled"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tracking Records */}
                    {device && trackingRecords.length > 0 && (
                        <div>
                            <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                                Tracking Records ({trackingRecords.length})
                            </h5>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {trackingRecords.map((record) => (
                                    <div
                                        key={record.id}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-gray-400">
                                                #{record.id}
                                            </span>
                                            <span className="text-gray-500">
                                                {new Date(record.recorded_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <span className="text-gray-500">Temp:</span>
                                                <span className="font-semibold text-gray-900 ml-1">
                                                    {record.temperature?.toFixed(1) ?? "N/A"}°C
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Humidity:</span>
                                                <span className="font-semibold text-gray-900 ml-1">
                                                    {record.humidity ?? "N/A"}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Ethylene:</span>
                                                <span className="font-semibold text-gray-900 ml-1">
                                                    {record.ethylene_level?.toFixed(1) ?? "N/A"} ppm
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex justify-between items-center">
                                            <div className="text-gray-600">
                                                📍 {record.latitude?.toFixed(4)}, {record.longitude?.toFixed(4)}
                                            </div>
                                            {record.motion_detected && (
                                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                                    Motion Detected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {device && trackingRecords.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-sm">No tracking records yet</p>
                            <p className="text-xs mt-1">Records will appear as the device reports data</p>
                        </div>
                    )}

                    {!device && !showDeviceForm && (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-sm">No device configured</p>
                            <p className="text-xs mt-1">Create a device to start tracking this shipment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
