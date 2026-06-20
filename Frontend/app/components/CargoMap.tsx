"use client";

import { GOOGLE_MAPS_API_KEY, useGoogleMaps } from "@/lib/googleMaps";
import { GoogleMap, Marker } from "@react-google-maps/api";

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
  id: string;
  orderId: string;
  lat: number;
  lng: number;
  label?: string;
}

const sampleMarkers: CargoMarker[] = [
  {
    id: "m-001",
    orderId: "ORD-1001",
    lat: 1.3521,
    lng: 103.8198,
    label: "Order #ORD-1001 — Pickup, Jurong East",
  },
  {
    id: "m-002",
    orderId: "ORD-1002",
    lat: 1.3036,
    lng: 103.8318,
    label: "Order #ORD-1002 — Dropoff, Tanjong Pagar",
  },
  {
    id: "m-003",
    orderId: "ORD-1003",
    lat: 1.3496,
    lng: 103.9568,
    label: "Order #ORD-1003 — Pickup, Tampines",
  },
  {
    id: "m-004",
    orderId: "ORD-1004",
    lat: 1.4382,
    lng: 103.7891,
    label: "Order #ORD-1004 — Dropoff, Woodlands",
  },
  {
    id: "m-005",
    orderId: "ORD-1005",
    lat: 1.3329,
    lng: 103.7436,
    label: "Order #ORD-1005 — Pickup, Jurong West",
  },
  {
    id: "m-006",
    orderId: "ORD-1006",
    lat: 1.3644,
    lng: 103.9915,
    label: "Order #ORD-1006 — Dropoff, Changi",
  },
  {
    id: "m-007",
    orderId: "ORD-1007",
    lat: 1.2966,
    lng: 103.852,
    label: "Order #ORD-1007 — In Transit, Marina Bay",
  },
  {
    id: "m-008",
    orderId: "ORD-1008",
    lat: 1.3151,
    lng: 103.7644,
    label: "Order #ORD-1008 — Pickup, Clementi",
  },
  {
    id: "m-009",
    orderId: "ORD-1009",
    lat: 1.3868,
    lng: 103.7479,
    label: "Order #ORD-1009 — Dropoff, Bukit Panjang",
  },
  {
    id: "m-010",
    orderId: "ORD-1010",
    lat: 1.3691,
    lng: 103.8454,
    label: "Order #ORD-1010 — Pickup, Bishan",
  },
];

interface CargoMapProps {
  center?: { lat: number; lng: number };
  markers?: CargoMarker[];
}

export function CargoMap({
  center = defaultCenter,
  markers = sampleMarkers,
}: CargoMapProps) {
  const { isLoaded } = useGoogleMaps();

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
          title={m.label}
        />
      ))}
    </GoogleMap>
  );
}
