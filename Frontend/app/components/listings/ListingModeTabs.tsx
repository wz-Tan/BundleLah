"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LISTING_MODES = [
  {
    href: "/listings",
    label: "Pool requests",
    description: "For customers with logistics",
  },
  {
    href: "/listings/available-trips",
    label: "Available trips",
    description: "For customers without logistics",
  },
];

export function ListingModeTabs() {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mb-6">
      {LISTING_MODES.map((mode) => {
        const isActive = pathname === mode.href;

        return (
          <Link
            key={mode.href}
            href={mode.href}
            className={`rounded-lg border border-solid px-4 py-3 transition-colors ${
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-black/[.08] bg-white text-zinc-700 hover:border-black/[.16] dark:border-white/[.1] dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-white/[.18]"
            }`}
          >
            <span className="block text-sm font-semibold">{mode.label}</span>
            <span className={`mt-0.5 block text-xs ${isActive ? "opacity-70" : "text-zinc-400"}`}>
              {mode.description}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
