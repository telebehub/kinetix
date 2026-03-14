import { useState, useCallback } from "react";
import {
  Settings as SettingsIcon, Globe, Bell, Moon, Route,
  Accessibility, Save, User, Sun, Monitor, Bus,
  TrainFront, Sparkles, CheckCircle, Loader2, ChevronRight
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

const LANGUAGES = [
  { code: "az", label: "Azərbaycan", short: "AZ" },
  { code: "en", label: "English", short: "EN" },
  { code: "ru", label: "Русский", short: "RU" },
];

const THEMES = [
  { code: "light", icon: Sun },
  { code: "dark", icon: Moon },
];

const PREF_MODES = [
  { code: "bus", icon: Bus },
  { code: "metro", icon: TrainFront },
  { code: "mixed", icon: Sparkles },
];

export default function SettingsPage() {
  const { settings, updateSettings, updateSetting, t, isDark } = useSettings();
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync local when global changes (on mount)
  const setLocal = useCallback((key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setDirty(true);

    // Instant-apply for theme and language
    if (key === "dark_mode" || key === "language") {
      updateSetting(key, value);
    }
  }, [updateSetting]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(localSettings);
      setDirty(false);
      toast.success(t("settings.saved"));
    } catch {
      toast.error(t("settings.saveFail"));
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (val) => {
    setLocal("notifications", val);
    if (val && "Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  };

  const card = isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-100";
  const text1 = isDark ? "text-slate-100" : "text-slate-800";
  const text2 = isDark ? "text-slate-400" : "text-slate-500";
  const text3 = isDark ? "text-slate-500" : "text-slate-400";
  const pageBg = isDark ? "bg-slate-900" : "bg-slate-50";
  const headerBg = isDark ? "bg-slate-800/80 border-slate-700" : "bg-white border-slate-100";
  const selectActive = isDark ? "border-[#0066FF] bg-blue-500/10" : "border-[#0066FF] bg-blue-50";
  const selectInactive = isDark ? "border-slate-700 text-slate-400 hover:border-slate-600" : "border-slate-100 text-slate-600 hover:border-slate-200";

  return (
    <div data-testid="settings-page" className={`absolute inset-0 ${pageBg} flex flex-col page-enter`}>
      {/* Header */}
      <div className={`px-4 pt-5 pb-3 border-b ${headerBg}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <SettingsIcon size={18} className="text-[#0066FF]" />
          </div>
          <div>
            <h1 className={`text-base font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t("settings.title")}
            </h1>
            <p className={`text-[10px] ${text3}`}>{t("settings.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 pb-20 space-y-3">
        {/* Profile */}
        <div className={`${card} rounded-xl p-3 border`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {t("settings.profile")}
              </p>
              <p className={`text-[10px] ${text3}`}>{t("settings.profileLoc")}</p>
            </div>
            <ChevronRight size={16} className={text3} />
          </div>
        </div>

        {/* Language */}
        <div data-testid="language-section" className={`${card} rounded-xl p-3 border`}>
          <div className="flex items-center gap-2 mb-2.5">
            <Globe size={14} className="text-[#0066FF]" />
            <p className={`text-[11px] font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t("settings.language")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                data-testid={`lang-${lang.code}`}
                onClick={() => setLocal("language", lang.code)}
                className={`py-2.5 px-2 rounded-lg text-center transition-all border ${
                  localSettings.language === lang.code ? selectActive + " text-[#0066FF]" : selectInactive
                }`}
              >
                <span className={`block text-sm font-bold mb-0.5 ${localSettings.language === lang.code ? "text-[#0066FF]" : ""}`}>
                  {lang.short}
                </span>
                <span className={`text-[9px] ${localSettings.language === lang.code ? "text-[#0066FF]" : text3}`}>
                  {lang.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div data-testid="theme-section" className={`${card} rounded-xl p-3 border`}>
          <div className="flex items-center gap-2 mb-2.5">
            {isDark ? <Moon size={14} className="text-[#0066FF]" /> : <Sun size={14} className="text-[#0066FF]" />}
            <p className={`text-[11px] font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t("settings.theme")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((th) => {
              const Icon = th.icon;
              const isActive = (th.code === "dark") === localSettings.dark_mode;
              return (
                <button
                  key={th.code}
                  data-testid={`theme-${th.code}`}
                  onClick={() => setLocal("dark_mode", th.code === "dark")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-semibold transition-all border ${
                    isActive ? selectActive + " text-[#0066FF]" : selectInactive
                  }`}
                >
                  <Icon size={14} />
                  {t(`settings.${th.code}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Preferred Mode */}
        <div data-testid="prefmode-section" className={`${card} rounded-xl p-3 border`}>
          <div className="flex items-center gap-2 mb-2.5">
            <Route size={14} className="text-[#0066FF]" />
            <p className={`text-[11px] font-bold ${text1}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t("settings.prefMode")}
            </p>
          </div>
          <div className="space-y-1.5">
            {PREF_MODES.map((m) => {
              const Icon = m.icon;
              const isActive = localSettings.preferred_mode === m.code;
              const labelKey = m.code === "bus" ? "settings.busPref" : m.code === "metro" ? "settings.metroPref" : "settings.aiPref";
              return (
                <button
                  key={m.code}
                  data-testid={`pref-mode-${m.code}`}
                  onClick={() => setLocal("preferred_mode", m.code)}
                  className={`w-full flex items-center gap-2.5 py-2.5 px-3 rounded-lg text-[11px] font-semibold transition-all border ${
                    isActive ? selectActive + " text-[#0066FF]" : selectInactive
                  }`}
                >
                  <Icon size={14} />
                  <span className="flex-1 text-left">{t(labelKey)}</span>
                  {isActive && <div className="w-2 h-2 rounded-full bg-[#0066FF]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle Settings */}
        <div className={`${card} rounded-xl border divide-y ${isDark ? "divide-slate-700" : "divide-slate-50"}`}>
          {[
            { key: "notifications", icon: Bell, labelKey: "settings.notifications", descKey: "settings.notifDesc", onToggle: handleNotificationToggle },
            { key: "comfort_priority", icon: Route, labelKey: "settings.comfort", descKey: "settings.comfortDesc" },
            { key: "accessibility", icon: Accessibility, labelKey: "settings.accessibility", descKey: "settings.accessDesc" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={text3} />
                  <div>
                    <p className={`text-[11px] font-medium ${text1}`}>{t(item.labelKey)}</p>
                    <p className={`text-[9px] ${text3}`}>{t(item.descKey)}</p>
                  </div>
                </div>
                <Switch
                  data-testid={`toggle-${item.key}`}
                  checked={localSettings[item.key]}
                  onCheckedChange={(val) => {
                    if (item.onToggle) { item.onToggle(val); }
                    else { setLocal(item.key, val); }
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Accessibility note */}
        {localSettings.accessibility && (
          <div className={`p-2.5 rounded-lg border text-[10px] font-medium page-enter ${
            isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-100 text-amber-700"
          }`}>
            {t("settings.accessNote")}
          </div>
        )}

        {/* Save Button */}
        <Button
          data-testid="save-settings-btn"
          onClick={handleSave}
          disabled={saving}
          className={`w-full rounded-xl h-10 font-bold text-[12px] shadow-sm transition-all ${
            dirty
              ? "bg-[#0066FF] hover:bg-blue-700 text-white shadow-blue-200"
              : isDark
              ? "bg-slate-700 text-slate-400"
              : "bg-slate-200 text-slate-400"
          }`}
        >
          {saving ? (
            <span className="flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" />
              {t("settings.saving")}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              {dirty ? <Save size={14} /> : <CheckCircle size={14} />}
              {dirty ? t("settings.save") : t("settings.saved")}
            </span>
          )}
        </Button>

        {/* Version */}
        <div className="text-center pt-1 pb-4">
          <p className={`text-[10px] font-medium ${text3}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t("settings.version")}
          </p>
          <p className={`text-[9px] ${isDark ? "text-slate-600" : "text-slate-300"}`}>{t("settings.versionDesc")}</p>
        </div>
      </div>
    </div>
  );
}
