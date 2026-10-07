import ozgunLogo from "@/assets/ozgun-logo-text.png";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import CryptoJS from "crypto-js";
import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, ClipboardPen, ListChecks, Moon, Sun, PanelLeftClose, PanelLeftOpen, Menu, Settings, HardHat, CloudSun, Wind, CloudCheck, CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldDataProvider, useFieldData } from "@/lib/field-data";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ProjectSettingsProvider, useProjectSettings } from "@/lib/project-settings";
import { AppearanceProvider, useAppearanceSettings } from "@/lib/appearance-settings";
import { LanguageProvider, useI18n, LANGUAGES } from "@/lib/i18n";


const navigation = [
  { to: "/", label: "Genel Bakış", Icon: LayoutDashboard },
  { to: "/rapor-yaz", label: "İlerleme", Icon: ClipboardPen },
  { to: "/revizyon", label: "Rapor Yönetimi", Icon: ListChecks },
  { to: "/ayarlar", label: "Ayarlar", Icon: Settings },
] as const;

function Navigation({ collapsed = false, bottom = false, onNavigate }: { collapsed?: boolean; bottom?: boolean; onNavigate?: () => void }) {
  const { t } = useI18n();
  return <nav aria-label={bottom ? t("Alt menü") : t("Ana menü")} className={bottom ? "mx-auto grid w-full max-w-4xl grid-cols-4 gap-1 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" : "space-y-1 px-3"}>
    {navigation.map(({ to, label, Icon }) => <Button key={to} asChild variant="ghost" className={`w-full text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground ${bottom ? "h-14 min-w-0 flex-col gap-1 px-1 text-[11px] font-medium sm:h-12 sm:flex-row sm:gap-2 sm:text-sm" : `h-11 text-sm font-medium ${collapsed ? "justify-center px-0" : "justify-start px-3"}`}`}>
      <Link to={to} onClick={onNavigate} title={collapsed ? t(label) : undefined} aria-label={t(label)} activeOptions={{ exact: true }} activeProps={{ className: "bg-sidebar-active text-sidebar-foreground" }}><Icon className="size-5 shrink-0" />{!collapsed && <span className={bottom ? "min-w-0 whitespace-normal text-center leading-tight" : ""}>{t(label)}</span>}</Link>
    </Button>)}
  </nav>;
}

export function FieldShell({ children }: { children: ReactNode }) {
  return <LanguageProvider><ProjectSettingsProvider><AppearanceProvider><FieldShellContent>{children}</FieldShellContent></AppearanceProvider></ProjectSettingsProvider></LanguageProvider>;
}

