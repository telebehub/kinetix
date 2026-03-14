import { useState, useEffect, useCallback } from "react";
import { Ticket, Plus, TrainFront, Bus, Combine, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { TICKET_TYPES, TRANSPORT_OPTIONS } from "@/data/bakuData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getTransportIcon(tr) {
  if (tr === "metro") return <TrainFront size={16} className="text-red-500" />;
  if (tr === "bus") return <Bus size={16} className="text-emerald-500" />;
  return <Combine size={16} className="text-[#0066FF]" />;
}

export default function TicketsPage() {
  const { t, isDark, tc } = useSettings();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [selectedType, setSelectedType] = useState("single");
  const [selectedTransport, setSelectedTransport] = useState("combined");
  const [purchasing, setPurchasing] = useState(false);

  const fetchTickets = useCallback(async () => {
    try { const r = await axios.get(`${API}/tickets`); setTickets(r.data.tickets || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handlePurchase = async () => {
    setPurchasing(true);
    try { await axios.post(`${API}/tickets/purchase`, { type: selectedType, transport: selectedTransport }); toast.success(t("tickets.purchaseSuccess")); setShowPurchase(false); fetchTickets(); }
    catch { toast.error(t("tickets.purchaseFail")); }
    finally { setPurchasing(false); }
  };

  const PRICES = { single: { metro: 0.30, bus: 0.30, combined: 0.50 }, daily: { metro: 2.00, bus: 2.00, combined: 3.50 }, weekly: { metro: 10.00, bus: 10.00, combined: 18.00 }, monthly: { metro: 35.00, bus: 35.00, combined: 60.00 } };
  const price = PRICES[selectedType]?.[selectedTransport] || 0;

  const card = tc("bg-white border-slate-100", "bg-slate-800 border-slate-700");
  const text1 = tc("text-slate-800", "text-slate-100");
  const text3 = tc("text-slate-400", "text-slate-500");
  const headerBg = tc("bg-white border-slate-100", "bg-slate-800/80 border-slate-700");
  const pageBg = tc("bg-slate-50", "bg-slate-900");
  const selectActive = tc("border-[#0066FF] bg-blue-50", "border-[#0066FF] bg-blue-500/10");
  const selectInactive = tc("border-slate-100 text-slate-600 hover:border-slate-200", "border-slate-700 text-slate-400 hover:border-slate-600");

  const ticketTypeLabels = { single: t("tickets.single"), daily: t("tickets.daily"), weekly: t("tickets.weekly"), monthly: t("tickets.monthly") };
  const durationLabels = { single: t("tickets.h2"), daily: t("tickets.h24"), weekly: t("tickets.d7"), monthly: t("tickets.d30") };
  const transportLabels = { metro: t("tickets.metro"), bus: t("tickets.bus"), combined: t("tickets.combined") };

  return (
    <div data-testid="tickets-page" className={`absolute inset-0 ${pageBg} flex flex-col page-enter`}>
      <div className={`px-4 pt-5 pb-3 border-b ${headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tc("bg-blue-50","bg-blue-500/10")}`}>
              <Ticket size={20} className="text-[#0066FF]" />
            </div>
            <div>
              <h1 className={`text-base font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("tickets.title")}</h1>
              <p className={`text-[10px] ${text3}`}>{tickets.length} {t("nav.tickets").toLowerCase()}</p>
            </div>
          </div>
          <Button data-testid="buy-ticket-btn" onClick={() => setShowPurchase(!showPurchase)}
            className="bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl h-9 px-4">
            <Plus size={16} className="mr-1" />{t("tickets.buy")}
          </Button>
        </div>
      </div>

      {showPurchase && (
        <div data-testid="purchase-panel" className={`${card} mx-4 mt-3 rounded-xl p-3 border shadow-sm page-enter`}>
          <h3 className={`text-[11px] font-bold ${text1} mb-2.5`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t("tickets.purchaseTitle")}</h3>
          <p className={`text-[9px] font-semibold uppercase tracking-wider mb-1.5 ${text3}`}>{t("tickets.type")}</p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {["single","daily","weekly","monthly"].map((tp) => (
              <button key={tp} data-testid={`ticket-type-${tp}`} onClick={() => setSelectedType(tp)}
                className={`p-2 rounded-lg border text-left transition-all ${selectedType === tp ? selectActive : selectInactive}`}>
                <p className={`text-[11px] font-bold ${selectedType === tp ? "text-[#0066FF]" : text1}`}>{ticketTypeLabels[tp]}</p>
                <p className={`text-[9px] ${text3}`}>{durationLabels[tp]}</p>
              </button>
            ))}
          </div>
          <p className={`text-[9px] font-semibold uppercase tracking-wider mb-1.5 ${text3}`}>{t("tickets.transport")}</p>
          <div className="flex gap-1.5 mb-3">
            {TRANSPORT_OPTIONS.map((opt) => (
              <button key={opt.value} data-testid={`transport-${opt.value}`} onClick={() => setSelectedTransport(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border text-[11px] font-semibold transition-all ${
                  selectedTransport === opt.value ? selectActive + " text-[#0066FF]" : selectInactive
                }`}>
                {getTransportIcon(opt.value)}{transportLabels[opt.value]}
              </button>
            ))}
          </div>
          <div className={`flex items-center justify-between p-2.5 rounded-lg ${tc("bg-slate-50","bg-slate-700")}`}>
            <div>
              <p className={`text-[9px] ${text3}`}>{t("tickets.total")}</p>
              <p className={`text-lg font-bold font-mono-time ${text1}`}>{price.toFixed(2)} <span className={`text-sm ${text3}`}>AZN</span></p>
            </div>
            <Button data-testid="confirm-purchase-btn" onClick={handlePurchase} disabled={purchasing}
              className="bg-[#0066FF] hover:bg-blue-700 text-white rounded-lg h-9 px-5">
              {purchasing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t("tickets.confirm")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 pb-20">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton-shimmer rounded-xl" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${tc("bg-slate-100","bg-slate-800")}`}>
              <Ticket size={22} className={text3} />
            </div>
            <p className={`text-sm font-semibold ${tc("text-slate-500","text-slate-400")}`}>{t("tickets.noTickets")}</p>
            <p className={`text-xs mt-1 ${text3}`}>{t("tickets.noTicketsDesc")}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tickets.map((ticket, idx) => (
              <div key={ticket.id || idx} data-testid={`ticket-card-${idx}`} className={`ticket-card ${card} rounded-xl p-3 border`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTransportIcon(ticket.transport)}
                    <div>
                      <p className={`text-[12px] font-bold capitalize ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ticketTypeLabels[ticket.type] || ticket.type}</p>
                      <p className={`text-[9px] capitalize ${text3}`}>{transportLabels[ticket.transport] || ticket.transport}</p>
                    </div>
                  </div>
                  <Badge className={`text-[9px] font-bold border ${ticket.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-slate-50 text-slate-500 border-slate-200"}`} variant="outline">
                    {ticket.status === "active" ? <span className="flex items-center gap-0.5"><CheckCircle size={9} />{t("tickets.active")}</span> : <span className="flex items-center gap-0.5"><AlertCircle size={9} />{t("tickets.expired")}</span>}
                  </Badge>
                </div>
                <div className={`border-t border-dashed my-2 ${tc("border-slate-200","border-slate-600")}`} />
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-1 text-[10px] ${text3}`}>
                    <Clock size={10} />
                    <span className="font-mono-time">{new Date(ticket.valid_from).toLocaleDateString()}</span>
                    <span>-</span>
                    <span className="font-mono-time">{new Date(ticket.valid_until).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-sm font-bold font-mono-time ${text1}`}>{Number(ticket.price).toFixed(2)} AZN</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
