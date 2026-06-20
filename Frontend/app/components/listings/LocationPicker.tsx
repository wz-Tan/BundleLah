"use client";

import { Autocomplete, GoogleMap, Marker } from "@react-google-maps/api";
import { useCallback, useRef, useState } from "react";
import { useGoogleMaps, GOOGLE_MAPS_API_KEY } from "@/lib/googleMaps";

// container style needs explicit height since flex-1 alone won't size the map
const mapContainerStyle = {
  width: "100%",
  height: "220px",
};

// Default view centred on Kuching, Sarawak — the operating region.
const DEFAULT_CENTER = { lat: 1.5533, lng: 110.3592 };

export interface LocationValue {
  address: string;
  lat: number | null;
  lng: number | null;
}

interface LocationPickerProps {
  label: string;
  value: LocationValue;
  error?: string;
  /** Tailwind accent color class fragment, e.g. "amber" or "emerald". */
  accent?: "amber" | "emerald";
  onChange: (value: LocationValue) => void;
}

const ACCENTS = {
  amber: { focus: "focus:border-amber-400", marker: "#f59e0b" },
  emerald: { focus: "focus:border-emerald-500", marker: "#059669" },
};

export function LocationPicker({
  label,
  value,
  error,
  accent = "amber",
  onChange,
}: LocationPickerProps) {
  const { isLoaded } = useGoogleMaps();

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const accentCls = ACCENTS[accent];
  const hasPoint = value.lat != null && value.lng != null;

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!geocoderRef.current && typeof google !== "undefined") {
        geocoderRef.current = new google.maps.Geocoder();
      }
      const geocoder = geocoderRef.current;
      if (!geocoder) {
        onChange({ address: value.address, lat, lng });
        return;
      }
      setGeocoding(true);
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        setGeocoding(false);
        if (status === "OK" && results && results[0]) {
          onChange({ address: results[0].formatted_address, lat, lng });
        } else {
          onChange({ address: value.address, lat, lng });
        }
      });
    },
    [onChange, value.address]
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      reverseGeocode(e.latLng.lat(), e.latLng.lng());
    },
    [reverseGeocode]
  );

  const handlePlaceChanged = useCallback(() => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    const loc = place.geometry?.location;
    if (!loc) return;
    onChange({
      address: place.formatted_address || place.name || value.address,
      lat: loc.lat(),
      lng: loc.lng(),
    });
  }, [onChange, value.address]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {label}
      </label>

      <div
        className={`relative overflow-hidden rounded-lg border border-solid ${
          error ? "border-red-400" : "border-black/[.08] dark:border-white/[.1]"
        }`}
      >
        {isLoaded ? (
          <>
            <Autocomplete
              onLoad={(ac) => {
                autocompleteRef.current = ac;
              }}
              onPlaceChanged={handlePlaceChanged}
              fields={["formatted_address", "geometry", "name"]}
            >
              <input
                type="text"
                placeholder="Search for a place or address…"
                className={`absolute left-2 right-2 top-2 z-10 h-9 rounded-lg border border-solid border-black/[.12] dark:border-white/[.15] bg-white/95 dark:bg-zinc-900/95 px-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm outline-none transition-colors ${accentCls.focus}`}
                onKeyDown={(e) => {
                  // Prevent Enter from submitting the surrounding form.
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
            </Autocomplete>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={hasPoint ? { lat: value.lat!, lng: value.lng! } : DEFAULT_CENTER}
              zoom={hasPoint ? 14 : 12}
              onClick={handleMapClick}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {hasPoint && (
                <Marker
                  position={{ lat: value.lat!, lng: value.lng! }}
                  draggable
                  onDragEnd={(e) => {
                    if (e.latLng) reverseGeocode(e.latLng.lat(), e.latLng.lng());
                  }}
                />
              )}
            </GoogleMap>
          </>
        ) : (
          <div
            style={mapContainerStyle}
            className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-400"
          >
            {GOOGLE_MAPS_API_KEY ? "Loading map…" : "Map unavailable — missing API key"}
          </div>
        )}

        {!hasPoint && isLoaded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
            <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white">
              Search above or tap the map to set {label.toLowerCase()}
            </span>
          </div>
        )}
      </div>

      <input
        type="text"
        readOnly
        value={geocoding ? "Locating…" : value.address}
        placeholder="Tap the map to choose a location"
        className={`h-10 rounded-lg border border-solid px-3 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none transition-colors ${accentCls.focus} ${
          error ? "border-red-400" : "border-black/[.08] dark:border-white/[.1]"
        }`}
      />

      {hasPoint && (
        <p className="text-[11px] text-zinc-400 tabular-nums">
          {value.lat!.toFixed(5)}, {value.lng!.toFixed(5)}
        </p>
      )}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
