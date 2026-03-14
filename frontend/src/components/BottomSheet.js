import { Sparkles } from "lucide-react";
import RouteCard from "@/components/RouteCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts/SettingsContext";

export default function BottomSheet({ routes, loading, selectedRoute, onSelectRoute }) {
  const { t, isDark, tc } = useSettings();
  const hasContent = loading || routes;

  if (!hasContent) {
    return (
      <div className="px-3 pb-16">
        <div className={`${tc("glass-card","glass-card-dark")} rounded-2xl p-3 shadow-sm`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tc("bg-blue-50","bg-blue-500/10")}`}>
              <Sparkles size={14} className="text-[#0066FF]" />
            </div>
            <div>
              <p className={`text-[12px] font-bold ${tc("text-slate-700","text-slate-200")}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t("sheet.ready")}
              </p>
              <p className={`text-[10px] ${tc("text-slate-400","text-slate-500")}`}>{t("sheet.readyDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="bottom-sheet" className={`rounded-t-[24px] shadow-[0_-4px_20px_rgb(0,0,0,0.06)] pb-16 ${tc("bg-white","bg-slate-800")}`}>
      <div className="flex justify-center pt-2.5 pb-1">
        <div className={`w-8 h-1 rounded-full ${tc("bg-slate-200","bg-slate-600")}`} data-testid="sheet-handle" />
      </div>

      <div className="px-3 pb-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
        {loading && (
          <div data-testid="route-loading" className="space-y-2">
            <div className="flex items-center gap-2 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-ping" />
              <p className={`text-[11px] ${tc("text-slate-400","text-slate-500")} italic`}>{t("sheet.analyzing")}</p>
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}

        {routes && !loading && (
          <div data-testid="route-results" className="space-y-2">
            <div className="flex items-center gap-1.5 py-1.5">
              <Sparkles size={12} className="text-[#0066FF]" />
              <h3 className={`text-[12px] font-bold ${tc("text-slate-700","text-slate-200")}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {routes.origin} → {routes.destination}
              </h3>
            </div>
            {routes.options?.map((option, idx) => (
              <RouteCard key={option.id || idx} option={option} isSelected={selectedRoute?.id === option.id} onSelect={() => onSelectRoute(option)} />
            ))}
            {routes.options?.length >= 2 && (
              <div className={`p-2.5 rounded-xl border mt-1 ${tc("bg-blue-50/60 border-blue-100/60","bg-blue-500/10 border-blue-500/20")}`}>
                <p className={`text-[10px] font-medium leading-relaxed ${tc("text-blue-600","text-blue-400")}`}>
                  <Sparkles size={10} className="inline mr-1 -mt-0.5" />
                  {t("sheet.smartSaves")}{" "}
                  <span className="font-bold">{(routes.options[0]?.crowding_percent || 0) - (routes.options[1]?.crowding_percent || 0)}%</span>
                  {" "}{t("sheet.crowdingFor")} +
                  <span className="font-mono-time font-bold">{(routes.options[1]?.total_duration || 0) - (routes.options[0]?.total_duration || 0)} {t("common.min")}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
