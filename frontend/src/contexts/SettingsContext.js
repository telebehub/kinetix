import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import translations from "@/i18n/translations";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULTS = {
  language: "en",
  dark_mode: false,
  preferred_mode: "mixed",
  notifications: true,
  comfort_priority: true,
  accessibility: false,
};

const LS_KEY = "kinetix-settings";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });
  const [loaded, setLoaded] = useState(false);

  // Sync from backend on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/settings`);
        const remote = res.data;
        delete remote.user;
        const merged = { ...DEFAULTS, ...remote };
        setSettings(merged);
        localStorage.setItem(LS_KEY, JSON.stringify(merged));
      } catch (err) {
        console.error("Failed to load settings from server:", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback(async (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    localStorage.setItem(LS_KEY, JSON.stringify(merged));
    try {
      await axios.put(`${API}/settings`, merged);
    } catch (err) {
      console.error("Failed to save settings to server:", err);
      throw err;
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Translation helper
  const t = useCallback((key, fallback) => {
    const lang = settings.language || "en";
    const dict = translations[lang] || translations.en;
    const parts = key.split(".");
    let val = dict;
    for (const p of parts) {
      val = val?.[p];
      if (val === undefined) break;
    }
    if (val !== undefined) return val;
    // Fallback to English
    let enVal = translations.en;
    for (const p of parts) {
      enVal = enVal?.[p];
      if (enVal === undefined) break;
    }
    return enVal ?? fallback ?? key;
  }, [settings.language]);

  const isDark = settings.dark_mode;

  // Theme-conditional class helper
  const tc = useCallback((lightCls, darkCls) => {
    return isDark ? darkCls : lightCls;
  }, [isDark]);

  const value = useMemo(() => ({
    settings, updateSettings, updateSetting, t, isDark, tc, loaded,
  }), [settings, updateSettings, updateSetting, t, isDark, tc, loaded]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
