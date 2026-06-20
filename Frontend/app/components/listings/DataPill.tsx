"use client";

export function DataPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-col items-start">
      <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium leading-none mb-0.5">
        {label}
      </span>
      <span className="text-sm font-semibold text-zinc-800 tabular-nums">
        {value}
      </span>
    </span>
  );
}
