import { useState, useCallback, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { BAKU_CENTER, LOCATIONS } from "@/data/bakuData";
import FloatingSearchBar from "@/components/FloatingSearchBar";
import BottomSheet from "@/components/BottomSheet";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 14, duration: 0.5 });
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
  const [selectingFor, setSelectingFor] = useState("origin");

  const findNearestLocation = useCallback((latlng) => {
    let nearest = null;
    let minDist = Infinity;
    LOCATIONS.forEach((loc) => {
      const dist = Math.sqrt(Math.pow(loc.lat - latlng.lat, 2) + Math.pow(loc.lng - latlng.lng, 2));
      if (dist < minDist) { minDist = dist; nearest = loc; }
    });
    return minDist < 0.02 ? nearest : null;
  }, []);

  const handleMapClick = useCallback((latlng) => {
    const nearest = findNearestLocation(latlng);
    if (!nearest) return;
    if (selectingFor === "origin") {
      setOrigin(nearest);
      if (!destination) setSelectingFor("destination");
    } else {
      setDestination(nearest);
      setSelectingFor(null);
    }
  }, [selectingFor, destination, findNearestLocation]);

  const handleFindRoute = useCallback(async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setRoutes(null);
    setSelectedRoute(null);
    try {
      const res = await axios.post(`${API}/routes/find`, {
        origin_id: origin.id, destination_id: destination.id, mode,
      });
      setRoutes(res.data);
      const rec = res.data.options?.find((o) => o.is_recommended);
      if (rec) setSelectedRoute(rec);
    } catch (err) {
      console.error("Route error:", err);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, mode]);

  const handleSelectLocation = useCallback((location, field) => {
    if (field === "origin") {
      setOrigin(location);
      if (location && !destination) setSelectingFor("destination");
    } else {
      setDestination(location);
      if (location) setSelectingFor(null);
    }
  }, [destination]);

  const handleClear = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setRoutes(null);
    setSelectedRoute(null);
    setSelectingFor("origin");
  }, []);

  const bounds = origin && destination ? [[origin.lat, origin.lng], [destination.lat, destination.lng]] : null;

  // Render all segments with correct colors
  const renderRouteLines = () => {
    if (!selectedRoute) return null;
    return selectedRoute.segments.map((seg, i) => (
      <Polyline
        key={i}
        positions={seg.coordinates}
        pathOptions={{
          color: seg.type === "metro" ? "#EF4444" : "#10B981",
          weight: 5,
          opacity: 0.85,
          lineCap: "round",
          lineJoin: "round",
          dashArray: seg.type === "bus" ? "8 6" : undefined,
        }}
      />
    ));
  };

  return (
    <div data-testid="map-page" className="absolute inset-0">
      <MapContainer
        center={BAKU_CENTER}
        zoom={13}
        className="absolute inset-0 z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {bounds && <FitBounds bounds={bounds} />}
        {origin && <Marker position={[origin.lat, origin.lng]} icon={originIcon} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />}

        {/* Route shadow */}
        {selectedRoute && (
          <Polyline
            positions={selectedRoute.polyline}
            pathOptions={{ color: "#0066FF", weight: 10, opacity: 0.12 }}
          />
        )}
        {renderRouteLines()}
      </MapContainer>

      {/* UI Layer */}
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
            hasRoutes={!!routes}
          />
        </div>
        <div className="flex-1" />
        <div className="pointer-events-auto">
          <BottomSheet
            routes={routes}
            loading={loading}
            selectedRoute={selectedRoute}
            onSelectRoute={setSelectedRoute}
          />
        </div>
      </div>
    </div>
  );
}
