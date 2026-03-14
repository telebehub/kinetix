import { TrainFront, Bus, Sparkles, Clock, Users } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export default function RouteCard({ option, isSelected, onSelect }) {
  const { t, isDark, tc } = useSettings();
  const rec = option.is_recommended;
  const pct = option.crowding_percent;
  const crowdColor = pct > 80 ? "text-red-500" : pct > 50 ? "text-amber-500" : "text-emerald-500";
  const crowdBg = pct > 80 ? "bg-red-50 dark:bg-red-500/10" : pct > 50 ? "bg-amber-50 dark:bg-amber-500/10" : "bg-emerald-50 dark:bg-emerald-500/10";
  const barColor = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";

  const text1 = tc("text-slate-800", "text-slate-100");
  const cardBase = rec
    ? (isSelected ? tc("bg-blue-50 ring-1 ring-[#0066FF]/30", "bg-blue-500/10 ring-1 ring-blue-500/30")
      : tc("bg-gradient-to-r from-blue-50/50 to-white border border-blue-100", "bg-blue-500/5 border border-blue-500/20"))
    : (isSelected ? tc("bg-white ring-1 ring-slate-200", "bg-slate-700 ring-1 ring-slate-600")
      : tc("bg-slate-50/50 border border-slate-100", "bg-slate-700/50 border border-slate-600"));

  return (
    <button data-testid={`route-card-${rec ? "smart" : "standard"}`} onClick={onSelect}
      className={`w-full text-left rounded-xl transition-all duration-150 active:scale-[0.98] p-3 ${cardBase}`}>
      <div className="flex items-center gap-2.5">
        {rec ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tc("bg-slate-100","bg-slate-600")}`}>
            {option.segments?.[0]?.type === "metro" ? <TrainFront size={14} className="text-red-500" /> : <Bus size={14} className="text-emerald-500" />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-[12px] font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {rec ? t("route.smart") : t("route.standard")}
            </span>
            {rec && <span className="text-[8px] font-bold text-white bg-[#0066FF] px-1.5 py-0.5 rounded-full uppercase tracking-wider">{t("route.best")}</span>}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {option.segments?.map((seg, i) => (
              <span key={i} className="flex items-center gap-0.5">
                {i > 0 && <span className={`text-[9px] ${tc("text-slate-300","text-slate-600")}`}>+</span>}
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${seg.type === "metro" ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"}`}>
                  {seg.line}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-1">
            <Clock size={10} className={tc("text-slate-400","text-slate-500")} />
            <span className={`font-mono-time text-[11px] font-bold ${tc("text-slate-700","text-slate-200")}`}>{option.total_duration}{t("common.min")}</span>
          </div>
          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${crowdBg}`}>
            <Users size={9} className={crowdColor} />
            <span className={`text-[9px] font-bold ${crowdColor}`}>{pct}%</span>
          </div>
        </div>
      </div>
      <div className="mt-2 ml-[42px]">
        <div className={`h-1 rounded-full overflow-hidden ${tc("bg-slate-100","bg-slate-600")}`}>
          <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <p className={`text-[9px] mt-0.5 ${tc("text-slate-400","text-slate-500")}`}>{option.crowding_label}</p>
      </div>
    </button>
  );
}
