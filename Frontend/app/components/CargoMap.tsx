import { GoogleMap, LoadScript, LoadScriptNext, Marker } from "@react-google-maps/api";

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
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export function CargoMap({
  center = defaultCenter,
  markers = [],
}: CargoMapProps) {
  return (
    <LoadScriptNext googleMapsApiKey={GOOGLE_MAPS_API_KEY || ""}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={6}>
        {markers.map((m, i) => (
          <Marker
            key={i}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.label}
          />
        ))}
      </GoogleMap>
    </LoadScriptNext>
  );
}
