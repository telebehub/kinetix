import { useState, useRef, useCallback } from "react";
import { ChevronUp, Sparkles } from "lucide-react";
import RouteCard from "@/components/RouteCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function BottomSheet({
  routes,
  loading,
  selectedRoute,
  onSelectRoute,
  origin,
  destination,
}) {
  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;
    const diff = startY.current - e.touches[0].clientY;
    setDragY(diff);
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (dragY > 60) {
      setExpanded(true);
    } else if (dragY < -60) {
      setExpanded(false);
    }
    setDragY(0);
  }, [dragY]);

  const hasContent = loading || routes;

  if (!hasContent && !origin) {
    return (
      <div className="px-4 pb-20">
        <div className="glass-card rounded-2xl p-4 shadow-[0_-4px_20px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Sparkles size={18} className="text-[#0066FF]" />
            </div>
            <div>
              <h3
                className="text-sm font-bold text-slate-800"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Kinetix AI
              </h3>
              <p className="text-xs text-slate-500">Select origin & destination to find smart routes</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="bottom-sheet"
      className={`bottom-sheet bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgb(0,0,0,0.1)] transition-all duration-300 ${
        expanded ? "max-h-[75vh]" : "max-h-[45vh]"
      } pb-20 overflow-hidden`}
      style={{
        transform: isDragging.current ? `translateY(${-dragY * 0.3}px)` : undefined,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag Handle */}
      <div className="flex justify-center pt-3 pb-2 cursor-grab" onClick={() => setExpanded(!expanded)}>
        <div className="w-12 h-1.5 bg-slate-200 rounded-full" data-testid="sheet-handle" />
      </div>

      <div className="px-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: expanded ? "65vh" : "35vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#0066FF]" />
            <h3
              className="text-base font-bold text-slate-800"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {loading ? "Finding Routes..." : routes ? "Route Options" : "Kinetix AI"}
            </h3>
          </div>
          <button
            data-testid="expand-sheet"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronUp
              size={18}
              className={`text-slate-400 transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div data-testid="route-loading" className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-ping" />
              <p className="text-xs text-slate-500 italic">
                Kinetix AI is processing real-time passenger flow...
              </p>
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        )}

        {/* Routes */}
        {routes && !loading && (
          <div data-testid="route-results" className="space-y-3 pb-4">
            {routes.options?.map((option, idx) => (
              <RouteCard
                key={option.id || idx}
                option={option}
                isSelected={selectedRoute?.id === option.id}
                onSelect={() => onSelectRoute(option)}
              />
            ))}

            {/* AI insight footer */}
            <div className="mt-2 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                <Sparkles size={12} className="inline mr-1 -mt-0.5" />
                Kinetix AI recommends the Smart Route. Save {" "}
                <span className="font-bold">
                  {routes.options?.[0]?.crowding_percent - routes.options?.[1]?.crowding_percent}%
                </span>{" "}
                crowding for just{" "}
                <span className="font-mono-time font-bold">
                  +{routes.options?.[1]?.total_duration - routes.options?.[0]?.total_duration} min
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
