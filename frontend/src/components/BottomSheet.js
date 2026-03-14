import { Sparkles } from "lucide-react";
import RouteCard from "@/components/RouteCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function BottomSheet({ routes, loading, selectedRoute, onSelectRoute }) {
  const hasContent = loading || routes;

  if (!hasContent) {
    return (
      <div className="px-3 pb-16">
        <div className="glass-card rounded-2xl p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-[#0066FF]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Kinetix AI Ready
              </p>
              <p className="text-[10px] text-slate-400">Select a route to get smart suggestions</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="bottom-sheet" className="bg-white rounded-t-[24px] shadow-[0_-4px_20px_rgb(0,0,0,0.06)] pb-16">
      {/* Handle */}
      <div className="flex justify-center pt-2.5 pb-1">
        <div className="w-8 h-1 bg-slate-200 rounded-full" data-testid="sheet-handle" />
      </div>

      <div className="px-3 pb-3 max-h-[40vh] overflow-y-auto custom-scrollbar">
        {/* Loading */}
        {loading && (
          <div data-testid="route-loading" className="space-y-2">
            <div className="flex items-center gap-2 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-ping" />
              <p className="text-[11px] text-slate-400">Analyzing passenger flow...</p>
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}

        {/* Results */}
        {routes && !loading && (
          <div data-testid="route-results" className="space-y-2">
            <div className="flex items-center gap-1.5 py-1.5">
              <Sparkles size={12} className="text-[#0066FF]" />
              <h3 className="text-[12px] font-bold text-slate-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {routes.origin} → {routes.destination}
              </h3>
            </div>

            {routes.options?.map((option, idx) => (
              <RouteCard
                key={option.id || idx}
                option={option}
                isSelected={selectedRoute?.id === option.id}
                onSelect={() => onSelectRoute(option)}
              />
            ))}

            {/* AI insight */}
            {routes.options?.length >= 2 && (
              <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/60 mt-1">
                <p className="text-[10px] text-blue-600 font-medium leading-relaxed">
                  <Sparkles size={10} className="inline mr-1 -mt-0.5" />
                  Smart Route saves{" "}
                  <span className="font-bold">
                    {(routes.options[0]?.crowding_percent || 0) - (routes.options[1]?.crowding_percent || 0)}%
                  </span>{" "}
                  crowding for +
                  <span className="font-mono-time font-bold">
                    {(routes.options[1]?.total_duration || 0) - (routes.options[0]?.total_duration || 0)} min
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
