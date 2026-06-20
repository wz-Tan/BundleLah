"use client";

import { useState } from "react";
import type { CreateOrderRequest } from "@/type";

interface CreateFormState {
  supplier_address: string;
  dropoff_address: string;
  weight_kg: string;
  volume_m3: string;
  pickup_window_start: string;
  pickup_window_end: string;
  priority_flag: boolean;
}

type CreateTextField = Exclude<keyof CreateFormState, "priority_flag">;

function TextField({
  label,
  field,
  value,
  error,
  type = "text",
  placeholder,
  onChange,
}: {
  label: string;
  field: CreateTextField;
  value: string;
  error?: string;
  type?: string;
  placeholder?: string;
  onChange: (field: CreateTextField, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(field, e.target.value)}
        className={`h-10 rounded-lg border border-solid px-3 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-amber-400 transition-colors ${
          error ? "border-red-400" : "border-black/[.08] dark:border-white/[.1]"
        }`}
      />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

export function CreateOrderModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (req: CreateOrderRequest) => void;
}) {
  const [form, setForm] = useState<CreateFormState>({
    supplier_address: "",
    dropoff_address: "",
    weight_kg: "",
    volume_m3: "",
    pickup_window_start: "",
    pickup_window_end: "",
    priority_flag: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateFormState, string>>>({});

  function validate(): Partial<Record<keyof CreateFormState, string>> {
    const e: Partial<Record<keyof CreateFormState, string>> = {};
    if (!form.supplier_address.trim()) e.supplier_address = "Pickup address is required.";
    if (!form.dropoff_address.trim())  e.dropoff_address  = "Dropoff address is required.";
    if (!form.weight_kg || isNaN(Number(form.weight_kg)) || Number(form.weight_kg) <= 0)
      e.weight_kg = "Enter a valid weight.";
    if (!form.volume_m3 || isNaN(Number(form.volume_m3)) || Number(form.volume_m3) <= 0)
      e.volume_m3 = "Enter a valid volume.";
    if (!form.pickup_window_start) e.pickup_window_start = "Pickup start time is required.";
    if (!form.pickup_window_end)   e.pickup_window_end   = "Pickup end time is required.";
    if (
      form.pickup_window_start &&
      form.pickup_window_end &&
      form.pickup_window_end <= form.pickup_window_start
    ) {
      e.pickup_window_end = "End time must be after start time.";
    }
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const req: CreateOrderRequest = {
      company_id: 1,
      supplier_address: form.supplier_address,
      pickup_lat: 1.55,
      pickup_lng: 110.33,
      dropoff_address: form.dropoff_address,
      dropoff_lat: 1.6,
      dropoff_lng: 110.29,
      weight_kg: Number(form.weight_kg),
      volume_m3: Number(form.volume_m3),
      pickup_window_start: new Date(form.pickup_window_start).toISOString(),
      pickup_window_end:   new Date(form.pickup_window_end).toISOString(),
      priority_flag: form.priority_flag,
    };
    onSubmit(req);
  }

  function setField<K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(er => { const c = { ...er }; delete c[key]; return c; });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[.06] dark:border-white/[.08]">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-0.5">
              New Shipment
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Place an Order
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <TextField
            label="Pickup Address"
            field="supplier_address"
            value={form.supplier_address}
            error={errors.supplier_address}
            onChange={setField}
            placeholder="e.g. Warehouse 5, Bintawa Industrial Estate"
          />
          <TextField
            label="Dropoff Address"
            field="dropoff_address"
            value={form.dropoff_address}
            error={errors.dropoff_address}
            onChange={setField}
            placeholder="e.g. Lot 88, Demak Laut Industrial Park"
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Weight (kg)"
              field="weight_kg"
              value={form.weight_kg}
              error={errors.weight_kg}
              type="number"
              onChange={setField}
              placeholder="320.5"
            />
            <TextField
              label="Volume (m³)"
              field="volume_m3"
              value={form.volume_m3}
              error={errors.volume_m3}
              type="number"
              onChange={setField}
              placeholder="4.2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Pickup Window — Start"
              field="pickup_window_start"
              value={form.pickup_window_start}
              error={errors.pickup_window_start}
              type="datetime-local"
              onChange={setField}
            />
            <TextField
              label="Pickup Window — End"
              field="pickup_window_end"
              value={form.pickup_window_end}
              error={errors.pickup_window_end}
              type="datetime-local"
              onChange={setField}
            />
          </div>

          <label className="flex items-center justify-between cursor-pointer rounded-lg border border-solid border-black/[.06] dark:border-white/[.08] px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Priority shipment</p>
              <p className="text-xs text-zinc-400">Flagged for expedited grouping</p>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${form.priority_flag ? "bg-amber-400" : "bg-zinc-200 dark:bg-zinc-700"}`}
              onClick={() => setField("priority_flag", !form.priority_flag)}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.priority_flag ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </div>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-black/[.06] dark:border-white/[.08] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-solid border-black/[.08] dark:border-white/[.12] text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 h-11 rounded-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}
