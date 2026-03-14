import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Bus, TrainFront, Sparkles, Navigation, X, Search } from "lucide-react";
import { LOCATIONS } from "@/data/bakuData";

const MODES = [
  { id: "bus", label: "Bus", icon: Bus },
  { id: "metro", label: "Metro", icon: TrainFront },
  { id: "mixed", label: "AI Mix", icon: Sparkles },
];

export default function FloatingSearchBar({
  origin, destination, mode, onModeChange,
  onSelectLocation, onFindRoute, onClear,
  loading, selectingFor, onSelectingForChange, hasRoutes,
}) {
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [showOriginDD, setShowOriginDD] = useState(false);
  const [showDestDD, setShowDestDD] = useState(false);
  const originRef = useRef(null);
  const destRef = useRef(null);

  useEffect(() => { if (origin) setOriginQuery(origin.name); else setOriginQuery(""); }, [origin]);
  useEffect(() => { if (destination) setDestQuery(destination.name); else setDestQuery(""); }, [destination]);

  const filter = useCallback((q) => {
    if (!q || q.length < 1) return [];
    const lower = q.toLowerCase();
    return LOCATIONS.filter(l => l.name.toLowerCase().includes(lower) || l.name_az.toLowerCase().includes(lower)).slice(0, 5);
  }, []);

  const originResults = filter(originQuery);
  const destResults = filter(destQuery);

  const selectOrigin = (loc) => {
    onSelectLocation(loc, "origin");
    setOriginQuery(loc.name);
    setShowOriginDD(false);
    if (!destination) setTimeout(() => destRef.current?.focus(), 100);
  };

  const selectDest = (loc) => {
    onSelectLocation(loc, "destination");
    setDestQuery(loc.name);
    setShowDestDD(false);
  };

  const canSearch = origin && destination && !loading;

  return (
    <div data-testid="floating-search-bar" className="absolute top-3 left-3 right-3 z-50">
      <div className="glass-card rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.08)] overflow-visible">
        {/* Compact inputs */}
        <div className="p-3 pb-2">
          {/* Origin row */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0066FF] ring-2 ring-blue-100" />
              <div className="w-px h-5 bg-slate-200" />
            </div>
            <div className="flex-1 relative">
              <input
                ref={originRef}
                data-testid="origin-input"
                type="text"
                placeholder="From where?"
                value={originQuery}
                onChange={(e) => { setOriginQuery(e.target.value); setShowOriginDD(true); }}
                onFocus={() => { setShowOriginDD(true); onSelectingForChange("origin"); }}
                onBlur={() => setTimeout(() => setShowOriginDD(false), 200)}
                className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 outline-none font-medium py-1"
              />
            </div>
            {origin && (
              <button data-testid="clear-origin" onClick={() => { setOriginQuery(""); onSelectLocation(null, "origin"); }} className="p-0.5 hover:bg-slate-100 rounded-md transition-colors">
                <X size={13} className="text-slate-400" />
              </button>
            )}
          </div>
          {/* Destination row */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500 ring-2 ring-red-100" />
            </div>
            <div className="flex-1">
              <input
                ref={destRef}
                data-testid="destination-input"
                type="text"
                placeholder="Where to?"
                value={destQuery}
                onChange={(e) => { setDestQuery(e.target.value); setShowDestDD(true); }}
                onFocus={() => { setShowDestDD(true); onSelectingForChange("destination"); }}
                onBlur={() => setTimeout(() => setShowDestDD(false), 200)}
                className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-slate-400 outline-none font-medium py-1"
              />
            </div>
            {destination && (
              <button data-testid="clear-destination" onClick={() => { setDestQuery(""); onSelectLocation(null, "destination"); }} className="p-0.5 hover:bg-slate-100 rounded-md transition-colors">
                <X size={13} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Mode pills + Search in a compact bar */}
        <div className="flex items-center gap-1.5 px-3 pb-2.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                data-testid={`mode-${m.id}`}
                onClick={() => onModeChange(m.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-150 ${
                  isActive
                    ? m.id === "bus" ? "bg-emerald-500 text-white"
                    : m.id === "metro" ? "bg-red-500 text-white"
                    : "bg-[#0066FF] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                <Icon size={12} />
                {m.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <button
            data-testid="find-route-btn"
            onClick={onFindRoute}
            disabled={!canSearch}
            className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 ${
              canSearch
                ? "bg-[#0066FF] text-white shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-95"
                : "bg-slate-100 text-slate-300 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={12} />
            )}
            Go
          </button>
        </div>
      </div>

      {/* Origin dropdown */}
      {showOriginDD && originResults.length > 0 && (
        <div className="mt-1 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          {originResults.map((loc) => (
            <button key={loc.id} data-testid={`origin-option-${loc.id}`}
              onMouseDown={(e) => { e.preventDefault(); selectOrigin(loc); }}
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <MapPin size={13} className={loc.type === "metro" ? "text-red-500" : loc.type === "bus_stop" ? "text-emerald-500" : "text-slate-400"} />
              <div>
                <p className="text-[12px] font-medium text-slate-800">{loc.name}</p>
                <p className="text-[9px] text-slate-400">{loc.name_az}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Dest dropdown */}
      {showDestDD && destResults.length > 0 && (
        <div className="mt-1 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          {destResults.map((loc) => (
            <button key={loc.id} data-testid={`dest-option-${loc.id}`}
              onMouseDown={(e) => { e.preventDefault(); selectDest(loc); }}
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <MapPin size={13} className={loc.type === "metro" ? "text-red-500" : loc.type === "bus_stop" ? "text-emerald-500" : "text-slate-400"} />
              <div>
                <p className="text-[12px] font-medium text-slate-800">{loc.name}</p>
                <p className="text-[9px] text-slate-400">{loc.name_az}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tap hint */}
      {selectingFor && !hasRoutes && (
        <div className="mt-2 text-center">
          <span className="text-[10px] text-slate-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
            {selectingFor === "origin" ? "Tap map or search for start" : "Now select destination"}
          </span>
        </div>
      )}
    </div>
  );
}
