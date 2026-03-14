import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Radio, TrendingUp, TrendingDown, Minus, RefreshCw, TrainFront, Bus } from "lucide-react";
import { BAKU_CENTER } from "@/data/bakuData";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getCrowdingColor(crowding) {
  if (crowding > 75) return "#EF4444";
  if (crowding > 45) return "#F59E0B";
  return "#22C55E";
}

function TrendIcon({ trend }) {
  if (trend === "rising") return <TrendingUp size={12} className="text-red-400" />;
  if (trend === "falling") return <TrendingDown size={12} className="text-emerald-400" />;
  return <Minus size={12} className="text-slate-400" />;
}

export default function RadarPage() {
  const [stations, setStations] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, metro, bus_stop

  const fetchRadar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/radar/live`);
      setStations(res.data.stations || []);
      setUpdatedAt(res.data.updated_at);
    } catch (err) {
      console.error("Radar fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRadar();
    const interval = setInterval(fetchRadar, 30000);
    return () => clearInterval(interval);
  }, [fetchRadar]);

  const filteredStations = filter === "all"
    ? stations
    : stations.filter((s) => s.type === filter);

  const avgCrowding = filteredStations.length
    ? Math.round(filteredStations.reduce((a, b) => a + b.crowding, 0) / filteredStations.length)
    : 0;

  return (
    <div data-testid="radar-page" className="absolute inset-0 bg-slate-900 flex flex-col">
      {/* Dark Map Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={BAKU_CENTER}
          zoom={12}
          className="w-full h-full dark-map-tiles"
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap'
          />
          {filteredStations.map((station) => (
            <CircleMarker
              key={station.id}
              center={[station.lat, station.lng]}
              radius={Math.max(8, station.crowding / 5)}
              pathOptions={{
                color: getCrowdingColor(station.crowding),
                fillColor: getCrowdingColor(station.crowding),
                fillOpacity: 0.5,
                weight: 2,
              }}
            >
              <Popup className="radar-popup">
                <div className="text-center p-1">
                  <p className="font-bold text-sm">{station.name}</p>
                  <p className="text-xs text-slate-600">
                    Crowding: {station.crowding}%
                  </p>
                  <p className="text-xs text-slate-500">
                    {station.passengers_now}/{station.capacity} passengers
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Top Panel */}
      <div className="relative z-10 p-4 pt-5">
        <div className="glass-card-dark rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Radio size={16} className="text-blue-400" />
              </div>
              <div>
                <h2
                  className="text-base font-bold text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Live AI Radar
                </h2>
                <p className="text-[10px] text-slate-400">
                  {updatedAt
                    ? `Updated ${new Date(updatedAt).toLocaleTimeString()}`
                    : "Loading..."}
                </p>
              </div>
            </div>
            <button
              data-testid="refresh-radar"
              onClick={fetchRadar}
              disabled={loading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <RefreshCw
                size={16}
                className={`text-slate-400 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>

          {/* Average indicator */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 bg-white/5 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1">City Average</p>
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-bold font-mono-time"
                  style={{ color: getCrowdingColor(avgCrowding) }}
                >
                  {avgCrowding}%
                </span>
                <div className="crowding-bar flex-1">
                  <div
                    className="crowding-fill"
                    style={{
                      width: `${avgCrowding}%`,
                      background: getCrowdingColor(avgCrowding),
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1">Stations</p>
              <span className="text-2xl font-bold text-white font-mono-time">
                {filteredStations.length}
              </span>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2">
            {[
              { id: "all", label: "All" },
              { id: "metro", label: "Metro", icon: TrainFront },
              { id: "bus_stop", label: "Bus", icon: Bus },
            ].map((f) => (
              <button
                key={f.id}
                data-testid={`radar-filter-${f.id}`}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === f.id
                    ? "bg-blue-500 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {f.icon && <f.icon size={12} />}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Station List */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-4 pb-20">
        <div className="space-y-2">
          {filteredStations
            .sort((a, b) => b.crowding - a.crowding)
            .map((station) => (
              <div
                key={station.id}
                data-testid={`radar-station-${station.id}`}
                className="glass-card-dark rounded-xl p-3 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${getCrowdingColor(station.crowding)}20` }}
                >
                  {station.type === "metro" ? (
                    <TrainFront size={18} style={{ color: getCrowdingColor(station.crowding) }} />
                  ) : (
                    <Bus size={18} style={{ color: getCrowdingColor(station.crowding) }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{station.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="font-mono-time text-xs font-bold"
                      style={{ color: getCrowdingColor(station.crowding) }}
                    >
                      {station.crowding}%
                    </span>
                    <div className="crowding-bar flex-1">
                      <div
                        className="crowding-fill"
                        style={{
                          width: `${station.crowding}%`,
                          background: getCrowdingColor(station.crowding),
                        }}
                      />
                    </div>
                    <TrendIcon trend={station.trend} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-mono-time text-xs text-slate-400">
                    {station.passengers_now}
                  </p>
                  <p className="text-[10px] text-slate-600">pax</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
