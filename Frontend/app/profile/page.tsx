"use client";

import { useEffect, useState } from "react";
import type { Company, Vehicle } from "@/type";
import { companies, vehicles as vehiclesApi } from "@/lib/api";
import { getCurrentCompanyId } from "@/lib/session";

const VEHICLE_TYPES = ["Car", "Van", "Lorry", "Motorcycle", "Pickup Truck"];

function formatRm(value: number | null | undefined) {
  const n = typeof value === "number" ? value : 0;
  return `RM ${n.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function CopyableRow({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex justify-between items-center py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-900">{value}</span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

function AddVehicleModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (vehicle: { type: string; plateNumber: string }) => void;
}) {
  const [type, setType] = useState(VEHICLE_TYPES[0]);
  const [plateNumber, setPlateNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) return;
    onSubmit({ type, plateNumber: plateNumber.trim().toUpperCase() });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-1">Add Vehicle</h3>
        <p className="text-sm text-gray-400 mb-6">
          Register a vehicle under your company
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Vehicle Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white"
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 uppercase tracking-wide">
              Car Plate Number
            </label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="e.g. WXY 1234"
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors uppercase placeholder:normal-case"
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 text-sm font-medium py-2.5 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!plateNumber.trim()}
              className="flex-1 rounded-xl bg-orange-500 text-white text-sm font-medium py-2.5 hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [vehicleList, setVehicleList] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      // Prefer the logged-in company; fall back to the first company on record.
      let companyId = getCurrentCompanyId();
      if (companyId == null) {
        const list = await companies.list({ limit: 1 });
        if (list.length === 0) {
          setCompany(null);
          setVehicleList([]);
          return;
        }
        companyId = list[0].id;
      }

      const [comp, vehs] = await Promise.all([
        companies.get(companyId),
        vehiclesApi.list({ company_id: companyId }),
      ]);
      setCompany(comp);
      setVehicleList(vehs);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load your profile"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleAddVehicle(vehicle: {
    type: string;
    plateNumber: string;
  }) {
    if (!company) return;
    try {
      const created = await vehiclesApi.create({
        company_id: company.id,
        vehicle_type: vehicle.type,
        license_plate: vehicle.plateNumber,
      });
      setVehicleList((prev) => [...prev, created]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add vehicle"
      );
    }
  }

  if (loading) {
    return (
      <main className="mx-12 my-8">
        <p className="text-sm text-gray-400">Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-12 my-8">
        <p className="text-base font-semibold text-red-500">
          Couldn&apos;t load profile
        </p>
        <p className="text-sm text-gray-400 mt-1">{error}</p>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="mx-12 my-8">
        <p className="text-base font-semibold text-gray-700">No company found</p>
        <p className="text-sm text-gray-400 mt-1">
          Register a company to get started.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-12 my-8 relative min-h-screen">
      <div className="grid grid-cols-10 gap-6">
        {/* Identity card */}
        <div className="col-span-4 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-2xl font-semibold">
              {company.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{company.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                @{company.username}
              </p>
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
              Active
            </span>
          </div>

          {/* Vehicles */}
          <h2 className="text-xl font-semibold">Vehicles</h2>
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-2">
            {vehicleList.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {vehicleList.map((v) => (
                  <div
                    key={v.id}
                    className="flex justify-between items-center py-2.5 text-sm"
                  >
                    <span className="text-gray-500">
                      {v.vehicle_type ?? "Vehicle"}
                    </span>
                    <span className="font-medium text-gray-900 tracking-wide">
                      {v.license_plate ?? "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-3">
                No vehicles added yet.
              </p>
            )}
          </div>
        </div>

        {/* Details card */}
        <div className="col-span-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Company Details</h2>

          {/* Company information */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide pt-3 pb-1">
              Company Information
            </p>
            <div className="divide-y divide-gray-100">
              <CopyableRow label="Full Company Name" value={company.name} />
              <CopyableRow
                label="Company Serial Number"
                value={company.ssm_number}
                copyable
              />
              <CopyableRow label="Address" value={company.address} />
            </div>
          </div>

          {/* Account information */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide pt-3 pb-1">
              Account Information
            </p>
            <div className="divide-y divide-gray-100">
              <CopyableRow
                label="ID"
                value={String(company.id)}
                copyable
              />
              <CopyableRow
                label="Wallet Balance"
                value={formatRm(company.wallet_balance)}
              />
              <CopyableRow
                label="Created At"
                value={formatDate(company.created_at)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Vehicle button */}
      <button
        onClick={() => setShowAddVehicle(true)}
        className="fixed bottom-8 right-8 flex items-center gap-2 rounded-full bg-orange-500 text-white text-sm font-semibold px-5 h-11 shadow-lg hover:bg-orange-600 transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Add Vehicle
      </button>

      {showAddVehicle && (
        <AddVehicleModal
          onClose={() => setShowAddVehicle(false)}
          onSubmit={handleAddVehicle}
        />
      )}
    </main>
  );
}
