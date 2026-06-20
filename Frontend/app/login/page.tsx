"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, ApiError } from "@/lib/api";
import { saveCompany } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const company = await auth.login({ username, password });
      saveCompany(company);
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-2">
      {/* Left: input fields */}
      <div className="flex items-center justify-center px-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome back
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Log in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
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
                  placeholder="Enter your password"
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

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-orange-500 text-white text-sm font-medium py-2.5 hover:bg-orange-600 transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* Right: company branding */}
      <div className="bg-orange-100 flex items-center justify-center">
        <div className="text-center text-white">
          <Image
            src="/bundlelah_logo_2.svg"
            alt="BundleLah logo"
            width={800}
            height={800}
            className="object-contain"
          />
        </div>
      </div>
    </main>
  );
}
