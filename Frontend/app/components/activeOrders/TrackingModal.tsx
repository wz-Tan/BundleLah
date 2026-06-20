"use client";

import { useEffect, useState } from "react";

import {
  fetchDevicesByCargoMatch,
  createDevice,
  type Device,
  type CreateDevicePayload,
} from "@/app/services/device";
import {
  fetchTrackingRecords,
  type TrackingRecord,
} from "@/app/services/tracking";

interface TrackingModalProps {
  cargoMatchId: number;
  title?: string;
  onClose: () => void;
}

export function TrackingModal({
  cargoMatchId,
  title,
  onClose,
}: TrackingModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]);
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [deviceForm, setDeviceForm] = useState({
    secret: "",
    temperature_threshold: "",
    humidity_threshold: "",
    ethylene_threshold: "",
    motion_alarm: false,
  });

  const handleCreateDevice = async () => {
    if (!deviceForm.secret.trim()) {
      setError("Secret (password) is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
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
      setShowSecret(true);
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

  // Fetch the device registered for this cargo match.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const devices = await fetchDevicesByCargoMatch(cargoMatchId);
        if (cancelled) return;
        setDevice(devices.length > 0 ? (devices[0] as Device) : null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load device data"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cargoMatchId]);

  // Once a device is known, fetch its tracking records and auto-refresh (2s).
  useEffect(() => {
    if (!device) return;
    let cancelled = false;

    const loadRecords = async () => {
      try {
        const records = await fetchTrackingRecords(device.id, 50);
        if (!cancelled) {
          setTrackingRecords((prev) => {
            if (prev.length !== records.length) {
              return records;
            }

            const hasChanged = records.some((record, index) =>
              !prev[index] || prev[index].id !== record.id
            );
            return hasChanged ? records : prev;
          });
        }
      } catch (err) {
        console.error("Failed to fetch tracking records:", err);
      }
    };

    loadRecords();
    const interval = setInterval(loadRecords, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [device]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              Live IoT Tracking
            </span>
            <h3 className="text-base font-semibold text-gray-900 mt-0.5">
              {title ?? `Shipment #${cargoMatchId}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-orange-500" />
              <span className="ml-3 text-sm text-gray-500">
                Loading device data...
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && !device && !showDeviceForm && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No device configured</p>
              <p className="text-xs mt-1 mb-4">
                A device must be created for this shipment to start tracking.
              </p>
              <button
                onClick={() => setShowDeviceForm(true)}
                className="text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                + Create Device
              </button>
            </div>
          )}

          {/* Device Creation Form */}
          {showDeviceForm && !device && (
            <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4">
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

          {!loading && !error && device && (
            <div className="flex flex-col gap-4">
              {/* One-time Secret Display */}
              {showSecret && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                  <div className="flex items-start">
                    <div className="shrink-0">
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

              {/* Device info */}
              <div className="border border-green-200 bg-green-50/30 rounded-xl p-4">
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

              {/* Tracking records */}
              {trackingRecords.length > 0 ? (
                <div>
                  <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Tracking Records ({trackingRecords.length})
                  </h5>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
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
                            📍 {record.latitude?.toFixed(4)},{" "}
                            {record.longitude?.toFixed(4)}
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
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No tracking records yet</p>
                  <p className="text-xs mt-1">
                    Records will appear as the device reports data.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
