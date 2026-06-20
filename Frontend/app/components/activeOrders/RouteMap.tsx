"use client";

import { GOOGLE_MAPS_API_KEY, useGoogleMaps } from "@/lib/googleMaps";
import { DirectionsRenderer, GoogleMap } from "@react-google-maps/api";
import { useEffect, useState } from "react";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

// Default view centred on Kuching, Sarawak — the operating region.
const DEFAULT_CENTER = { lat: 1.5533, lng: 110.3592 };

interface RouteMapProps {
  pickup: string;
  destination: string;
}

export function RouteMap({ pickup, destination }: RouteMapProps) {
  const { isLoaded } = useGoogleMaps();
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || typeof google === "undefined") return;
    if (!pickup || !destination) {
      setError("Missing pickup or destination.");
      return;
    }

    let cancelled = false;
    setError(null);
    setDirections(null);

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: pickup,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          setError("Couldn't find a driving route for this trip.");
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [isLoaded, pickup, destination]);

  if (!isLoaded) {
    return (
      <div
        style={mapContainerStyle}
        className="flex items-center justify-center bg-zinc-100 text-xs text-zinc-400"
      >
        {GOOGLE_MAPS_API_KEY
          ? "Loading map…"
          : "Map unavailable — missing API key"}
      </div>
    );
  }

  return (
    <div style={mapContainerStyle} className="relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={DEFAULT_CENTER}
        zoom={11}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: "#f97316",
                strokeWeight: 5,
              },
            }}
          />
        )}
      </GoogleMap>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs text-gray-500 px-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
