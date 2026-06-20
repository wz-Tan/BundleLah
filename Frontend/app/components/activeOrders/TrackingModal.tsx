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

const gap = 700;

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
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              Live IoT Tracking
            </span>
            <h3 className="text-lg font-semibold text-gray-900 mt-0.5">
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
              <p className="text-sm mt-1 mb-4">
                A device must be created for this shipment to start tracking.
              </p>
              <button
                onClick={() => setShowDeviceForm(true)}
                className="text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                + Create Device
              </button>
            </div>
          )}

          {/* Device Creation Form */}
          {showDeviceForm && !device && (
            <div className="border border-blue-200 bg-blue-50/30 rounded-xl p-4">
              <h5 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-3">
                New Device Configuration
              </h5>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-3">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="col-span-2">
                  <label className="text-sm text-gray-600 block mb-1 font-medium">
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
                  <p className="text-sm text-gray-500 mt-1">This will be used to authenticate the device when sending tracking data</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
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
                  <label className="text-sm text-gray-600 block mb-1">
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
                  <label className="text-sm text-gray-600 block mb-1">
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
                  className="text-sm font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDevice}
                  className="text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <p className="text-sm font-semibold text-yellow-800">
                        ⚠️ One-time Secret Display
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Save this information now. The secret will not be shown again after closing this modal.
                      </p>
                      <div className="mt-2 bg-white border border-yellow-300 rounded-lg p-2 font-mono text-sm break-all">
                        <div className="text-gray-600">Device ID: <span className="font-bold text-gray-900">{device.id}</span></div>
                        <div className="text-gray-600 mt-1">Secret: <span className="font-bold text-gray-900">{device.secret}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Stats Panel */}
              {trackingRecords.length > 0 && (() => {
                const latestRecord = trackingRecords[trackingRecords.length - 1];
                const tempExceeded = device.temperature_threshold && latestRecord.temperature && latestRecord.temperature > device.temperature_threshold;
                const humExceeded = device.humidity_threshold && latestRecord.humidity && latestRecord.humidity > device.humidity_threshold;
                const ethExceeded = device.ethylene_threshold && latestRecord.ethylene_level && latestRecord.ethylene_level > device.ethylene_threshold;
                const hasAlert = tempExceeded || humExceeded || ethExceeded || latestRecord.motion_detected;

                return (
                  <div className={`border rounded-xl p-4 ${hasAlert ? 'border-red-300 bg-red-50/50' : 'border-green-200 bg-green-50/30'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`text-sm font-bold uppercase tracking-wide ${hasAlert ? 'text-red-700' : 'text-green-700'
                          }`}>
                          {hasAlert ? '⚠️ ALERT - Threshold Exceeded' : '✓ All Systems Normal'}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          Last Updated: {new Date(latestRecord.recorded_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${hasAlert ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                        }`}>
                        {hasAlert ? 'Alert' : 'Online'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className={`p-3 rounded-lg ${tempExceeded ? 'bg-red-100 border border-red-300' : 'bg-white border border-gray-200'
                        }`}>
                        <span className="text-sm text-gray-500 block mb-1">Temperature</span>
                        <p className={`text-2xl font-bold ${tempExceeded ? 'text-red-700' : 'text-gray-900'
                          }`}>
                          {latestRecord.temperature?.toFixed(1) ?? 'N/A'}°C
                        </p>
                        {device.temperature_threshold && (
                          <span className="text-sm text-gray-500">Limit: {device.temperature_threshold}°C</span>
                        )}
                        {tempExceeded && (
                          <span className="text-sm text-red-600 font-semibold block mt-1">⚠️ EXCEEDED</span>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${humExceeded ? 'bg-red-100 border border-red-300' : 'bg-white border border-gray-200'
                        }`}>
                        <span className="text-sm text-gray-500 block mb-1">Humidity</span>
                        <p className={`text-2xl font-bold ${humExceeded ? 'text-red-700' : 'text-gray-900'
                          }`}>
                          {latestRecord.humidity ?? 'N/A'}%
                        </p>
                        {device.humidity_threshold && (
                          <span className="text-sm text-gray-500">Limit: {device.humidity_threshold}%</span>
                        )}
                        {humExceeded && (
                          <span className="text-sm text-red-600 font-semibold block mt-1">⚠️ EXCEEDED</span>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${ethExceeded ? 'bg-red-100 border border-red-300' : 'bg-white border border-gray-200'
                        }`}>
                        <span className="text-sm text-gray-500 block mb-1">Ethylene</span>
                        <p className={`text-2xl font-bold ${ethExceeded ? 'text-red-700' : 'text-gray-900'
                          }`}>
                          {latestRecord.ethylene_level?.toFixed(1) ?? 'N/A'} ppm
                        </p>
                        {device.ethylene_threshold && (
                          <span className="text-sm text-gray-500">Limit: {device.ethylene_threshold} ppm</span>
                        )}
                        {ethExceeded && (
                          <span className="text-sm text-red-600 font-semibold block mt-1">⚠️ EXCEEDED</span>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${latestRecord.motion_detected ? 'bg-red-100 border border-red-300' : 'bg-white border border-gray-200'
                        }`}>
                        <span className="text-sm text-gray-500 block mb-1">Motion</span>
                        <p className={`text-2xl font-bold ${latestRecord.motion_detected ? 'text-red-700' : 'text-gray-900'
                          }`}>
                          {latestRecord.motion_detected ? 'Detected' : 'None'}
                        </p>
                        <span className="text-sm text-gray-500">
                          Alarm: {device.motion_alarm ? 'On' : 'Off'}
                        </span>
                        {latestRecord.motion_detected && (
                          <span className="text-sm text-red-600 font-semibold block mt-1">⚠️ ALERT</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tracking records */}
              {trackingRecords.length > 0 ? (
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Tracking Records ({trackingRecords.length})
                  </h5>

                  {/* Chart Visualization */}
                  {trackingRecords.length > 1 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="space-y-4">
                        {/* Temperature Chart */}
                        {trackingRecords.some(r => r.temperature !== null) && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">Temperature (°C)</span>
                              {device.temperature_threshold && (
                                <span className="text-sm text-orange-600">Threshold: {device.temperature_threshold}°C</span>
                              )}
                            </div>
                            <div className="relative h-40 bg-gray-50 rounded">
                              <svg className="w-full h-full" preserveAspectRatio="none">
                                <polyline
                                  fill="none"
                                  stroke="#ef4444"
                                  strokeWidth="2"
                                  points={trackingRecords
                                    .map((r, i) => {
                                      const temps = trackingRecords.map(r => r.temperature || 0);
                                      const maxTemp = Math.max(...temps, device.temperature_threshold || 0);
                                      const minTemp = Math.min(...temps);
                                      const range = maxTemp - minTemp || 1;
                                      const x = (i / (trackingRecords.length - 1)) * gap;
                                      const y = 100 - (((r.temperature || 0) - minTemp) / range) * 80;
                                      return `${x},${y}`;
                                    })
                                    .join(" ")}
                                />
                                {device.temperature_threshold && (() => {
                                  const temps = trackingRecords.map(r => r.temperature || 0);
                                  const maxTemp = Math.max(...temps, device.temperature_threshold);
                                  const minTemp = Math.min(...temps);
                                  const range = maxTemp - minTemp || 1;
                                  const thresholdY = 100 - ((device.temperature_threshold - minTemp) / range) * 80;
                                  return (
                                    <line
                                      x1="0"
                                      y1={`${thresholdY}%`}
                                      x2="100%"
                                      y2={`${thresholdY}%`}
                                      stroke="#f97316"
                                      strokeWidth="1"
                                      strokeDasharray="4,4"
                                      opacity="0.5"
                                    />
                                  );
                                })()}
                              </svg>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400 mt-1">
                              <span>{trackingRecords[0]?.temperature?.toFixed(1)}°C</span>
                              <span>{trackingRecords[trackingRecords.length - 1]?.temperature?.toFixed(1)}°C</span>
                            </div>
                          </div>
                        )}

                        {/* Humidity Chart */}
                        {trackingRecords.some(r => r.humidity !== null) && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">Humidity (%)</span>
                              {device.humidity_threshold && (
                                <span className="text-sm text-blue-600">Threshold: {device.humidity_threshold}%</span>
                              )}
                            </div>
                            <div className="relative h-40 bg-gray-50 rounded">
                              <svg className="w-full h-full" preserveAspectRatio="none">
                                <polyline
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="2"
                                  points={trackingRecords
                                    .map((r, i) => {
                                      const humidities = trackingRecords.map(r => r.humidity || 0);
                                      const maxHum = Math.max(...humidities, device.humidity_threshold || 0);
                                      const minHum = Math.min(...humidities);
                                      const range = maxHum - minHum || 1;
                                      const x = (i / (trackingRecords.length - 1)) * gap;
                                      const y = 100 - (((r.humidity || 0) - minHum) / range) * 80;
                                      return `${x},${y}`;
                                    })
                                    .join(" ")}
                                />
                                {device.humidity_threshold && (() => {
                                  const humidities = trackingRecords.map(r => r.humidity || 0);
                                  const maxHum = Math.max(...humidities, device.humidity_threshold);
                                  const minHum = Math.min(...humidities);
                                  const range = maxHum - minHum || 1;
                                  const thresholdY = 100 - ((device.humidity_threshold - minHum) / range) * 80;
                                  return (
                                    <line
                                      x1="0"
                                      y1={`${thresholdY}%`}
                                      x2="100%"
                                      y2={`${thresholdY}%`}
                                      stroke="#3b82f6"
                                      strokeWidth="1"
                                      strokeDasharray="4,4"
                                      opacity="0.5"
                                    />
                                  );
                                })()}
                              </svg>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400 mt-1">
                              <span>{trackingRecords[0]?.humidity}%</span>
                              <span>{trackingRecords[trackingRecords.length - 1]?.humidity}%</span>
                            </div>
                          </div>
                        )}

                        {/* Ethylene Chart */}
                        {trackingRecords.some(r => r.ethylene_level !== null) && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">Ethylene (ppm)</span>
                              {device.ethylene_threshold && (
                                <span className="text-sm text-purple-600">Threshold: {device.ethylene_threshold} ppm</span>
                              )}
                            </div>
                            <div className="relative h-40 bg-gray-50 rounded">
                              <svg className="w-full h-full" preserveAspectRatio="none">
                                <polyline
                                  fill="none"
                                  stroke="#8b5cf6"
                                  strokeWidth="2"
                                  points={trackingRecords
                                    .map((r, i) => {
                                      const ethylenes = trackingRecords.map(r => r.ethylene_level || 0);
                                      const maxEth = Math.max(...ethylenes, device.ethylene_threshold || 0);
                                      const minEth = Math.min(...ethylenes);
                                      const range = maxEth - minEth || 1;
                                      const x = (i / (trackingRecords.length - 1)) * gap;
                                      const y = 100 - (((r.ethylene_level || 0) - minEth) / range) * 80;
                                      return `${x},${y}`;
                                    })
                                    .join(" ")}
                                />
                                {device.ethylene_threshold && (() => {
                                  const ethylenes = trackingRecords.map(r => r.ethylene_level || 0);
                                  const maxEth = Math.max(...ethylenes, device.ethylene_threshold);
                                  const minEth = Math.min(...ethylenes);
                                  const range = maxEth - minEth || 1;
                                  const thresholdY = 100 - ((device.ethylene_threshold - minEth) / range) * 80;
                                  return (
                                    <line
                                      x1="0"
                                      y1={`${thresholdY}%`}
                                      x2="100%"
                                      y2={`${thresholdY}%`}
                                      stroke="#8b5cf6"
                                      strokeWidth="1"
                                      strokeDasharray="4,4"
                                      opacity="0.5"
                                    />
                                  );
                                })()}
                              </svg>
                            </div>
                            <div className="flex justify-between text-sm text-gray-400 mt-1">
                              <span>{trackingRecords[0]?.ethylene_level?.toFixed(1)} ppm</span>
                              <span>{trackingRecords[trackingRecords.length - 1]?.ethylene_level?.toFixed(1)} ppm</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Detailed Records List */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 mb-2 list-none flex items-center gap-2">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      View Detailed Records
                    </summary>
                    <div className="space-y-2 max-h-60 overflow-y-auto mt-2">
                      {trackingRecords.map((record) => (
                        <div
                          key={record.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"
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
                              <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                Motion Detected
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No tracking records yet</p>
                  <p className="text-sm mt-1">
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
