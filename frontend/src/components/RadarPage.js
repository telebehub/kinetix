import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Radio, TrendingUp, TrendingDown, Minus, RefreshCw, TrainFront, Bus } from "lucide-react";
import { BAKU_CENTER } from "@/data/bakuData";
import { useSettings } from "@/contexts/SettingsContext";
import { API } from "@/lib/api";
import axios from "axios";

function getCrowdingColor(c) { return c > 75 ? "#EF4444" : c > 45 ? "#F59E0B" : "#22C55E"; }
function TrendIcon({ trend }) {
  if (trend === "rising") return <TrendingUp size={12} className="text-red-400" />;
  if (trend === "falling") return <TrendingDown size={12} className="text-emerald-400" />;
  return <Minus size={12} className="text-slate-400" />;
}

export default function RadarPage() {
  const { t, isDark, tc } = useSettings();
  const [stations, setStations] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchRadar = useCallback(async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/radar/live`); setStations(r.data.stations || []); setUpdatedAt(r.data.updated_at); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRadar(); const i = setInterval(fetchRadar, 30000); return () => clearInterval(i); }, [fetchRadar]);

  const filtered = filter === "all" ? stations : stations.filter(s => s.type === filter);
  const avg = filtered.length ? Math.round(filtered.reduce((a, b) => a + b.crowding, 0) / filtered.length) : 0;

  return (
    <div data-testid="radar-page" className="absolute inset-0 bg-slate-900 flex flex-col">
      <div className="absolute inset-0 z-0">
        <MapContainer center={BAKU_CENTER} zoom={12} className="w-full h-full dark-map-tiles" zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {filtered.map((s) => (
            <CircleMarker key={s.id} center={[s.lat, s.lng]} radius={Math.max(8, s.crowding / 5)}
              pathOptions={{ color: getCrowdingColor(s.crowding), fillColor: getCrowdingColor(s.crowding), fillOpacity: 0.5, weight: 2 }}>
              <Popup><div className="text-center p-1"><p className="font-bold text-sm">{s.name}</p><p className="text-xs">{s.crowding}%</p></div></Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="relative z-10 p-4 pt-5">
        <div className="glass-card-dark rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center"><Radio size={16} className="text-blue-400" /></div>
              <div>
                <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("radar.title")}</h2>
                <p className="text-[10px] text-slate-400">{updatedAt ? `${t("radar.updated")} ${new Date(updatedAt).toLocaleTimeString()}` : t("common.loading")}</p>
              </div>
            </div>
            <button data-testid="refresh-radar" onClick={fetchRadar} disabled={loading} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <RefreshCw size={16} className={`text-slate-400 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 bg-white/5 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1">{t("radar.cityAvg")}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono-time" style={{ color: getCrowdingColor(avg) }}>{avg}%</span>
                <div className="crowding-bar flex-1"><div className="crowding-fill" style={{ width: `${avg}%`, background: getCrowdingColor(avg) }} /></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1">{t("radar.stations")}</p>
              <span className="text-2xl font-bold text-white font-mono-time">{filtered.length}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {[{ id: "all", label: t("radar.all") }, { id: "metro", label: t("radar.metro"), icon: TrainFront }, { id: "bus_stop", label: t("radar.bus"), icon: Bus }].map((f) => (
              <button key={f.id} data-testid={`radar-filter-${f.id}`} onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f.id ? "bg-blue-500 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
                {f.icon && <f.icon size={12} />}{f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar px-4 pb-20">
        <div className="space-y-2">
          {filtered.sort((a, b) => b.crowding - a.crowding).map((s) => (
            <div key={s.id} data-testid={`radar-station-${s.id}`} className="glass-card-dark rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${getCrowdingColor(s.crowding)}20` }}>
                {s.type === "metro" ? <TrainFront size={18} style={{ color: getCrowdingColor(s.crowding) }} /> : <Bus size={18} style={{ color: getCrowdingColor(s.crowding) }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono-time text-xs font-bold" style={{ color: getCrowdingColor(s.crowding) }}>{s.crowding}%</span>
                  <div className="crowding-bar flex-1"><div className="crowding-fill" style={{ width: `${s.crowding}%`, background: getCrowdingColor(s.crowding) }} /></div>
                  <TrendIcon trend={s.trend} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono-time text-xs text-slate-400">{s.passengers_now}</p>
                <p className="text-[10px] text-slate-600">{t("radar.pax")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
