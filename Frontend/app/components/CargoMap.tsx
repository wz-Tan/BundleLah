"use client";

import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps, GOOGLE_MAPS_API_KEY } from "@/lib/googleMaps";

// container style needs explicit height since flex-1 alone won't size the map
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// example center — swap for your cargo's current coords
const defaultCenter = {
  lat: 1.3521,
  lng: 103.8198,
};

interface CargoMarker {
  lat: number;
  lng: number;
  label?: string;
}

interface CargoMapProps {
  center?: { lat: number; lng: number };
  markers?: CargoMarker[];
}

export function CargoMap({
  center = defaultCenter,
  markers = [],
}: CargoMapProps) {
  const { isLoaded } = useGoogleMaps();

  if (!isLoaded) {
    return (
      <div
        style={mapContainerStyle}
        className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-400"
      >
        {GOOGLE_MAPS_API_KEY ? "Loading map…" : "Map unavailable — missing API key"}
      </div>
    );
  }

  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={6}>
      {markers.map((m, i) => (
        <Marker key={i} position={{ lat: m.lat, lng: m.lng }} title={m.label} />
      ))}
    </GoogleMap>
  );
}
