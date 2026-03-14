import { Map, Radio, Ticket, Settings } from "lucide-react";

const NAV_ITEMS = [
  { id: "map", label: "Map", icon: Map },
  { id: "radar", label: "AI Radar", icon: Radio },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-50"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            data-testid={`nav-${item.id}`}
            onClick={() => onChange(item.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all duration-200 relative ${
              isActive ? "nav-active" : ""
            }`}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
              className={`transition-colors duration-200 ${
                isActive ? "text-[#0066FF]" : "text-slate-400"
              }`}
            />
            <span
              className={`text-[10px] font-medium transition-colors duration-200 ${
                isActive ? "text-[#0066FF]" : "text-slate-400"
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
