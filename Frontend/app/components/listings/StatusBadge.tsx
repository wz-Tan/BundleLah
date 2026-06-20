"use client";

import type { OrderStatus } from "@/type";
import { STATUS_STYLES } from "./listingUtils";

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} />
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
        {s.label}
      </span>
    </span>
  );
}
