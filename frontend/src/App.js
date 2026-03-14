import { useState, useCallback } from "react";
import "@/App.css";
import MapPage from "@/components/MapPage";
import RadarPage from "@/components/RadarPage";
import TicketsPage from "@/components/TicketsPage";
import SettingsPage from "@/components/SettingsPage";
import DashboardPage from "@/components/DashboardPage";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [activePage, setActivePage] = useState("map");

  return (
    <div className="max-w-md mx-auto bg-slate-50 h-[100dvh] relative overflow-hidden shadow-2xl">
      {/* Page Content */}
      <div className="h-full">
        {activePage === "map" && <MapPage />}
        {activePage === "dashboard" && <DashboardPage />}
        {activePage === "radar" && <RadarPage />}
        {activePage === "tickets" && <TicketsPage />}
        {activePage === "settings" && <SettingsPage />}
      </div>

      {/* Bottom Navigation - always on top */}
      <BottomNav active={activePage} onChange={setActivePage} />
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
