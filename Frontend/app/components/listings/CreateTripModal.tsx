"use client";

import { useState } from "react";
import type { TripListing } from "@/type";
import { LocationPicker, type LocationValue } from "./LocationPicker";
import { recommendTripPricePerKg } from "@/lib/pricing";

const EMPTY_LOCATION: LocationValue = { address: "", lat: null, lng: null };

interface CreateTripFormState {
  origin: LocationValue;
  destination: LocationValue;
  departure_window_start: string;
  available_weight_kg: string;
  available_volume_m3: string;
  price_per_kg_rm: string;
}

type CreateTripTextField = Exclude<keyof CreateTripFormState, "origin" | "destination">;

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
  field: CreateTripTextField;
  value: string;
  error?: string;
  type?: string;
  placeholder?: string;
  onChange: (field: CreateTripTextField, value: string) => void;
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
        className={`h-10 rounded-lg border border-solid px-3 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-colors ${
          error ? "border-red-400" : "border-black/[.08] dark:border-white/[.1]"
        }`}
      />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

export function CreateTripModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (trip: TripListing) => void;
}) {
  const [form, setForm] = useState<CreateTripFormState>({
    origin: EMPTY_LOCATION,
    destination: EMPTY_LOCATION,
    departure_window_start: "",
    available_weight_kg: "",
    available_volume_m3: "",
    price_per_kg_rm: String(recommendTripPricePerKg()),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTripFormState, string>>>({});

  function validate(): Partial<Record<keyof CreateTripFormState, string>> {
    const e: Partial<Record<keyof CreateTripFormState, string>> = {};
    if (form.origin.lat == null || form.origin.lng == null) e.origin = "Select an origin on the map.";
    if (form.destination.lat == null || form.destination.lng == null) e.destination = "Select a destination on the map.";
    if (!form.departure_window_start) e.departure_window_start = "Departure time is required.";
    if (!form.price_per_kg_rm || isNaN(Number(form.price_per_kg_rm)) || Number(form.price_per_kg_rm) <= 0)
      e.price_per_kg_rm = "Enter a valid price per kg.";
    if (!form.available_weight_kg || isNaN(Number(form.available_weight_kg)) || Number(form.available_weight_kg) <= 0)
      e.available_weight_kg = "Enter a valid weight.";
    if (!form.available_volume_m3 || isNaN(Number(form.available_volume_m3)) || Number(form.available_volume_m3) <= 0)
      e.available_volume_m3 = "Enter a valid volume.";
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const trip: TripListing = {
      id: Date.now(),
      company_id: 1,
      vehicle_id: null,
      origin_region: form.origin.address,
      destination_region: form.destination.address,
      route_json: {
        origin: { lat: form.origin.lat, lng: form.origin.lng },
        destination: { lat: form.destination.lat, lng: form.destination.lng },
      },
      departure_window_start: new Date(form.departure_window_start).toISOString(),
      available_weight_kg: Number(form.available_weight_kg),
      available_volume_m3: Number(form.available_volume_m3),
      price_per_kg_rm: Number(form.price_per_kg_rm),
      status: "open",
      created_at: new Date().toISOString(),
    };
    onSubmit(trip);
  }

  function setField<K extends keyof CreateTripFormState>(key: K, value: CreateTripFormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(er => { const c = { ...er }; delete c[key]; return c; });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[.06] dark:border-white/[.08]">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-0.5">
              New Trip
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              List a Trip
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
          <LocationPicker
            label="Origin Region"
            accent="emerald"
            value={form.origin}
            error={errors.origin}
            onChange={(loc) => setField("origin", loc)}
          />
          <LocationPicker
            label="Destination Region"
            accent="emerald"
            value={form.destination}
            error={errors.destination}
            onChange={(loc) => setField("destination", loc)}
          />
          <TextField
            label="Departure Window — Start"
            field="departure_window_start"
            value={form.departure_window_start}
            error={errors.departure_window_start}
            type="datetime-local"
            onChange={setField}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Available Weight (kg)"
              field="available_weight_kg"
              value={form.available_weight_kg}
              error={errors.available_weight_kg}
              type="number"
              onChange={setField}
              placeholder="420"
            />
            <TextField
              label="Available Volume (m³)"
              field="available_volume_m3"
              value={form.available_volume_m3}
              error={errors.available_volume_m3}
              type="number"
              onChange={setField}
              placeholder="5.4"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Price per kg (RM)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">RM</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price_per_kg_rm}
                onChange={(e) => setField("price_per_kg_rm", e.target.value)}
                className={`h-10 w-full rounded-lg border border-solid pl-10 pr-3 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 transition-colors ${
                  errors.price_per_kg_rm ? "border-red-400" : "border-black/[.08] dark:border-white/[.1]"
                }`}
              />
            </div>
            {errors.price_per_kg_rm && <p className="text-[11px] text-red-500">{errors.price_per_kg_rm}</p>}
            <p className="text-[11px] text-zinc-400">
              Recommended <span className="font-semibold text-zinc-500 dark:text-zinc-300">RM {recommendTripPricePerKg().toFixed(2)}</span> per kg
            </p>
          </div>
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
            className="flex-1 h-11 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
          >
            List Trip
          </button>
        </div>
      </div>
    </div>
  );
}
