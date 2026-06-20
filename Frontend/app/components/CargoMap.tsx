"use client";

import { GOOGLE_MAPS_API_KEY, useGoogleMaps } from "@/lib/googleMaps";
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { useState } from "react";

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

export interface CargoMarker {
  id: string;
  orderId: string;
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
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div
        style={mapContainerStyle}
        className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-400"
      >
        {GOOGLE_MAPS_API_KEY
          ? "Loading map…"
          : "Map unavailable — missing API key"}
      </div>
    );
  }

  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={11}>
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={{ lat: m.lat, lng: m.lng }}
          label={{
            text: m.orderId.replace("ORD-", ""),
            color: "#ffffff",
            fontSize: "10px",
            fontWeight: "bold",
          }}
          onClick={() => setActiveMarker(m.id)}
        >
          {activeMarker === m.id && (
            <InfoWindow onCloseClick={() => setActiveMarker(null)}>
              <div className="text-xs text-gray-800">
                <p className="font-semibold">{m.orderId}</p>
                <p>{m.label}</p>
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </GoogleMap>
  );
}
