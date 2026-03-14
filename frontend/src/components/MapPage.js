import { useState, useCallback, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { BAKU_CENTER, LOCATIONS } from "@/data/bakuData";
import FloatingSearchBar from "@/components/FloatingSearchBar";
import BottomSheet from "@/components/BottomSheet";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Custom marker icons
const originIcon = L.divIcon({
  className: "",
  html: '<div class="marker-pulse"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const destinationIcon = L.divIcon({
  className: "",
  html: '<div class="marker-destination"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
}

export default function MapPage() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [mode, setMode] = useState("mixed");
  const [routes, setRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectingFor, setSelectingFor] = useState(null); // "origin" or "destination"
  const mapRef = useRef(null);

  const findNearestLocation = useCallback((latlng) => {
    let nearest = null;
    let minDist = Infinity;
    LOCATIONS.forEach((loc) => {
      const dist = Math.sqrt(
        Math.pow(loc.lat - latlng.lat, 2) + Math.pow(loc.lng - latlng.lng, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = loc;
      }
    });
    return nearest;
  }, []);

  const handleMapClick = useCallback(
    (latlng) => {
      const nearest = findNearestLocation(latlng);
      if (!nearest) return;

      if (!origin || selectingFor === "origin") {
        setOrigin(nearest);
        setSelectingFor("destination");
      } else if (!destination || selectingFor === "destination") {
        setDestination(nearest);
        setSelectingFor(null);
      }
    },
    [origin, destination, selectingFor, findNearestLocation]
  );

  const handleFindRoute = useCallback(async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setRoutes(null);
    setSelectedRoute(null);

    try {
      const res = await axios.post(`${API}/routes/find`, {
        origin_id: origin.id,
        destination_id: destination.id,
        mode,
      });
      setRoutes(res.data);
      // Auto-select the recommended route
      const recommended = res.data.options?.find((o) => o.is_recommended);
      if (recommended) setSelectedRoute(recommended);
    } catch (err) {
      console.error("Route find error:", err);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, mode]);

  const handleSelectLocation = useCallback((location, field) => {
    if (field === "origin") {
      setOrigin(location);
    } else {
      setDestination(location);
    }
  }, []);

  const handleClear = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setRoutes(null);
    setSelectedRoute(null);
    setSelectingFor(null);
  }, []);

  const displayPolyline = selectedRoute?.polyline || null;
  const bounds =
    origin && destination
      ? [
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ]
      : null;

  return (
    <div data-testid="map-page" className="absolute inset-0">
      {/* Leaflet Map */}
      <MapContainer
        center={BAKU_CENTER}
        zoom={13}
        className="absolute inset-0 z-0"
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapClickHandler onMapClick={handleMapClick} />

        {bounds && <FitBounds bounds={bounds} />}

        {origin && (
          <Marker
            position={[origin.lat, origin.lng]}
            icon={originIcon}
          />
        )}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
          />
        )}

        {displayPolyline && (
          <>
            {/* Shadow line */}
            <Polyline
              positions={displayPolyline}
              pathOptions={{
                color: "#0066FF",
                weight: 8,
                opacity: 0.2,
              }}
            />
            {/* Main line */}
            <Polyline
              positions={displayPolyline}
              pathOptions={{
                color: selectedRoute?.is_recommended ? "#0066FF" : "#64748B",
                weight: 5,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}
      </MapContainer>

      {/* UI Overlay */}
      <div className="relative z-10 pointer-events-none h-full flex flex-col">
        <div className="pointer-events-auto">
          <FloatingSearchBar
            origin={origin}
            destination={destination}
            mode={mode}
            onModeChange={setMode}
            onSelectLocation={handleSelectLocation}
            onFindRoute={handleFindRoute}
            onClear={handleClear}
            loading={loading}
            selectingFor={selectingFor}
            onSelectingForChange={setSelectingFor}
          />
        </div>

        <div className="flex-1" />

        <div className="pointer-events-auto">
          <BottomSheet
            routes={routes}
            loading={loading}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
            origin={origin}
            destination={destination}
          />
        </div>
      </div>
    </div>
  );
}
