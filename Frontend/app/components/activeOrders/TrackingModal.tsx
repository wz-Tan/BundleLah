"use client";

import { useEffect, useState } from "react";

import {
  fetchDevicesByCargoMatch,
  type DevicePublic,
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
  const [device, setDevice] = useState<DevicePublic | null>(null);
  const [trackingRecords, setTrackingRecords] = useState<TrackingRecord[]>([]);

  // Fetch the device registered for this cargo match (same as RequestBreakdown).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const devices = await fetchDevicesByCargoMatch(cargoMatchId);
        if (cancelled) return;
        setDevice(devices.length > 0 ? devices[0] : null);
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

  // Once a device is known, fetch its tracking records and auto-refresh (10s).
  useEffect(() => {
    if (!device) return;
    let cancelled = false;

    const loadRecords = async () => {
      try {
        const records = await fetchTrackingRecords(device.id, 50);
        if (!cancelled) setTrackingRecords(records);
      } catch (err) {
        console.error("Failed to fetch tracking records:", err);
      }
    };

    loadRecords();
    const interval = setInterval(loadRecords, 10000);
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

          {!loading && !error && !device && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No device configured</p>
              <p className="text-xs mt-1">
                A device must be created for this shipment to start tracking.
              </p>
            </div>
          )}

          {!loading && !error && device && (
            <div className="flex flex-col gap-4">
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
