"use client";

import { GOOGLE_MAPS_API_KEY, useGoogleMaps } from "@/lib/googleMaps";
import { GoogleMap, InfoWindow, Marker } from "@react-google-maps/api";
import { useCallback, useState } from "react";

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

// Bounding box covering the whole of Malaysia (Peninsular + Sabah & Sarawak).
const MALAYSIA_BOUNDS = {
  south: 0.85,
  west: 99.6,
  north: 7.4,
  east: 119.3,
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
  /** When true, the map zooms to show all of Malaysia on load. */
  fitToMalaysia?: boolean;
}

export function CargoMap({
  center = defaultCenter,
  markers = [],
  fitToMalaysia = false,
}: CargoMapProps) {
  const { isLoaded } = useGoogleMaps();
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  // On load, frame the entire country so the dashboard opens on all of Malaysia.
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (!fitToMalaysia) return;
      map.fitBounds(
        {
          south: MALAYSIA_BOUNDS.south,
          west: MALAYSIA_BOUNDS.west,
          north: MALAYSIA_BOUNDS.north,
          east: MALAYSIA_BOUNDS.east,
        },
        0
      );
    },
    [fitToMalaysia]
  );

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
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={fitToMalaysia ? 6 : 11}
      onLoad={onLoad}
    >
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
