import { TrainFront, Bus, Sparkles, Clock, Users, ChevronRight } from "lucide-react";

export default function RouteCard({ option, isSelected, onSelect }) {
  const isRecommended = option.is_recommended;
  const crowdColor =
    option.crowding_percent > 80
      ? "text-red-500"
      : option.crowding_percent > 50
      ? "text-amber-500"
      : "text-emerald-500";
  const crowdBg =
    option.crowding_percent > 80
      ? "bg-red-50 border-red-100"
      : option.crowding_percent > 50
      ? "bg-amber-50 border-amber-100"
      : "bg-emerald-50 border-emerald-100";
  const crowdBarColor =
    option.crowding_percent > 80
      ? "bg-red-500"
      : option.crowding_percent > 50
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <button
      data-testid={`route-card-${isRecommended ? "smart" : "standard"}`}
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
        isRecommended
          ? "route-recommended bg-white border-transparent"
          : isSelected
          ? "bg-white border-blue-200 shadow-sm"
          : "bg-white border-slate-100 hover:border-slate-200"
      } ${isSelected ? "ring-2 ring-[#0066FF]/20" : ""}`}
    >
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isRecommended ? (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
              {option.segments?.[0]?.type === "metro" ? (
                <TrainFront size={14} className="text-red-500" />
              ) : (
                <Bus size={14} className="text-emerald-500" />
              )}
            </div>
          )}
          <div>
            <span
              className="text-sm font-bold text-slate-800"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {option.label}
            </span>
            {isRecommended && (
              <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                RECOMMENDED
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-slate-300" />
      </div>

      {/* Segments */}
      <div className="flex items-center gap-1.5 mb-2 ml-9">
        {option.segments?.map((seg, i) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-300 text-xs">+</span>}
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                seg.type === "metro"
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {seg.line}
            </span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 ml-9">
        <div className="flex items-center gap-1">
          <Clock size={12} className="text-slate-400" />
          <span className="font-mono-time text-xs font-bold text-slate-700">
            {option.total_duration} min
          </span>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${crowdBg}`}>
          <Users size={12} className={crowdColor} />
          <span className={`text-[11px] font-bold ${crowdColor}`}>
            {option.crowding_percent}%
          </span>
        </div>
      </div>

      {/* Crowding bar */}
      <div className="ml-9 mt-2">
        <div className="crowding-bar">
          <div
            className={`crowding-fill ${crowdBarColor}`}
            style={{ width: `${option.crowding_percent}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">{option.crowding_label}</p>
      </div>
    </button>
  );
}
