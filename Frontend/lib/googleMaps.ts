"use client";

import { useJsApiLoader } from "@react-google-maps/api";

// IMPORTANT: every Google Maps consumer in the app must load the script with
// the SAME id and the SAME libraries array (by reference). The Maps JS API can
// only be loaded once per page, and `window.google` persists across client-side
// navigation in Next.js. If one screen loads without "places" and another later
// needs Autocomplete, it throws a runtime invariant. Keeping a single shared
// config avoids that.
export const GOOGLE_MAPS_LOADER_ID = "google-map-script";

export const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function useGoogleMaps() {
  return useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
}

export { GOOGLE_MAPS_API_KEY };
