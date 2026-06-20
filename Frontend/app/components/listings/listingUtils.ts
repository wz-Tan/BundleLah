import type { OrderStatus } from "@/type";

export const STATUS_STYLES: Record<OrderStatus, { dot: string; label: string; border: string }> = {
  pending:    { dot: "bg-amber-400",   label: "Pending",    border: "border-l-amber-400"   },
  grouped:    { dot: "bg-blue-500",    label: "Grouped",    border: "border-l-blue-500"    },
  dispatched: { dot: "bg-violet-500",  label: "Dispatched", border: "border-l-violet-500"  },
  delivered:  { dot: "bg-emerald-500", label: "Delivered",  border: "border-l-emerald-500" },
  cancelled:  { dot: "bg-zinc-400",    label: "Cancelled",  border: "border-l-zinc-400"    },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-MY", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}
