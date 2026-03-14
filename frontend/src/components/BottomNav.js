import { Map, Radio, Ticket, Settings, Brain } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

const NAV_ITEMS = [
  { id: "map", labelKey: "nav.map", icon: Map },
  { id: "dashboard", labelKey: "nav.aiModel", icon: Brain },
  { id: "radar", labelKey: "nav.radar", icon: Radio },
  { id: "tickets", labelKey: "nav.tickets", icon: Ticket },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];

export default function BottomNav({ active, onChange }) {
  const { t, isDark } = useSettings();

  return (
    <nav
      data-testid="bottom-nav"
      className={`absolute bottom-0 left-0 right-0 backdrop-blur-xl border-t flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-[100] ${
        isDark ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-100"
      }`}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            data-testid={`nav-${item.id}`}
            onClick={() => onChange(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 relative ${isActive ? "nav-active" : ""}`}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.8}
              className={`transition-colors duration-200 ${
                isActive ? "text-[#0066FF]" : isDark ? "text-slate-500" : "text-slate-400"
              }`}
            />
            <span
              className={`text-[9px] font-medium transition-colors duration-200 ${
                isActive ? "text-[#0066FF]" : isDark ? "text-slate-500" : "text-slate-400"
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t(item.labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