function FieldShellContent({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const settings = useProjectSettings();
  const { layout } = useAppearanceSettings();
  const bottom = layout === "bottom";
  const { t, lang, setLang } = useI18n();
  const nextLang = LANGUAGES[(LANGUAGES.findIndex(l => l.value === lang) + 1) % LANGUAGES.length]!.value;
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => { document.documentElement.classList.remove("dark"); };
  }, [dark]);
  return (
    <FieldDataProvider>
      <div className={dark ? "dark" : ""}>
        <div className="min-h-dvh bg-background text-foreground">
          <header className="fixed inset-x-0 top-0 z-40 border-b bg-card">
            <div className="flex min-h-20 items-center gap-3 px-3 py-3 md:px-5 lg:min-h-14 lg:py-1.5">
              {!bottom && <Button variant="ghost" size="icon" className="size-10 shrink-0 md:hidden" aria-label={t("Menüyü aç")} title={t("Menüyü aç")} onClick={() => setMobileMenu(true)}><Menu /></Button>}
              <div className="flex w-24 shrink-0 items-center justify-center rounded-sm bg-brand-surface p-1.5 sm:w-40 md:w-44 lg:w-36 lg:p-1">
                <img src={ozgunLogo} alt="Özgün İnşaat logosu" className="h-auto w-full" />
              </div>
              <div className="min-w-0 flex-1 border-l pl-3 sm:pl-5">
                <h1 className="break-words text-xs font-semibold leading-snug sm:text-base">{settings.project.name}</h1>
                {settings.project.detail && <p className="mt-1 break-words text-xs leading-snug text-muted-foreground sm:text-sm">{settings.project.detail}</p>}
              </div>
              <HeaderIndicators />
              <div className="flex shrink-0 gap-1">
              <Button variant="ghost" onClick={() => setLang(nextLang)} aria-label={t("Dil")} title={t("Dil")} className="h-9 px-2 text-xs font-semibold sm:h-10">{lang.toUpperCase()}</Button>
              <Button variant="ghost" size="icon" onClick={() => setDark(value => !value)} aria-label={t("Tema değiştir")} title={t("Tema değiştir")} className="size-9 sm:size-10">
                {dark ? <Sun /> : <Moon />}
              </Button>
              </div>
            </div>
          </header>
          <div className="enterprise-layout">
            {!bottom && <aside className={`sticky top-0 hidden h-dvh shrink-0 flex-col bg-sidebar pt-24 text-sidebar-foreground md:flex lg:pt-18 ${collapsed ? "w-20" : "w-60"}`}>
              {!collapsed && <p className="px-6 pb-4 text-xs font-medium text-sidebar-muted">{t("SAHA YÖNETİMİ")}</p>}
              <Navigation collapsed={collapsed} />
              <div className="mt-auto px-3 pb-5">
                {!collapsed && <div className="mb-4 flex items-center gap-3 border-t border-sidebar-active px-3 pt-5"><HardHat className="size-5 text-sidebar-muted" /><div className="text-xs leading-5"><p className="font-medium">{t("Saha İmalat Takip")}</p><p className="text-sidebar-muted">{t("36 istasyon · 10.368 masa")}</p></div></div>}
                <Button variant="ghost" onClick={() => setCollapsed(value => !value)} title={collapsed ? t("Menüyü genişlet") : t("Menüyü daralt")} aria-label={collapsed ? t("Menüyü genişlet") : t("Menüyü daralt")} className="h-11 w-full justify-center text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground">{collapsed ? <PanelLeftOpen /> : <><PanelLeftClose /><span>{t("Menüyü daralt")}</span></>}</Button>
              </div>
            </aside>}
            <main className={`flex min-w-0 flex-1 flex-col px-4 pt-28 sm:px-6 lg:px-6 lg:pt-20 ${bottom ? "pb-[calc(6rem_+_env(safe-area-inset-bottom))]" : "pb-0"}`}><div className={`min-h-[calc(100dvh-11rem)] ${bottom ? "w-full" : "mx-auto w-full max-w-6xl lg:max-w-none"}`}>{children}</div><footer className="mt-32 py-4 text-center text-[10px] font-light tracking-widest text-muted-foreground/40"><p>{t("© 2026 | Designed By OUZ51 | Tüm hakları saklıdır.")}</p></footer></main>
          </div>
          {!bottom && <Sheet open={mobileMenu} onOpenChange={setMobileMenu}><SheetContent side="left" className="w-72 border-sidebar-active bg-sidebar px-0 pt-12 text-sidebar-foreground"><SheetTitle className="mb-6 px-6 text-sm text-sidebar-foreground">{t("Saha Yönetimi")}</SheetTitle><Navigation onNavigate={() => setMobileMenu(false)} /></SheetContent></Sheet>}
          {bottom && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-active bg-sidebar text-sidebar-foreground"><Navigation bottom /></div>}
        </div>
      </div>
    </FieldDataProvider>
  );
}
/** Desktop-only status chips: dummy site weather + local sync state. */
function HeaderIndicators() {
  const { t } = useI18n();
  const { pendingCount } = useFieldData();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'downloading'>('idle');
  const [lastSyncedHash, setLastSyncedHash] = useState('');

  // Is this running in electron?
  const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');

  const fetchCloudData = async (isStartup = false) => {
    setSyncStatus('downloading');
    try {
      const { data, error } = await supabase.from('sync_store').select('value').eq('key', 'device-demo').single();
      if (error) throw error;
      
      if (data && data.value) {
        // Decrypt payload
        try {
          if (typeof data.value === 'string' && data.value.startsWith('U2FsdGVk')) {
            const bytes = CryptoJS.AES.decrypt(data.value, "OzgunInsaat2026SahaTakip$!");
            data.value = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          }
        } catch(e) { console.error("Decryption failed", e); }

        if (!isElectron) {
          // Mobil uygulama SADECE kilitleri indirir (cunku sahadaki veriler ezelden beridir mobilin kendisindedir, offline veri kaybolmasin diye progress indirilmez)
          if (data.value.locked) localStorage.setItem("ges-locked-v1", data.value.locked);
        } else {
          // PC uygulamasi tum verileri indirir
          if (data.value.progress) localStorage.setItem("ges-progress-v1", data.value.progress);
          if (data.value.locked) localStorage.setItem("ges-locked-v1", data.value.locked);
          if (data.value.faults) localStorage.setItem("ges-faults", data.value.faults);
          if (data.value.settings) localStorage.setItem("ges-settings", data.value.settings);
          if (data.value.teams) localStorage.setItem("ges-teams", data.value.teams);
        }
        
        if (!isStartup) toast.success("Veriler yenilendi!");
        setTimeout(() => window.location.reload(), isStartup ? 100 : 800);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (!isStartup) toast.error("Buluttan veri cekilemedi.");
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    // Tum cihazlarda ilk acilista calisir.
    // PC tum veriyi cekerken, Mobil sadece merkezden gelen 'kilitleri' ceker
    if (!sessionStorage.getItem('startupSyncDone')) {
      sessionStorage.setItem('startupSyncDone', 'true');
      fetchCloudData(true);
    }
  }, [isElectron]);

  useEffect(() => {
    const payloadStr = JSON.stringify({
      progress: localStorage.getItem("ges-progress-v1"),
      faults: localStorage.getItem("ges-faults"),
      settings: localStorage.getItem("ges-settings"),
      teams: localStorage.getItem("ges-teams"),
      locked: localStorage.getItem("ges-locked-v1")
    });

    if (payloadStr === lastSyncedHash) return;
    if (pendingCount > 0) return;

    const autoSync = async () => {
      if (syncStatus === 'downloading') return;
      setSyncStatus('syncing');
      try {
        
        // Encrypt payload
        const encryptedPayload = CryptoJS.AES.encrypt(payloadStr, "OzgunInsaat2026SahaTakip$!").toString();

        const { error } = await supabase
          .from('sync_store')
          .upsert({ 
            key: 'device-demo', 
            value: encryptedPayload, // Save as encrypted string instead of JSON object
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        setSyncStatus('idle');
        setLastSyncedHash(payloadStr);
      } catch (err) {
        console.error("Auto-sync error:", err);
        setSyncStatus('error');
      }
    };

    const timer = setTimeout(autoSync, 2000);
    return () => clearTimeout(timer);
  }, [pendingCount, lastSyncedHash, syncStatus]);


  return <div className="hidden shrink-0 items-center gap-2 lg:flex">
    {isElectron && (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => fetchCloudData(false)}
        disabled={syncStatus === 'downloading'}
        className={`h-8 gap-1.5 px-2.5 text-xs font-medium ${syncStatus === 'downloading' ? 'animate-pulse opacity-50' : ''}`}
        title="Verileri Yenile"
      >
        <RefreshCw className={`size-4 text-primary ${syncStatus === 'downloading' ? 'animate-spin' : ''}`} />
        <span>Yenile</span>
      </Button>
    )}
    
    <div title={t("Saha Hava Durumu")} className="flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-xs text-muted-foreground">
      <CloudSun className="size-4 text-primary" /><span className="font-semibold tabular-nums text-foreground">34°C</span><Wind className="size-3.5" /><span className="tabular-nums">12 km/h</span>
    </div>
    
    <div 
      title={syncStatus === 'syncing' ? "Buluta gönderiliyor..." : syncStatus === 'error' ? "Eşitleme Hatası" : pendingCount > 0 ? "Kaydedilmeyi Bekliyor" : "Bulutla Eşitlendi"} 
      className={`flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-xs font-medium 
        ${syncStatus === 'syncing' ? 'text-blue-500 animate-pulse' : syncStatus === 'error' ? 'text-destructive' : pendingCount > 0 ? 'text-amber-500' : 'text-success'}`}
    >
      {syncStatus === 'syncing' ? <CloudUpload className="size-4" /> : 
       syncStatus === 'error' ? <CloudUpload className="size-4" /> : 
       pendingCount > 0 ? <CloudUpload className="size-4" /> : 
       <CloudCheck className="size-4" />}
      
      <span>
        {syncStatus === 'syncing' ? "Eşitleniyor..." : 
         syncStatus === 'error' ? "Bağlantı Yok" : 
         pendingCount > 0 ? `Taslak (${pendingCount})` : "Eşitlendi"}
      </span>
    </div>
  </div>;
}