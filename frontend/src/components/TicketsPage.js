import { useState, useEffect, useCallback } from "react";
import { Ticket, Plus, TrainFront, Bus, Combine, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { TICKET_TYPES, TRANSPORT_OPTIONS } from "@/data/bakuData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function getTransportIcon(transport) {
  if (transport === "metro") return <TrainFront size={16} className="text-red-500" />;
  if (transport === "bus") return <Bus size={16} className="text-emerald-500" />;
  return <Combine size={16} className="text-[#0066FF]" />;
}

function getStatusColor(status) {
  if (status === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "expired") return "bg-slate-50 text-slate-500 border-slate-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPurchase, setShowPurchase] = useState(false);
  const [selectedType, setSelectedType] = useState("single");
  const [selectedTransport, setSelectedTransport] = useState("combined");
  const [purchasing, setPurchasing] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/tickets`);
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error("Fetch tickets error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await axios.post(`${API}/tickets/purchase`, {
        type: selectedType,
        transport: selectedTransport,
      });
      toast.success("Ticket purchased successfully!");
      setShowPurchase(false);
      fetchTickets();
    } catch (err) {
      toast.error("Purchase failed. Try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const PRICES = {
    single: { metro: 0.30, bus: 0.30, combined: 0.50 },
    daily: { metro: 2.00, bus: 2.00, combined: 3.50 },
    weekly: { metro: 10.00, bus: 10.00, combined: 18.00 },
    monthly: { metro: 35.00, bus: 35.00, combined: 60.00 },
  };

  const currentPrice = PRICES[selectedType]?.[selectedTransport] || 0;

  return (
    <div data-testid="tickets-page" className="absolute inset-0 bg-slate-50 flex flex-col page-enter">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Ticket size={20} className="text-[#0066FF]" />
            </div>
            <div>
              <h1
                className="text-lg font-bold text-slate-800"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                My Tickets
              </h1>
              <p className="text-xs text-slate-500">
                {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            data-testid="buy-ticket-btn"
            onClick={() => setShowPurchase(!showPurchase)}
            className="bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl h-9 px-4"
          >
            <Plus size={16} className="mr-1" />
            Buy
          </Button>
        </div>
      </div>

      {/* Purchase Panel */}
      {showPurchase && (
        <div data-testid="purchase-panel" className="bg-white mx-4 mt-4 rounded-2xl p-4 border border-slate-100 shadow-sm page-enter">
          <h3
            className="text-sm font-bold text-slate-800 mb-3"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Purchase Ticket
          </h3>

          {/* Ticket type */}
          <p className="text-[11px] text-slate-500 font-medium mb-2 uppercase tracking-wide">Type</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {TICKET_TYPES.map((t) => (
              <button
                key={t.type}
                data-testid={`ticket-type-${t.type}`}
                onClick={() => setSelectedType(t.type)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedType === t.type
                    ? "border-[#0066FF] bg-blue-50"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <p className="text-xs font-bold text-slate-800">{t.label}</p>
                <p className="text-[10px] text-slate-500">{t.duration}</p>
              </button>
            ))}
          </div>

          {/* Transport */}
          <p className="text-[11px] text-slate-500 font-medium mb-2 uppercase tracking-wide">Transport</p>
          <div className="flex gap-2 mb-4">
            {TRANSPORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                data-testid={`transport-${opt.value}`}
                onClick={() => setSelectedTransport(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  selectedTransport === opt.value
                    ? "border-[#0066FF] bg-blue-50 text-[#0066FF]"
                    : "border-slate-100 text-slate-600 hover:border-slate-200"
                }`}
              >
                {getTransportIcon(opt.value)}
                {opt.label}
              </button>
            ))}
          </div>

          {/* Price & Buy */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-[10px] text-slate-500">Total</p>
              <p className="text-xl font-bold text-slate-800 font-mono-time">
                {currentPrice.toFixed(2)} <span className="text-sm text-slate-500">AZN</span>
              </p>
            </div>
            <Button
              data-testid="confirm-purchase-btn"
              onClick={handlePurchase}
              disabled={purchasing}
              className="bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl h-10 px-6"
            >
              {purchasing ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Ticket List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 pb-20">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Ticket size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-500">No tickets yet</p>
            <p className="text-xs text-slate-400 mt-1">Buy your first ticket to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket, idx) => (
              <div
                key={ticket.id || idx}
                data-testid={`ticket-card-${idx}`}
                className="ticket-card bg-white rounded-2xl p-4 border border-slate-100 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTransportIcon(ticket.transport)}
                    <div>
                      <p
                        className="text-sm font-bold text-slate-800 capitalize"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {ticket.type} Pass
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize">{ticket.transport}</p>
                    </div>
                  </div>
                  <Badge
                    className={`text-[10px] font-bold ${getStatusColor(ticket.status)} border`}
                    variant="outline"
                  >
                    {ticket.status === "active" ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={10} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <AlertCircle size={10} /> {ticket.status}
                      </span>
                    )}
                  </Badge>
                </div>

                {/* Dashed divider */}
                <div className="border-t border-dashed border-slate-200 my-3" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={12} />
                    <span className="font-mono-time">
                      {new Date(ticket.valid_from).toLocaleDateString()}
                    </span>
                    <span>-</span>
                    <span className="font-mono-time">
                      {new Date(ticket.valid_until).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 font-mono-time">
                    {Number(ticket.price).toFixed(2)} AZN
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
