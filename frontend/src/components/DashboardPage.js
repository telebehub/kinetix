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
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
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
    const bakuTime = new Date(now.getTime() + (offset + now.getTimezoneOffset()) * 60000);
    setSelectedDate(bakuTime.toISOString().split("T")[0]);
    setSelectedTime(bakuTime.toTimeString().slice(0, 5));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/weather/baku`);
      setWeather(res.data);
    } catch (err) { console.error("Weather error:", err); }
    finally { setWeatherLoading(false); }
  }, []);

  const fetchModelStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/model/status`);
      setModelStatus(res.data);
    } catch (err) { console.error("Model status error:", err); }
  }, []);

  useEffect(() => {
    fetchWeather();
    fetchModelStatus();
    const wi = setInterval(fetchWeather, 300000);
    return () => clearInterval(wi);
  }, [fetchWeather, fetchModelStatus]);

  const getBakuTime = () => {
    const offset = 4 * 60;
    return new Date(currentTime.getTime() + (offset + currentTime.getTimezoneOffset()) * 60000);
  };

  const bakuTime = getBakuTime();
  const timeStr = bakuTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateStr = bakuTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const handlePredict = async () => {
    if (!selectedStation || !selectedDate || !selectedTime) return;
    setPredicting(true);
    setPrediction(null);
    try {
      const res = await axios.post(`${API}/model/predict`, { station: selectedStation, date: selectedDate, time: selectedTime });
      setPrediction(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Prediction failed");
    } finally { setPredicting(false); }
  };

  const crowdStyle = (level) => ({
    low: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
    medium: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", bar: "bg-amber-500" },
    high: { text: "text-red-600", bg: "bg-red-50", border: "border-red-200", bar: "bg-red-500" },
  }[level] || { text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", bar: "bg-slate-400" });

  return (
    <div data-testid="dashboard-page" className="absolute inset-0 bg-slate-50 flex flex-col page-enter">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0066FF] to-indigo-600 flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Dashboard</h1>
            <p className="text-[10px] text-slate-400">Kinetix Intelligence</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 pb-20 space-y-3">

        {/* Time & Weather */}
        <div className="grid grid-cols-5 gap-2">
          <div data-testid="live-clock-card" className="col-span-2 bg-white rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-1 mb-1.5">
              <Clock size={11} className="text-[#0066FF]" />
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Baku</span>
            </div>
            <p className="text-lg font-bold text-slate-800 font-mono-time leading-tight" data-testid="live-time">{timeStr}</p>
            <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-0.5">
              <Calendar size={8} />{dateStr}
            </p>
          </div>
          <div data-testid="weather-card" className="col-span-3 bg-white rounded-xl p-3 border border-slate-100">
            <div className="flex items-center gap-1 mb-1.5">
              <CloudSun size={11} className="text-amber-500" />
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Weather</span>
            </div>
            {weatherLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : weather ? (
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-800 font-mono-time leading-tight" data-testid="weather-temp">{weather.temperature}°C</p>
                  <p className="text-[9px] text-slate-400">{weather.description}</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-[8px] text-slate-400 flex items-center gap-0.5"><Wind size={8} />{weather.wind_speed}</span>
                  <span className="text-[8px] text-slate-400 flex items-center gap-0.5"><Droplets size={8} />{weather.humidity}%</span>
                </div>
              </div>
            ) : <p className="text-[10px] text-slate-400">Unavailable</p>}
          </div>
        </div>

        {/* Model Status - Built-in, no upload */}
        <div data-testid="model-status-card" className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#0066FF]" />
              <span className="text-[11px] font-bold text-slate-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI Engine</span>
            </div>
            <Badge data-testid="model-status-badge" className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" variant="outline">
              <CheckCircle size={9} className="mr-0.5" /> Active
            </Badge>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 ml-6">
            {modelStatus?.description || "Built-in XGBoost model for Baku Metro prediction"}
          </p>
        </div>

        {/* Prediction */}
        <div data-testid="prediction-input-card" className="bg-white rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 size={14} className="text-[#0066FF]" />
            <span className="text-[11px] font-bold text-slate-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Predict Crowding</span>
          </div>

          <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Station</label>
          <select
            data-testid="station-select"
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 text-[12px] text-slate-800 bg-white mb-2.5 outline-none focus:border-[#0066FF] transition-colors"
          >
            {(modelStatus?.available_stations || ["28 May", "Koroglu", "Icherisheher", "Sahil", "Elmler Akademiyasi", "Nariman Narimanov", "Nizami", "Ganjlik"]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Date</label>
              <input data-testid="date-input" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 text-[12px] text-slate-800 bg-white outline-none focus:border-[#0066FF] font-mono-time transition-colors" />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Time</label>
              <input data-testid="time-input" type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 text-[12px] text-slate-800 bg-white outline-none focus:border-[#0066FF] font-mono-time transition-colors" />
            </div>
          </div>

          <Button data-testid="predict-btn" onClick={handlePredict} disabled={predicting}
            className="w-full bg-[#0066FF] hover:bg-blue-700 text-white rounded-lg h-9 font-bold text-[12px] shadow-sm shadow-blue-200 transition-all">
            {predicting ? (
              <span className="flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" />Analyzing...</span>
            ) : (
              <span className="flex items-center gap-1.5"><Sparkles size={14} />Predict</span>
            )}
          </Button>
        </div>

        {/* Result */}
        {prediction && (() => {
          const cs = crowdStyle(prediction.comfort_level);
          return (
            <div data-testid="prediction-output-card" className={`rounded-xl p-3 border page-enter ${cs.bg} ${cs.border}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={13} className={cs.text} />
                  <span className="text-[11px] font-bold text-slate-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Result</span>
                </div>
                <Badge variant="outline" className="text-[8px] border-slate-300">Kinetix AI v1</Badge>
              </div>

              <div className="flex items-center gap-2 mb-2.5">
                <TrainFront size={15} className="text-red-500" />
                <div>
                  <p className="text-[12px] font-bold text-slate-800">{prediction.station}</p>
                  <p className="text-[9px] text-slate-500 font-mono-time">{prediction.date} {prediction.time}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <div className="bg-white/60 rounded-lg p-2.5">
                  <p className="text-[9px] text-slate-500">Passengers</p>
                  <p className="text-lg font-bold text-slate-800 font-mono-time leading-tight" data-testid="predicted-passengers">
                    {prediction.predicted_passengers.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/60 rounded-lg p-2.5">
                  <p className="text-[9px] text-slate-500">Occupancy</p>
                  <p className={`text-lg font-bold font-mono-time leading-tight ${cs.text}`} data-testid="occupancy-pct">
                    {prediction.occupancy_percentage}%
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <div className="h-1.5 rounded-full bg-white/40 overflow-hidden">
                  <div className={`h-full rounded-full ${cs.bar} transition-all duration-500`} style={{ width: `${Math.min(prediction.occupancy_percentage, 100)}%` }} />
                </div>
                <p className="text-[8px] text-slate-500 mt-0.5 text-right font-mono-time">
                  {prediction.predicted_passengers.toLocaleString()} / {prediction.station_capacity.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/50">
                <Users size={13} className={cs.text} />
                <p className={`text-[11px] font-semibold ${cs.text}`} data-testid="comfort-status">{prediction.comfort_status}</p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
