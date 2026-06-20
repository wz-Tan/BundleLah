"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordsMatch = password === confirmPassword || confirmPassword === "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return;
    // wire this up to your registration endpoint
    console.log({ companyName, serialNumber, address, username, password });
  };

  return (
    <main className="min-h-screen grid grid-cols-2">
      {/* Left: input fields */}
      <div className="flex items-center justify-center px-12 overflow-y-auto py-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Create your account
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Tell us about your company to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Company information */}
            <p className="text-xs text-gray-400 uppercase tracking-wide -mb-1">
              Company Information
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Full Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Tigerlily Logistics Sdn Bhd"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Company Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SSM-202401234567"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Company registered address"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            {/* Account information */}
            <p className="text-xs text-gray-400 uppercase tracking-wide mt-2 -mb-1">
              Account Information
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-orange-500 transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                  passwordsMatch
                    ? "border-gray-200 focus:border-orange-400"
                    : "border-red-300 focus:border-red-400"
                }`}
              />
              {!passwordsMatch && (
                <span className="text-xs text-red-500">
                  Passwords do not match
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!passwordsMatch || !password}
              className="mt-2 rounded-xl bg-orange-500 text-white text-sm font-medium py-2.5 hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create account
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: company branding */}
      <div className="bg-orange-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/20 flex items-center justify-center text-3xl font-semibold mb-4">
            T
          </div>
          <h2 className="text-3xl font-semibold">BundleLah</h2>
          <p className="text-orange-50 text-sm mt-2">
            Smarter cargo, shared routes.
          </p>
        </div>
      </div>
    </main>
  );
}
