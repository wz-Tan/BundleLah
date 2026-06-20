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

export default function ProfilePage() {
  return (
    <main className="mx-12 my-8">
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
              <CopyableRow label="Full Company Name" value={PROFILE.companyName} />
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
              <CopyableRow label="Wallet Balance" value={PROFILE.walletBalance} />
              <CopyableRow label="Created At" value={PROFILE.createdAt} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}