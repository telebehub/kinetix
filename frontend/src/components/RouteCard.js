import { TrainFront, Bus, Sparkles, Clock, Users } from "lucide-react";

export default function RouteCard({ option, isSelected, onSelect }) {
  const rec = option.is_recommended;
  const pct = option.crowding_percent;
  const crowdColor = pct > 80 ? "text-red-500" : pct > 50 ? "text-amber-500" : "text-emerald-500";
  const crowdBg = pct > 80 ? "bg-red-50" : pct > 50 ? "bg-amber-50" : "bg-emerald-50";
  const barColor = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <button
      data-testid={`route-card-${rec ? "smart" : "standard"}`}
      onClick={onSelect}
      className={`w-full text-left rounded-xl transition-all duration-150 active:scale-[0.98] ${
        rec
          ? `p-3 ${isSelected ? "bg-blue-50 ring-1 ring-[#0066FF]/30" : "bg-gradient-to-r from-blue-50/50 to-white border border-blue-100"}`
          : `p-3 ${isSelected ? "bg-white ring-1 ring-slate-200" : "bg-slate-50/50 border border-slate-100"}`
      }`}
    >
      <div className="flex items-center gap-2.5">
        {/* Icon */}
        {rec ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            {option.segments?.[0]?.type === "metro" ? <TrainFront size={14} className="text-red-500" /> : <Bus size={14} className="text-emerald-500" />}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {option.label}
            </span>
            {rec && (
              <span className="text-[8px] font-bold text-white bg-[#0066FF] px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Best
              </span>
            )}
          </div>
          {/* Segments */}
          <div className="flex items-center gap-1 mt-0.5">
            {option.segments?.map((seg, i) => (
              <span key={i} className="flex items-center gap-0.5">
                {i > 0 && <span className="text-slate-300 text-[9px]">+</span>}
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${seg.type === "metro" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                  {seg.line}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-slate-400" />
            <span className="font-mono-time text-[11px] font-bold text-slate-700">{option.total_duration}m</span>
          </div>
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${crowdBg}`}>
            <Users size={9} className={crowdColor} />
            <span className={`text-[9px] font-bold ${crowdColor}`}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* Bar */}
      <div className="mt-2 ml-[42px]">
        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[9px] text-slate-400 mt-0.5">{option.crowding_label}</p>
      </div>
    </button>
  );
}
