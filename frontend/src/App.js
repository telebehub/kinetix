import { useState, useCallback } from "react";
import "@/App.css";
import { BrowserRouter } from "react-router-dom";
import MapPage from "@/components/MapPage";
import RadarPage from "@/components/RadarPage";
import TicketsPage from "@/components/TicketsPage";
import SettingsPage from "@/components/SettingsPage";
import BottomNav from "@/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [activePage, setActivePage] = useState("map");

  const renderPage = useCallback(() => {
    switch (activePage) {
      case "map":
        return <MapPage />;
      case "radar":
        return <RadarPage />;
      case "tickets":
        return <TicketsPage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <MapPage />;
    }
  }, [activePage]);

  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto bg-slate-50 h-[100dvh] relative overflow-hidden shadow-2xl">
        {renderPage()}
        <BottomNav active={activePage} onChange={setActivePage} />
        <Toaster position="top-center" />
      </div>
    </BrowserRouter>
  );
}

export default App;
