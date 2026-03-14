import { useState, useEffect, useCallback } from "react";
import {
  Brain, CloudSun, Clock, TrainFront, Calendar,
  Wind, Droplets, Users, Loader2, Sparkles,
  TrendingUp, BarChart3, CheckCircle, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { t, isDark, tc } = useSettings();
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [modelStatus, setModelStatus] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [selectedStation, setSelectedStation] = useState("28 May");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    const now = new Date();
    const offset = 4 * 60;
    const baku = new Date(now.getTime() + (offset + now.getTimezoneOffset()) * 60000);
    setSelectedDate(baku.toISOString().split("T")[0]);
    setSelectedTime(baku.toTimeString().slice(0, 5));
  }, []);

  useEffect(() => {
    const i = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const fetchWeather = useCallback(async () => {
    try { const r = await axios.get(`${API}/weather/baku`); setWeather(r.data); }
    catch (e) { console.error(e); }
    finally { setWeatherLoading(false); }
  }, []);

  const fetchModelStatus = useCallback(async () => {
    try { const r = await axios.get(`${API}/model/status`); setModelStatus(r.data); }
    catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    fetchWeather(); fetchModelStatus();
    const wi = setInterval(fetchWeather, 300000);
    return () => clearInterval(wi);
  }, [fetchWeather, fetchModelStatus]);

  const getBakuTime = () => {
    const offset = 4 * 60;
    return new Date(currentTime.getTime() + (offset + currentTime.getTimezoneOffset()) * 60000);
  };
  const baku = getBakuTime();
  const timeStr = baku.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = baku.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const handlePredict = async () => {
    if (!selectedStation || !selectedDate || !selectedTime) return;
    setPredicting(true); setPrediction(null);
    try { const r = await axios.post(`${API}/model/predict`, { station: selectedStation, date: selectedDate, time: selectedTime }); setPrediction(r.data); }
    catch (e) { toast.error(e.response?.data?.detail || "Prediction failed"); }
    finally { setPredicting(false); }
  };

  const cs = (level) => ({
    low: { text: "text-emerald-500", bg: tc("bg-emerald-50 border-emerald-200", "bg-emerald-500/10 border-emerald-500/20"), bar: "bg-emerald-500" },
    medium: { text: "text-amber-500", bg: tc("bg-amber-50 border-amber-200", "bg-amber-500/10 border-amber-500/20"), bar: "bg-amber-500" },
    high: { text: "text-red-500", bg: tc("bg-red-50 border-red-200", "bg-red-500/10 border-red-500/20"), bar: "bg-red-500" },
  }[level] || { text: "text-slate-500", bg: "bg-slate-50", bar: "bg-slate-400" });

  const card = tc("bg-white border-slate-100", "bg-slate-800 border-slate-700");
  const text1 = tc("text-slate-800", "text-slate-100");
  const text3 = tc("text-slate-400", "text-slate-500");
  const inputCls = tc("border-slate-200 bg-white text-slate-800", "border-slate-600 bg-slate-700 text-slate-200");

  return (
    <div data-testid="dashboard-page" className={`absolute inset-0 ${tc("bg-slate-50", "bg-slate-900")} flex flex-col page-enter`}>
      <div className={`px-4 pt-5 pb-3 border-b ${tc("bg-white border-slate-100", "bg-slate-800/80 border-slate-700")}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066FF] to-indigo-600 flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h1 className={`text-base font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("dashboard.title")}</h1>
            <p className={`text-[10px] ${text3}`}>{t("dashboard.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 pb-20 space-y-3">
        {/* Time & Weather */}
        <div className="grid grid-cols-5 gap-2">
          <div data-testid="live-clock-card" className={`col-span-2 ${card} rounded-xl p-3 border`}>
            <div className="flex items-center gap-1 mb-1.5">
              <Clock size={11} className="text-[#0066FF]" />
              <span className={`text-[9px] font-semibold uppercase tracking-wider ${text3}`}>{t("dashboard.baku")}</span>
            </div>
            <p className={`text-lg font-bold font-mono-time leading-tight ${text1}`} data-testid="live-time">{timeStr}</p>
            <p className={`text-[9px] mt-0.5 flex items-center gap-0.5 ${text3}`}><Calendar size={8} />{dateStr}</p>
          </div>
          <div data-testid="weather-card" className={`col-span-3 ${card} rounded-xl p-3 border`}>
            <div className="flex items-center gap-1 mb-1.5">
              <CloudSun size={11} className="text-amber-500" />
              <span className={`text-[9px] font-semibold uppercase tracking-wider ${text3}`}>{t("dashboard.weather")}</span>
            </div>
            {weatherLoading ? <Skeleton className="h-6 w-16" /> : weather ? (
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-lg font-bold font-mono-time leading-tight ${text1}`} data-testid="weather-temp">{weather.temperature}°C</p>
                  <p className={`text-[9px] ${text3}`}>{weather.description}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-[8px] flex items-center gap-0.5 ${text3}`}><Wind size={8} />{weather.wind_speed}</span>
                  <span className={`text-[8px] flex items-center gap-0.5 ${text3}`}><Droplets size={8} />{weather.humidity}%</span>
                </div>
              </div>
            ) : <p className={`text-[10px] ${text3}`}>{t("dashboard.unavailable")}</p>}
          </div>
        </div>

        {/* Model Status */}
        <div data-testid="model-status-card" className={`${card} rounded-xl p-3 border`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#0066FF]" />
              <span className={`text-[11px] font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("dashboard.aiEngine")}</span>
            </div>
            <Badge data-testid="model-status-badge" className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" variant="outline">
              <CheckCircle size={9} className="mr-0.5" /> {t("dashboard.active")}
            </Badge>
          </div>
          <p className={`text-[10px] mt-1.5 ml-6 ${text3}`}>{modelStatus?.description || "Built-in XGBoost model"}</p>
        </div>

        {/* Prediction */}
        <div data-testid="prediction-input-card" className={`${card} rounded-xl p-3 border`}>
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 size={14} className="text-[#0066FF]" />
            <span className={`text-[11px] font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("dashboard.predictTitle")}</span>
          </div>

          <label className={`text-[9px] font-semibold uppercase tracking-wider block mb-1 ${text3}`}>{t("dashboard.station")}</label>
          <select data-testid="station-select" value={selectedStation} onChange={(e) => setSelectedStation(e.target.value)}
            className={`w-full p-2 rounded-lg border text-[12px] mb-2.5 outline-none focus:border-[#0066FF] transition-colors ${inputCls}`}>
            {(modelStatus?.available_stations || ["28 May","Koroglu","Icherisheher","Sahil","Elmler Akademiyasi","Nariman Narimanov","Nizami","Ganjlik"]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className={`text-[9px] font-semibold uppercase tracking-wider block mb-1 ${text3}`}>{t("dashboard.date")}</label>
              <input data-testid="date-input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full p-2 rounded-lg border text-[12px] outline-none focus:border-[#0066FF] font-mono-time transition-colors ${inputCls}`} />
            </div>
            <div>
              <label className={`text-[9px] font-semibold uppercase tracking-wider block mb-1 ${text3}`}>{t("dashboard.time")}</label>
              <input data-testid="time-input" type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}
                className={`w-full p-2 rounded-lg border text-[12px] outline-none focus:border-[#0066FF] font-mono-time transition-colors ${inputCls}`} />
            </div>
          </div>

          <Button data-testid="predict-btn" onClick={handlePredict} disabled={predicting}
            className="w-full bg-[#0066FF] hover:bg-blue-700 text-white rounded-lg h-9 font-bold text-[12px] shadow-sm shadow-blue-200 transition-all">
            {predicting ? <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" />{t("dashboard.analyzing")}</span>
              : <span className="flex items-center gap-1.5"><Sparkles size={14} />{t("dashboard.predict")}</span>}
          </Button>
        </div>

        {/* Result */}
        {prediction && (() => {
          const s = cs(prediction.comfort_level);
          const comfortKey = prediction.comfort_level === "low" ? "dashboard.comfortLow" : prediction.comfort_level === "medium" ? "dashboard.comfortMed" : "dashboard.comfortHigh";
          return (
            <div data-testid="prediction-output-card" className={`rounded-xl p-3 border page-enter ${s.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5"><TrendingUp size={13} className={s.text} /><span className={`text-[11px] font-bold ${text1}`}>{t("dashboard.result")}</span></div>
                <Badge variant="outline" className={`text-[8px] ${tc("border-slate-300","border-slate-600")}`}>Kinetix AI v1</Badge>
              </div>
              <div className="flex items-center gap-2 mb-2.5">
                <TrainFront size={15} className="text-red-500" />
                <div>
                  <p className={`text-[12px] font-bold ${text1}`}>{prediction.station}</p>
                  <p className={`text-[9px] font-mono-time ${text3}`}>{prediction.date} {prediction.time}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className={`${tc("bg-white/60","bg-slate-800/40")} rounded-lg p-2.5`}>
                  <p className={`text-[9px] ${text3}`}>{t("dashboard.passengers")}</p>
                  <p className={`text-lg font-bold font-mono-time leading-tight ${text1}`} data-testid="predicted-passengers">{prediction.predicted_passengers.toLocaleString()}</p>
                </div>
                <div className={`${tc("bg-white/60","bg-slate-800/40")} rounded-lg p-2.5`}>
                  <p className={`text-[9px] ${text3}`}>{t("dashboard.occupancy")}</p>
                  <p className={`text-lg font-bold font-mono-time leading-tight ${s.text}`} data-testid="occupancy-pct">{prediction.occupancy_percentage}%</p>
                </div>
              </div>
              <div className="mb-2">
                <div className={`h-1.5 rounded-full overflow-hidden ${tc("bg-white/40","bg-slate-700")}`}>
                  <div className={`h-full rounded-full ${s.bar} transition-all duration-500`} style={{ width: `${Math.min(prediction.occupancy_percentage, 100)}%` }} />
                </div>
              </div>
              <div className={`flex items-center gap-1.5 p-2 rounded-lg ${tc("bg-white/50","bg-slate-800/40")}`}>
                <Users size={13} className={s.text} />
                <p className={`text-[11px] font-semibold ${s.text}`} data-testid="comfort-status">{t(comfortKey)}</p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
