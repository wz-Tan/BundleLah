"use client";

import { useMemo, useState } from "react";
import type { CargoRequest, MonitoringRequirements } from "@/type";
import { LocationPicker, type LocationValue } from "./LocationPicker";
import { recommendCargoPrice, prioritySurchargeRm, haversineKm } from "@/lib/pricing";

const EMPTY_LOCATION: LocationValue = { address: "", lat: null, lng: null };

interface SensorCriterion {
  enabled: boolean;
  value: string;
}

interface MonitoringState {
  temperature: SensorCriterion;
  humidity: SensorCriterion;
  ethylene: SensorCriterion;
  motion: boolean;
}

type ThresholdSensor = "temperature" | "humidity" | "ethylene";

interface CargoRequestFormState {
  pickup: LocationValue;
  dropoff: LocationValue;
  weight_kg: string;
  volume_m3: string;
  budget_rm: string;
  pickup_window_start: string;
  pickup_window_end: string;
  priority_flag: boolean;
  monitoring: MonitoringState;
}

type CargoRequestTextField = Exclude<keyof CargoRequestFormState, "priority_flag" | "pickup" | "dropoff" | "budget_rm">;

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
  field: CargoRequestTextField;
  value: string;
  error?: string;
  type?: string;
  placeholder?: string;
  onChange: (field: CargoRequestTextField, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 ">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(field, e.target.value)}
        className={`h-10 rounded-lg border border-solid px-3 text-sm bg-zinc-50  text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 transition-colors ${
          error ? "border-red-400" : "border-black/[.08] "
        }`}
      />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

export function CreateCargoRequestModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (req: CargoRequest) => void;
}) {
  const [form, setForm] = useState<CargoRequestFormState>({
    pickup: EMPTY_LOCATION,
    dropoff: EMPTY_LOCATION,
    weight_kg: "",
    volume_m3: "",
    budget_rm: "",
    pickup_window_start: "",
    pickup_window_end: "",
    priority_flag: false,
    monitoring: {
      temperature: { enabled: false, value: "" },
      humidity: { enabled: false, value: "" },
      ethylene: { enabled: false, value: "" },
      motion: false,
    },
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CargoRequestFormState, string>>>({});
  // Validation messages for the monitoring threshold inputs.
  const [monitorErrors, setMonitorErrors] = useState<
    Partial<Record<ThresholdSensor, string>>
  >({});
  // Tracks whether the user has manually overridden the recommended price.
  const [priceEdited, setPriceEdited] = useState(false);

  const distanceKm = useMemo(() => {
    if (
      form.pickup.lat == null ||
      form.pickup.lng == null ||
      form.dropoff.lat == null ||
      form.dropoff.lng == null
    ) {
      return 0;
    }
    return haversineKm(
      { lat: form.pickup.lat, lng: form.pickup.lng },
      { lat: form.dropoff.lat, lng: form.dropoff.lng }
    );
  }, [form.pickup, form.dropoff]);

  const weightNum = Number(form.weight_kg) || 0;
  const recommendedPrice = useMemo(
    () =>
      recommendCargoPrice({
        weightKg: weightNum,
        distanceKm,
        priority: form.priority_flag,
      }),
    [weightNum, distanceKm, form.priority_flag]
  );
  const surcharge = useMemo(
    () => prioritySurchargeRm({ weightKg: weightNum, distanceKm }),
    [weightNum, distanceKm]
  );

  // Displayed price: the user's override if edited, otherwise the recommendation.
  const priceValue = priceEdited
    ? form.budget_rm
    : recommendedPrice > 0
      ? String(recommendedPrice)
      : "";

  // Monitoring sensor config (label + unit + input hints) for the UI.
  const THRESHOLD_SENSORS: {
    key: ThresholdSensor;
    label: string;
    unit: string;
    placeholder: string;
    allowNegative: boolean;
  }[] = [
    { key: "temperature", label: "Temperature", unit: "°C", placeholder: "e.g. 4", allowNegative: true },
    { key: "humidity", label: "Humidity", unit: "%", placeholder: "e.g. 70", allowNegative: false },
    { key: "ethylene", label: "Ethylene gas", unit: "ppm", placeholder: "e.g. 1.0", allowNegative: false },
  ];

  function setSensorEnabled(key: ThresholdSensor, enabled: boolean) {
    setForm((f) => ({
      ...f,
      monitoring: { ...f.monitoring, [key]: { ...f.monitoring[key], enabled } },
    }));
    if (!enabled) {
      setMonitorErrors((e) => {
        const c = { ...e };
        delete c[key];
        return c;
      });
    }
  }

  function setSensorValue(key: ThresholdSensor, value: string) {
    setForm((f) => ({
      ...f,
      monitoring: { ...f.monitoring, [key]: { ...f.monitoring[key], value } },
    }));
    setMonitorErrors((e) => {
      const c = { ...e };
      delete c[key];
      return c;
    });
  }

  function validateMonitoring(): Partial<Record<ThresholdSensor, string>> {
    const e: Partial<Record<ThresholdSensor, string>> = {};
    for (const { key, label, allowNegative } of THRESHOLD_SENSORS) {
      const sensor = form.monitoring[key];
      if (!sensor.enabled) continue;
      const num = Number(sensor.value);
      if (sensor.value.trim() === "" || isNaN(num)) {
        e[key] = `Enter a ${label.toLowerCase()} threshold.`;
      } else if (!allowNegative && num < 0) {
        e[key] = `${label} threshold can't be negative.`;
      }
    }
    return e;
  }

  function validate(): Partial<Record<keyof CargoRequestFormState, string>> {
    const e: Partial<Record<keyof CargoRequestFormState, string>> = {};
    if (form.pickup.lat == null || form.pickup.lng == null) e.pickup = "Select a pickup location on the map.";
    if (form.dropoff.lat == null || form.dropoff.lng == null) e.dropoff = "Select a dropoff location on the map.";
    if (!form.weight_kg || isNaN(Number(form.weight_kg)) || Number(form.weight_kg) <= 0)
      e.weight_kg = "Enter a valid weight.";
    if (!form.volume_m3 || isNaN(Number(form.volume_m3)) || Number(form.volume_m3) <= 0)
      e.volume_m3 = "Enter a valid volume.";
    if (!priceValue || isNaN(Number(priceValue)) || Number(priceValue) <= 0)
      e.budget_rm = "Enter a valid budget.";
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
    const me = validateMonitoring();
    if (Object.keys(e).length || Object.keys(me).length) {
      setErrors(e);
      setMonitorErrors(me);
      return;
    }

    const m = form.monitoring;
    const monitoring: MonitoringRequirements = {
      temperature_c: m.temperature.enabled ? Number(m.temperature.value) : null,
      humidity_pct: m.humidity.enabled ? Number(m.humidity.value) : null,
      ethylene_ppm: m.ethylene.enabled ? Number(m.ethylene.value) : null,
      motion: m.motion,
    };

    const req: CargoRequest = {
      id: Date.now(),
      company_id: 1,
      pickup_address: form.pickup.address,
      pickup_lat: form.pickup.lat!,
      pickup_lng: form.pickup.lng!,
      dropoff_address: form.dropoff.address,
      dropoff_lat: form.dropoff.lat!,
      dropoff_lng: form.dropoff.lng!,
      weight_kg: Number(form.weight_kg),
      volume_m3: Number(form.volume_m3),
      budget_rm: Number(priceValue),
      pickup_window_start: new Date(form.pickup_window_start).toISOString(),
      pickup_window_end:   new Date(form.pickup_window_end).toISOString(),
      status: "open",
      priority_flag: form.priority_flag,
      created_at: new Date().toISOString(),
      monitoring,
    };
    onSubmit(req);
  }

  function setField<K extends keyof CargoRequestFormState>(key: K, value: CargoRequestFormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(er => { const c = { ...er }; delete c[key]; return c; });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[.06]">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-0.5">
              Cargo Pooling
            </p>
            <h2 className="text-lg font-semibold text-zinc-900">
              Request a pool
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-500 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <LocationPicker
            label="Pickup Address"
            accent="amber"
            value={form.pickup}
            error={errors.pickup}
            onChange={(loc) => setField("pickup", loc)}
          />
          <LocationPicker
            label="Dropoff Address"
            accent="amber"
            value={form.dropoff}
            error={errors.dropoff}
            onChange={(loc) => setField("dropoff", loc)}
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

          <label className="flex items-center justify-between cursor-pointer rounded-lg border border-solid border-black/[.06] px-4 py-3 hover:bg-zinc-50 transition-colors">
            <div>
              <p className="text-sm font-medium text-zinc-800">Priority shipment</p>
              <p className="text-xs text-zinc-400">Flagged for expedited grouping</p>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${form.priority_flag ? "bg-amber-400" : "bg-zinc-200"}`}
              onClick={() => setField("priority_flag", !form.priority_flag)}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.priority_flag ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </div>
          </label>

          {/* Monitoring requirements */}
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Monitoring requirements
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Choose the conditions to monitor in transit, and set a threshold
                for each.
              </p>
            </div>

            {THRESHOLD_SENSORS.map(({ key, label, unit, placeholder }) => {
              const sensor = form.monitoring[key];
              return (
                <div
                  key={key}
                  className="rounded-lg border border-solid border-black/[.06] px-4 py-3"
                >
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-zinc-800">
                      {label}
                    </span>
                    <div
                      className={`relative w-10 h-5 rounded-full transition-colors ${sensor.enabled ? "bg-amber-400" : "bg-zinc-200"}`}
                      onClick={() => setSensorEnabled(key, !sensor.enabled)}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${sensor.enabled ? "translate-x-5" : "translate-x-0.5"}`}
                      />
                    </div>
                  </label>
                  {sensor.enabled && (
                    <div className="mt-3">
                      <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                        Threshold
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="number"
                          step="0.1"
                          value={sensor.value}
                          placeholder={placeholder}
                          onChange={(e) => setSensorValue(key, e.target.value)}
                          className={`h-9 w-full rounded-lg border border-solid pr-12 pl-3 text-sm bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-400 transition-colors ${
                            monitorErrors[key] ? "border-red-400" : "border-black/[.08]"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                          {unit}
                        </span>
                      </div>
                      {monitorErrors[key] && (
                        <p className="mt-1 text-[11px] text-red-500">
                          {monitorErrors[key]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Motion sensor — detection only, no threshold value. */}
            <label className="flex items-center justify-between cursor-pointer rounded-lg border border-solid border-black/[.06] px-4 py-3">
              <div>
                <span className="text-sm font-medium text-zinc-800">
                  Motion sensor
                </span>
                <p className="text-[11px] text-zinc-400">
                  Alert on movement / tampering
                </p>
              </div>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${form.monitoring.motion ? "bg-amber-400" : "bg-zinc-200"}`}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    monitoring: { ...f.monitoring, motion: !f.monitoring.motion },
                  }))
                }
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.monitoring.motion ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Budget (RM)
              </label>
              {priceEdited && recommendedPrice > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPriceEdited(false);
                    setForm((f) => ({ ...f, budget_rm: "" }));
                    setErrors((er) => { const c = { ...er }; delete c.budget_rm; return c; });
                  }}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-500"
                >
                  Use recommended
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">RM</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={priceValue}
                placeholder={recommendedPrice > 0 ? String(recommendedPrice) : "0.00"}
                onChange={(e) => {
                  setPriceEdited(true);
                  setForm((f) => ({ ...f, budget_rm: e.target.value }));
                  setErrors((er) => { const c = { ...er }; delete c.budget_rm; return c; });
                }}
                className={`h-10 w-full rounded-lg border border-solid pl-10 pr-3 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-amber-400 transition-colors ${
                  errors.budget_rm ? "border-red-400" : "border-black/[.08] dark:border-white/[.1]"
                }`}
              />
            </div>
            {errors.budget_rm && <p className="text-[11px] text-red-500">{errors.budget_rm}</p>}
            {recommendedPrice > 0 && (
              <p className="text-[11px] text-zinc-400">
                Recommended <span className="font-semibold text-zinc-500 dark:text-zinc-300">RM {recommendedPrice.toFixed(2)}</span>
                {distanceKm > 0 && <> · {distanceKm.toFixed(1)} km</>}
                {form.priority_flag && surcharge > 0 && (
                  <> · includes <span className="font-semibold text-amber-600">RM {surcharge.toFixed(2)}</span> priority surcharge</>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-black/[.06] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full border border-solid border-black/[.08] text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 h-11 rounded-full bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
          >
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}
