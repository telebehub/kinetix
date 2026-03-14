import { useState } from "react";
import "@/App.css";
import MapPage from "@/components/MapPage";
import RadarPage from "@/components/RadarPage";
import TicketsPage from "@/components/TicketsPage";
import SettingsPage from "@/components/SettingsPage";
import DashboardPage from "@/components/DashboardPage";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";

function AppContent() {
  const [activePage, setActivePage] = useState("map");
  const { isDark } = useSettings();

  return (
    <div className={`max-w-md mx-auto h-[100dvh] relative overflow-hidden shadow-2xl ${isDark ? "dark bg-slate-900" : "bg-slate-50"}`}>
      <div className="h-full">
        {activePage === "map" && <MapPage />}
        {activePage === "dashboard" && <DashboardPage />}
        {activePage === "radar" && <RadarPage />}
        {activePage === "tickets" && <TicketsPage />}
        {activePage === "settings" && <SettingsPage />}
      </div>
      <BottomNav active={activePage} onChange={setActivePage} />
      <Toaster position="top-center" theme={isDark ? "dark" : "light"} />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
