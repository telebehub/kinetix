import { useState, useEffect, useCallback } from "react";
import { Settings as SettingsIcon, Globe, Bell, Moon, Route, Accessibility, ChevronRight, Save, User } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LANGUAGES = [
  { code: "az", label: "Azerbaijani", flag: "AZ" },
  { code: "en", label: "English", flag: "EN" },
  { code: "ru", label: "Russian", flag: "RU" },
];

const MODES = [
  { code: "bus", label: "Bus First" },
  { code: "metro", label: "Metro First" },
  { code: "mixed", label: "AI Optimized" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    language: "az",
    notifications: true,
    dark_mode: false,
    preferred_mode: "mixed",
    comfort_priority: true,
    accessibility: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/settings`);
      const data = res.data;
      delete data.user;
      setSettings(data);
    } catch (err) {
      console.error("Settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/settings`, settings);
      toast.success("Settings saved successfully!");
    } catch (err) {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div data-testid="settings-loading" className="absolute inset-0 bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-[#0066FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div data-testid="settings-page" className="absolute inset-0 bg-slate-50 flex flex-col page-enter">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <SettingsIcon size={20} className="text-[#0066FF]" />
          </div>
          <div>
            <h1
              className="text-lg font-bold text-slate-800"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Settings
            </h1>
            <p className="text-xs text-slate-500">Customize your experience</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 pb-20 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p
                className="text-sm font-bold text-slate-800"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Kinetix User
              </p>
              <p className="text-xs text-slate-500">Baku, Azerbaijan</p>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        </div>

        {/* Language */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-[#0066FF]" />
            <p className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Language
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                data-testid={`lang-${lang.code}`}
                onClick={() => updateSetting("language", lang.code)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all border ${
                  settings.language === lang.code
                    ? "border-[#0066FF] bg-blue-50 text-[#0066FF]"
                    : "border-slate-100 text-slate-600 hover:border-slate-200"
                }`}
              >
                <span className="block text-lg mb-0.5">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Transport Mode */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Route size={16} className="text-[#0066FF]" />
            <p className="text-sm font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Preferred Mode
            </p>
          </div>
          <div className="space-y-2">
            {MODES.map((m) => (
              <button
                key={m.code}
                data-testid={`pref-mode-${m.code}`}
                onClick={() => updateSetting("preferred_mode", m.code)}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                  settings.preferred_mode === m.code
                    ? "border-[#0066FF] bg-blue-50 text-[#0066FF]"
                    : "border-slate-100 text-slate-600 hover:border-slate-200"
                }`}
              >
                {m.label}
                {settings.preferred_mode === m.code && (
                  <div className="w-2 h-2 rounded-full bg-[#0066FF]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {[
            {
              key: "notifications",
              icon: Bell,
              label: "Notifications",
              desc: "Get alerts about crowding changes",
            },
            {
              key: "dark_mode",
              icon: Moon,
              label: "Dark Mode",
              desc: "Switch to dark theme",
            },
            {
              key: "comfort_priority",
              icon: Route,
              label: "Comfort Priority",
              desc: "AI prioritizes comfort over speed",
            },
            {
              key: "accessibility",
              icon: Accessibility,
              label: "Accessibility",
              desc: "Wheelchair-friendly routes only",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <Switch
                  data-testid={`toggle-${item.key}`}
                  checked={settings[item.key]}
                  onCheckedChange={(val) => updateSetting(item.key, val)}
                />
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <Button
          data-testid="save-settings-btn"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#0066FF] hover:bg-blue-700 text-white rounded-2xl h-12 font-bold text-sm shadow-lg shadow-blue-200"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save size={16} />
              Save Settings
            </span>
          )}
        </Button>

        {/* App info */}
        <div className="text-center pt-2 pb-4">
          <p className="text-[11px] text-slate-400 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Kinetix v1.0.0
          </p>
          <p className="text-[10px] text-slate-300">AI-Powered Urban Mobility</p>
        </div>
      </div>
    </div>
  );
}
