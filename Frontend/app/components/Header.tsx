"use client";

import { clearCompanySession } from "@/lib/session";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/listings", label: "Listings" },
  { href: "/profile", label: "Profile" },
  { href: "/activeOrders", label: "Your Orders" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    clearCompanySession();
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <Image
        src="/bundlelah_icon_3.svg"
        alt="BundleLah logo"
        width={50}
        height={100}
        className="object-contain"
      />

      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-md transition-all duration-150 inline-block ${
                isActive
                  ? " text-orange-600 font-bold"
                  : "text-gray-500 hover:text-gray-900 hover:scale-105"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleSignOut}
        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
