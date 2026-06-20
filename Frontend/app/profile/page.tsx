"use client";

import { useState } from "react";

const PROFILE = {
  id: "USR-2024-00187",
  companyName: "Tigerlily Logistics Sdn Bhd",
  serialNumber: "SSM-202401234567",
  address: "12-3, Jalan Sungai Besi, 41200 Klang, Selangor, Malaysia",
  walletBalance: "RM 1,250.00",
  createdAt: "14 March 2024",
  verified: true,
};

interface Vehicle {
  id: string;
  type: string;
  plateNumber: string;
}

const VEHICLE_TYPES = ["Car", "Van", "Lorry", "Motorcycle", "Pickup Truck"];

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: "1", type: "Van", plateNumber: "WXY 1234" },
  ]);

  const handleAddVehicle = (vehicle: { type: string; plateNumber: string }) => {
    setVehicles((prev) => [...prev, { id: crypto.randomUUID(), ...vehicle }]);
  };

  return (
    <main className="mx-12 my-8 relative min-h-screen">
      <div className="grid grid-cols-10 gap-6">
        {/* Identity card */}
        <div className="col-span-4 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Profile</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-2xl font-semibold">
              {PROFILE.companyName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {PROFILE.companyName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{PROFILE.id}</p>
            </div>
            {PROFILE.verified ? (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Verified
              </span>
            ) : (
              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                Pending Verification
              </span>
            )}
          </div>

          {/* Vehicles */}
          <h2 className="text-xl font-semibold">Vehicles</h2>
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-2">
            {vehicles.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="flex justify-between items-center py-2.5 text-sm"
                  >
                    <span className="text-gray-500">{v.type}</span>
                    <span className="font-medium text-gray-900 tracking-wide">
                      {v.plateNumber}
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
          <h2 className="text-xl font-semibold">Verification Details</h2>

          {/* Company information */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide pt-3 pb-1">
              Company Information
            </p>
            <div className="divide-y divide-gray-100">
              <CopyableRow
                label="Full Company Name"
                value={PROFILE.companyName}
              />
              <CopyableRow
                label="Company Serial Number"
                value={PROFILE.serialNumber}
                copyable
              />
              <CopyableRow label="Address" value={PROFILE.address} />
            </div>
          </div>

          {/* Account information */}
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide pt-3 pb-1">
              Account Information
            </p>
            <div className="divide-y divide-gray-100">
              <CopyableRow label="ID" value={PROFILE.id} copyable />
              <CopyableRow
                label="Wallet Balance"
                value={PROFILE.walletBalance}
              />
              <CopyableRow label="Created At" value={PROFILE.createdAt} />
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
