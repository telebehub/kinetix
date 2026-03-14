import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Search, Bus, TrainFront, Sparkles, Navigation, X } from "lucide-react";
import { LOCATIONS } from "@/data/bakuData";

const MODES = [
  { id: "bus", label: "Bus", icon: Bus, color: "emerald" },
  { id: "metro", label: "Metro", icon: TrainFront, color: "red" },
  { id: "mixed", label: "AI Mix", icon: Sparkles, color: "blue" },
];

export default function FloatingSearchBar({
  origin,
  destination,
  mode,
  onModeChange,
  onSelectLocation,
  onFindRoute,
  onClear,
  loading,
  selectingFor,
  onSelectingForChange,
}) {
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const originRef = useRef(null);
  const destRef = useRef(null);

  useEffect(() => {
    if (origin) setOriginQuery(origin.name);
  }, [origin]);

  useEffect(() => {
    if (destination) setDestQuery(destination.name);
  }, [destination]);

  const filterLocations = useCallback((query) => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.name_az.toLowerCase().includes(q)
    ).slice(0, 5);
  }, []);

  const originResults = filterLocations(originQuery);
  const destResults = filterLocations(destQuery);

  const handleOriginSelect = (loc) => {
    onSelectLocation(loc, "origin");
    setOriginQuery(loc.name);
    setShowOriginDropdown(false);
  };

  const handleDestSelect = (loc) => {
    onSelectLocation(loc, "destination");
    setDestQuery(loc.name);
    setShowDestDropdown(false);
  };

  const canSearch = origin && destination && !loading;

  return (
    <div
      data-testid="floating-search-bar"
      className="absolute top-4 left-4 right-4 z-50"
    >
      {/* Search Card */}
      <div className="glass-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3">
        {/* Origin Input */}
        <div className="flex items-center gap-2 relative">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Navigation size={14} className="text-[#0066FF]" />
          </div>
          <div className="flex-1 relative">
            <input
              ref={originRef}
              data-testid="origin-input"
              type="text"
              placeholder="Current location..."
              value={originQuery}
              onChange={(e) => {
                setOriginQuery(e.target.value);
                setShowOriginDropdown(true);
              }}
              onFocus={() => {
                setShowOriginDropdown(true);
                onSelectingForChange("origin");
              }}
              onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none font-medium"
            />
          </div>
          {origin && (
            <button
              data-testid="clear-origin"
              onClick={() => {
                setOriginQuery("");
                onSelectLocation(null, "origin");
              }}
              className="p-1"
            >
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Origin Dropdown */}
        {showOriginDropdown && originResults.length > 0 && (
          <div className="absolute left-3 right-3 top-[52px] bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
            {originResults.map((loc) => (
              <button
                key={loc.id}
                data-testid={`origin-option-${loc.id}`}
                onClick={() => handleOriginSelect(loc)}
                className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <MapPin size={14} className={loc.type === "metro" ? "text-red-500" : loc.type === "bus_stop" ? "text-emerald-500" : "text-slate-400"} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{loc.name}</p>
                  <p className="text-[10px] text-slate-400">{loc.name_az}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="ml-10 border-t border-dashed border-slate-200 my-1.5" />

        {/* Destination Input */}
        <div className="flex items-center gap-2 relative">
          <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <MapPin size={14} className="text-red-500" />
          </div>
          <div className="flex-1 relative">
            <input
              ref={destRef}
              data-testid="destination-input"
              type="text"
              placeholder="Where to?"
              value={destQuery}
              onChange={(e) => {
                setDestQuery(e.target.value);
                setShowDestDropdown(true);
              }}
              onFocus={() => {
                setShowDestDropdown(true);
                onSelectingForChange("destination");
              }}
              onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none font-medium"
            />
          </div>
          {destination && (
            <button
              data-testid="clear-destination"
              onClick={() => {
                setDestQuery("");
                onSelectLocation(null, "destination");
              }}
              className="p-1"
            >
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Destination Dropdown */}
        {showDestDropdown && destResults.length > 0 && (
          <div className="absolute left-3 right-3 bottom-auto bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden" style={{ top: "108px" }}>
            {destResults.map((loc) => (
              <button
                key={loc.id}
                data-testid={`dest-option-${loc.id}`}
                onClick={() => handleDestSelect(loc)}
                className="w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <MapPin size={14} className={loc.type === "metro" ? "text-red-500" : loc.type === "bus_stop" ? "text-emerald-500" : "text-slate-400"} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{loc.name}</p>
                  <p className="text-[10px] text-slate-400">{loc.name_az}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transport Mode Pills */}
      <div className="flex gap-2 mt-3 justify-center">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              data-testid={`mode-${m.id}`}
              onClick={() => onModeChange(m.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm ${
                isActive
                  ? m.id === "bus"
                    ? "bg-emerald-500 text-white shadow-emerald-200"
                    : m.id === "metro"
                    ? "bg-red-500 text-white shadow-red-200"
                    : "bg-[#0066FF] text-white shadow-blue-200"
                  : "bg-white/90 backdrop-blur-sm text-slate-600 hover:bg-white"
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Icon size={14} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Find Route Button */}
      {origin && destination && (
        <button
          data-testid="find-route-btn"
          onClick={onFindRoute}
          disabled={!canSearch}
          className="w-full mt-3 py-3 bg-[#0066FF] hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-200 transition-all duration-200 active:scale-[0.98]"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            "Find Route"
          )}
        </button>
      )}

      {/* Map click hint */}
      {selectingFor && (
        <div className="mt-2 text-center">
          <span className="text-[11px] text-slate-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full">
            Tap map to select {selectingFor === "origin" ? "starting point" : "destination"}
          </span>
        </div>
      )}
    </div>
  );
}
