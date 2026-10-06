import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type MenuLayout = "sidebar" | "bottom";
export const APPEARANCE_STORAGE_KEY = "ges-menu-layout-v1";

export function parseMenuLayout(raw: string | null): MenuLayout {
  return raw === "bottom" ? "bottom" : "sidebar";
}

interface AppearanceSettings {
  layout: MenuLayout;
  ready: boolean;
  error: string;
  setLayout: (next: MenuLayout) => void;
}

const AppearanceContext = createContext<AppearanceSettings | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [layout, setLayoutState] = useState<MenuLayout>("sidebar");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    try { setLayoutState(parseMenuLayout(localStorage.getItem(APPEARANCE_STORAGE_KEY))); }
    catch { setError("Görünüm ayarlarına bu cihazda erişilemiyor."); }
    setReady(true);
  }, []);
  function setLayout(next: MenuLayout) {
    setLayoutState(next);
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, next);
      setError("");
    } catch { setError("Menü seçimi bu cihazda saklanamadı. Cihaz depolamasını kontrol edin."); }
  }
  return <AppearanceContext.Provider value={{ layout, ready, error, setLayout }}>{children}</AppearanceContext.Provider>;
}

export function useAppearanceSettings() {
  const settings = useContext(AppearanceContext);
  if (!settings) throw new Error("AppearanceProvider is required.");
  return settings;
}