// Mock data for Baku public transport
export const BAKU_CENTER = [40.4093, 49.8671];

export const METRO_LINES = {
  red: {
    name: "Red Line",
    name_az: "Qirmizi Xett",
    color: "#EF4444",
    stations: ["Icherisheher", "Sahil", "28 May", "Ganjlik", "Nariman Narimanov", "Ulduz", "Koroglu", "Neftchilar"]
  },
  green: {
    name: "Green Line",
    name_az: "Yasil Xett",
    color: "#10B981",
    stations: ["28 May", "Nizami", "Elmler Akademiyasi"]
  }
};

export const BUS_ROUTES = [
  { number: "14", route: "Icherisheher - Baki Bulvari" },
  { number: "18", route: "Ganjlik - Heydar Aliyev Center" },
  { number: "65", route: "28 May - Koroglu" },
  { number: "88", route: "Nizami - Elmler Akademiyasi" },
  { number: "125", route: "Koroglu - Neftchilar" },
];

export const LOCATIONS = [
  { id: "metro-icherisheher", name: "Icherisheher Metro", name_az: "Iceriseher", type: "metro", lat: 40.3661, lng: 49.8372, lines: ["Red Line"] },
  { id: "metro-sahil", name: "Sahil Metro", name_az: "Sahil", type: "metro", lat: 40.3725, lng: 49.8525, lines: ["Red Line"] },
  { id: "metro-28may", name: "28 May Metro", name_az: "28 May", type: "metro", lat: 40.3795, lng: 49.8494, lines: ["Red Line", "Green Line"] },
  { id: "metro-ganjlik", name: "Ganjlik Metro", name_az: "Genclik", type: "metro", lat: 40.4035, lng: 49.8517, lines: ["Red Line"] },
  { id: "metro-nariman", name: "Nariman Narimanov Metro", name_az: "Neriman Nerimanov", type: "metro", lat: 40.4085, lng: 49.8678, lines: ["Red Line"] },
  { id: "metro-elmler", name: "Elmler Akademiyasi Metro", name_az: "Elmler Akademiyasi", type: "metro", lat: 40.3874, lng: 49.8137, lines: ["Green Line"] },
  { id: "metro-nizami", name: "Nizami Metro", name_az: "Nizami", type: "metro", lat: 40.3803, lng: 49.8313, lines: ["Green Line"] },
  { id: "metro-koroglu", name: "Koroglu Metro", name_az: "Koroglu", type: "metro", lat: 40.4195, lng: 49.9105, lines: ["Red Line"] },
  { id: "metro-ulduz", name: "Ulduz Metro", name_az: "Ulduz", type: "metro", lat: 40.4119, lng: 49.8826, lines: ["Red Line"] },
  { id: "metro-neftchilar", name: "Neftchilar Metro", name_az: "Neftciler", type: "metro", lat: 40.4222, lng: 49.9325, lines: ["Red Line"] },
  { id: "bus-14", name: "Bus 14 - Icherisheher", name_az: "Avtobus 14", type: "bus_stop", lat: 40.3670, lng: 49.8355, lines: ["14"] },
  { id: "bus-88", name: "Bus 88 - Nizami", name_az: "Avtobus 88", type: "bus_stop", lat: 40.3790, lng: 49.8290, lines: ["88"] },
  { id: "bus-125", name: "Bus 125 - Koroglu", name_az: "Avtobus 125", type: "bus_stop", lat: 40.4180, lng: 49.9090, lines: ["125"] },
  { id: "bus-65", name: "Bus 65 - 28 May", name_az: "Avtobus 65", type: "bus_stop", lat: 40.3800, lng: 49.8510, lines: ["65"] },
  { id: "bus-18", name: "Bus 18 - Ganjlik", name_az: "Avtobus 18", type: "bus_stop", lat: 40.4025, lng: 49.8530, lines: ["18"] },
  { id: "landmark-flame", name: "Flame Towers", name_az: "Alov Quleleri", type: "landmark", lat: 40.3596, lng: 49.8213, lines: [] },
  { id: "landmark-boulevard", name: "Baku Boulevard", name_az: "Baki Bulvari", type: "landmark", lat: 40.3588, lng: 49.8463, lines: [] },
  { id: "landmark-heydar", name: "Heydar Aliyev Center", name_az: "Heyder Eliyev Merkezi", type: "landmark", lat: 40.3959, lng: 49.8677, lines: [] },
];

export const TRANSPORT_MODES = [
  { id: "bus", label: "Bus Only", icon: "Bus" },
  { id: "metro", label: "Metro Only", icon: "TrainFront" },
  { id: "mixed", label: "Best Mixed (AI)", icon: "Sparkles" },
];

export const TICKET_TYPES = [
  { type: "single", label: "Single Trip", label_az: "Tek Gediş", duration: "2 hours" },
  { type: "daily", label: "Daily Pass", label_az: "Gunluk", duration: "24 hours" },
  { type: "weekly", label: "Weekly Pass", label_az: "Heftelik", duration: "7 days" },
  { type: "monthly", label: "Monthly Pass", label_az: "Ayliq", duration: "30 days" },
];

export const TRANSPORT_OPTIONS = [
  { value: "metro", label: "Metro" },
  { value: "bus", label: "Bus" },
  { value: "combined", label: "Combined" },
];
