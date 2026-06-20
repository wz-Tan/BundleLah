"use client";

import { GOOGLE_MAPS_API_KEY, useGoogleMaps } from "@/lib/googleMaps";
import { DirectionsRenderer, GoogleMap } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";

const mapContainerStyle = {
  width: "100%",
  height: "220px",
};

// Default view centred on Kuching, Sarawak — the operating region.
const DEFAULT_CENTER = { lat: 1.5533, lng: 110.3592 };

export interface RoutePoint {
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}

interface DetourRouteMapProps {
  /** Trip origin (A). */
  origin: RoutePoint;
  /** Trip destination (B). */
  destination: RoutePoint;
  /**
   * Intermediate stops the truck detours through (e.g. cargo pickup and
   * dropoff). When omitted the map just shows the direct A → B route.
   */
  waypoints?: RoutePoint[];
}

type Place = google.maps.LatLngLiteral | string;

// Prefer precise coordinates; fall back to the address string for geocoding.
function toPlace(point: RoutePoint | undefined): Place | null {
  if (!point) return null;
  if (
    point.lat != null &&
    point.lng != null &&
    !(point.lat === 0 && point.lng === 0)
  ) {
    return { lat: point.lat, lng: point.lng };
  }
  if (point.address) return point.address;
  return null;
}

function routeStats(result: google.maps.DirectionsResult) {
  const legs = result.routes[0]?.legs ?? [];
  let meters = 0;
  let seconds = 0;
  for (const leg of legs) {
    meters += leg.distance?.value ?? 0;
    seconds += leg.duration?.value ?? 0;
  }
  return { meters, seconds };
}

function formatKm(meters: number) {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hours} h ${rem} min` : `${hours} h`;
}

export function DetourRouteMap({
  origin,
  destination,
  waypoints = [],
}: DetourRouteMapProps) {
  const { isLoaded } = useGoogleMaps();
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [baseMeters, setBaseMeters] = useState<number | null>(null);
  const [stats, setStats] = useState<{ meters: number; seconds: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const originPlace = useMemo(() => toPlace(origin), [origin]);
  const destinationPlace = useMemo(() => toPlace(destination), [destination]);
  const waypointPlaces = useMemo(
    () =>
      waypoints
        .map(toPlace)
        .filter((p): p is Place => p !== null)
        .map((location) => ({ location, stopover: true })),
    [waypoints]
  );

  // Identifies the current route. Used as the DirectionsRenderer key so a new
  // route remounts a fresh renderer instead of stacking markers from the
  // previous one (the library doesn't clear old markers on prop change).
  const routeKey = useMemo(
    () => JSON.stringify([originPlace, destinationPlace, waypointPlaces]),
    [originPlace, destinationPlace, waypointPlaces]
  );

  useEffect(() => {
    if (!isLoaded || typeof google === "undefined") return;
    if (!originPlace || !destinationPlace) {
      setError("Missing origin or destination.");
      return;
    }

    let cancelled = false;
    setError(null);
    setDirections(null);
    setStats(null);
    setBaseMeters(null);

    const service = new google.maps.DirectionsService();

    // Detour route: origin -> waypoints -> destination.
    service.route(
      {
        origin: originPlace,
        destination: destinationPlace,
        waypoints: waypointPlaces,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setStats(routeStats(result));
        } else {
          setError("Couldn't find a driving route for these points.");
        }
      }
    );

    // Baseline direct route (origin -> destination) to measure the detour cost.
    if (waypointPlaces.length > 0) {
      service.route(
        {
          origin: originPlace,
          destination: destinationPlace,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (cancelled) return;
          if (status === google.maps.DirectionsStatus.OK && result) {
            setBaseMeters(routeStats(result).meters);
          }
        }
      );
    }

    return () => {
      cancelled = true;
    };
  }, [isLoaded, originPlace, destinationPlace, waypointPlaces]);

  const detourMeters =
    stats && baseMeters != null ? Math.max(stats.meters - baseMeters, 0) : null;

  if (!isLoaded) {
    return (
      <div
        style={mapContainerStyle}
        className="flex items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-400"
      >
        {GOOGLE_MAPS_API_KEY
          ? "Loading map…"
          : "Map unavailable — missing API key"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-xl border border-black/[.06]">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={DEFAULT_CENTER}
          zoom={10}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {directions && (
            <DirectionsRenderer
              key={routeKey}
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
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 px-4 text-center text-xs text-zinc-500">
            {error}
          </div>
        )}
      </div>

      {stats && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600">
          <span>
            <span className="font-semibold text-zinc-800">
              {formatKm(stats.meters)}
            </span>{" "}
            total
          </span>
          <span>
            <span className="font-semibold text-zinc-800">
              {formatDuration(stats.seconds)}
            </span>{" "}
            drive
          </span>
          {detourMeters != null && (
            <span className="text-orange-600">
              +{formatKm(detourMeters)} detour
            </span>
          )}
        </div>
      )}
    </div>
  );
}
