import { useState, useEffect, useCallback, useRef } from "react";
import {
  Brain, Upload, CloudSun, Clock, TrainFront, Calendar,
  Wind, Droplets, Thermometer, Users, ChevronRight,
  FileUp, CheckCircle, AlertTriangle, Loader2, Sparkles,
  TrendingUp, BarChart3, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WEATHER_ICONS = {
  "sun": CloudSun,
  "cloud-sun": CloudSun,
  "cloud": CloudSun,
  "cloud-fog": CloudSun,
  "cloud-drizzle": Droplets,
  "cloud-rain": Droplets,
  "cloud-rain-wind": Wind,
  "snowflake": CloudSun,
  "cloud-lightning": CloudSun,
};

export default function DashboardPage() {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [modelStatus, setModelStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [selectedStation, setSelectedStation] = useState("28 May");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize date/time defaults
  useEffect(() => {
    const now = new Date();
    const offset = 4 * 60; // Baku is UTC+4
    const bakuTime = new Date(now.getTime() + (offset + now.getTimezoneOffset()) * 60000);
    setSelectedDate(bakuTime.toISOString().split("T")[0]);
    setSelectedTime(bakuTime.toTimeString().slice(0, 5));
  }, []);

  // Live clock (Baku time)
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather
  const fetchWeather = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/weather/baku`);
      setWeather(res.data);
    } catch (err) {
      console.error("Weather fetch error:", err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Fetch model status
  const fetchModelStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/model/status`);
      setModelStatus(res.data);
    } catch (err) {
      console.error("Model status error:", err);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    fetchModelStatus();
    const weatherInterval = setInterval(fetchWeather, 300000); // 5 min
    return () => clearInterval(weatherInterval);
  }, [fetchWeather, fetchModelStatus]);

  // Baku time calculation
  const getBakuTime = () => {
    const offset = 4 * 60;
    return new Date(currentTime.getTime() + (offset + currentTime.getTimezoneOffset()) * 60000);
  };

  const bakuTime = getBakuTime();
  const timeString = bakuTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const dateString = bakuTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  // File upload
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["ipynb", "joblib", "json"].includes(ext)) {
      toast.error("Please upload .ipynb, .joblib, or .json files");
      return;
    }

    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API}/model/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(res.data);
      toast.success(res.data.message || "File uploaded successfully!");
      fetchModelStatus();
    } catch (err) {
      const detail = err.response?.data?.detail || "Upload failed";
      toast.error(detail);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Prediction
  const handlePredict = async () => {
    if (!selectedStation || !selectedDate || !selectedTime) {
      toast.error("Please fill all prediction fields");
      return;
    }

    setPredicting(true);
    setPrediction(null);

    try {
      const res = await axios.post(`${API}/model/predict`, {
        station: selectedStation,
        date: selectedDate,
        time: selectedTime,
      });
      setPrediction(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail || "Prediction failed";
      toast.error(detail);
    } finally {
      setPredicting(false);
    }
  };

  const getCrowdColor = (level) => {
    if (level === "low") return { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" };
    if (level === "medium") return { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", bar: "bg-amber-500" };
    return { text: "text-red-600", bg: "bg-red-50", border: "border-red-200", bar: "bg-red-500" };
  };

  return (
    <div data-testid="dashboard-page" className="absolute inset-0 bg-slate-50 flex flex-col page-enter">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              AI Dashboard
            </h1>
            <p className="text-xs text-slate-500">Kinetix Intelligence Center</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 pb-20 space-y-4">

        {/* Time & Weather Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Live Clock */}
          <div data-testid="live-clock-card" className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={14} className="text-[#0066FF]" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Baku Time</span>
            </div>
            <p className="text-2xl font-bold text-slate-800 font-mono-time" data-testid="live-time">
              {timeString}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              <Calendar size={10} className="inline mr-1" />
              {dateString}
            </p>
          </div>

          {/* Weather */}
          <div data-testid="weather-card" className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <CloudSun size={14} className="text-amber-500" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Weather</span>
            </div>
            {weatherLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : weather ? (
              <>
                <p className="text-2xl font-bold text-slate-800 font-mono-time" data-testid="weather-temp">
                  {weather.temperature}°C
                </p>
                <p className="text-[10px] text-slate-400 mt-1">{weather.description}</p>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                    <Wind size={8} />{weather.wind_speed} km/h
                  </span>
                  <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                    <Droplets size={8} />{weather.humidity}%
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">Unavailable</p>
            )}
          </div>
        </div>

        {/* Model Status */}
        <div data-testid="model-status-card" className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#0066FF]" />
              <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Model Status
              </h3>
            </div>
            <Badge
              data-testid="model-status-badge"
              className={`text-[10px] font-bold border ${
                modelStatus?.model_loaded
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
              variant="outline"
            >
              {modelStatus?.model_loaded ? (
                <span className="flex items-center gap-1"><CheckCircle size={10} /> Trained Model</span>
              ) : (
                <span className="flex items-center gap-1"><AlertTriangle size={10} /> Mock Mode</span>
              )}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mb-3">{modelStatus?.description}</p>

          {/* Upload Area */}
          <div
            data-testid="upload-area"
            className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-[#0066FF] hover:bg-blue-50/30 transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              data-testid="file-upload-input"
              type="file"
              accept=".ipynb,.joblib,.json"
              className="hidden"
              onChange={handleUpload}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={24} className="text-[#0066FF] animate-spin" />
                <p className="text-xs text-slate-500">Processing file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileUp size={18} className="text-[#0066FF]" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Upload Model File</p>
                <p className="text-[10px] text-slate-400">.ipynb, .joblib, or .json</p>
              </div>
            )}
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div data-testid="upload-result" className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-800">{uploadResult.message}</p>
              {uploadResult.has_xgboost !== undefined && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px]">
                    XGBoost: {uploadResult.has_xgboost ? "Yes" : "No"}
                  </Badge>
                  <Badge variant="outline" className="text-[9px]">
                    Cells: {uploadResult.code_cells || "N/A"}
                  </Badge>
                  <Badge variant="outline" className="text-[9px]">
                    Predictor: {uploadResult.has_predictor_class ? "Yes" : "No"}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prediction Input */}
        <div data-testid="prediction-input-card" className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={16} className="text-[#0066FF]" />
            <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Predict Crowding
            </h3>
          </div>

          {/* Station Select */}
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Station</label>
          <select
            data-testid="station-select"
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white mb-3 outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/20 transition-all"
          >
            {modelStatus?.available_stations?.map((s) => (
              <option key={s} value={s}>{s}</option>
            )) || (
              <>
                <option value="28 May">28 May</option>
                <option value="Koroglu">Koroglu</option>
                <option value="Icherisheher">Icherisheher</option>
                <option value="Sahil">Sahil</option>
                <option value="Elmler Akademiyasi">Elmler Akademiyasi</option>
                <option value="Nariman Narimanov">Nariman Narimanov</option>
                <option value="Nizami">Nizami</option>
                <option value="Ganjlik">Ganjlik</option>
              </>
            )}
          </select>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Date</label>
              <input
                data-testid="date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/20 font-mono-time transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Time</label>
              <input
                data-testid="time-input"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/20 font-mono-time transition-all"
              />
            </div>
          </div>

          <Button
            data-testid="predict-btn"
            onClick={handlePredict}
            disabled={predicting}
            className="w-full bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl h-11 font-bold text-sm shadow-md shadow-blue-200 transition-all"
          >
            {predicting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                Predict Crowding
              </span>
            )}
          </Button>
        </div>

        {/* Prediction Output */}
        {prediction && (
          <div data-testid="prediction-output-card" className={`rounded-2xl p-4 border page-enter ${getCrowdColor(prediction.comfort_level).bg} ${getCrowdColor(prediction.comfort_level).border}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className={getCrowdColor(prediction.comfort_level).text} />
                <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Prediction Result
                </h3>
              </div>
              <Badge variant="outline" className="text-[9px] border-slate-300">
                {prediction.model_type === "mock_simulation" ? "Mock AI" : "Trained Model"}
              </Badge>
            </div>

            {/* Station info */}
            <div className="flex items-center gap-2 mb-3">
              <TrainFront size={18} className="text-red-500" />
              <div>
                <p className="text-sm font-bold text-slate-800">{prediction.station}</p>
                <p className="text-[10px] text-slate-500 font-mono-time">
                  {prediction.date} at {prediction.time}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 mb-0.5">Predicted Passengers</p>
                <p className="text-xl font-bold text-slate-800 font-mono-time" data-testid="predicted-passengers">
                  {prediction.predicted_passengers.toLocaleString()}
                </p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-[10px] text-slate-500 mb-0.5">Occupancy</p>
                <p className={`text-xl font-bold font-mono-time ${getCrowdColor(prediction.comfort_level).text}`} data-testid="occupancy-pct">
                  {prediction.occupancy_percentage}%
                </p>
              </div>
            </div>

            {/* Crowding bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-500">Station Capacity</span>
                <span className="text-[10px] text-slate-500 font-mono-time">
                  {prediction.predicted_passengers.toLocaleString()} / {prediction.station_capacity.toLocaleString()}
                </span>
              </div>
              <div className="crowding-bar h-2">
                <div
                  className={`crowding-fill ${getCrowdColor(prediction.comfort_level).bar}`}
                  style={{ width: `${Math.min(prediction.occupancy_percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Comfort status */}
            <div className={`flex items-center gap-2 p-3 rounded-xl bg-white/60`}>
              <Users size={16} className={getCrowdColor(prediction.comfort_level).text} />
              <p className={`text-xs font-semibold ${getCrowdColor(prediction.comfort_level).text}`} data-testid="comfort-status">
                {prediction.comfort_status}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
