import ozgunLogo from "@/assets/ozgun-logo-text.png";
import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, ClipboardPen, ListChecks, Inbox, Moon, Sun, PanelLeftClose, PanelLeftOpen, Menu, Settings, HardHat, CloudSun, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldDataProvider, useFieldData } from "@/lib/field-data";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ProjectSettingsProvider, useProjectSettings } from "@/lib/project-settings";
import { AppearanceProvider, useAppearanceSettings } from "@/lib/appearance-settings";
import { LanguageProvider, useI18n, LANGUAGES } from "@/lib/i18n";
import { BackupDialog } from "@/components/backup-dialog";
import { getPendingSubmissionCount } from "@/lib/submissions";


const navigation = [
  { to: "/", label: "Genel Bakış", Icon: LayoutDashboard },
  { to: "/rapor-yaz", label: "İlerleme", Icon: ClipboardPen },
  { to: "/revizyon", label: "Rapor Yönetimi", Icon: ListChecks },
  { to: "/gelen-kutusu", label: "Gelen Kutusu", Icon: Inbox, badge: true },
  { to: "/ayarlar", label: "Ayarlar", Icon: Settings },
] as const;

function Navigation({ collapsed = false, bottom = false, onNavigate }: { collapsed?: boolean; bottom?: boolean; onNavigate?: () => void }) {
  const { t } = useI18n();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setPendingCount(getPendingSubmissionCount());
    const iv = setInterval(() => {
      setPendingCount(getPendingSubmissionCount());
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  return <nav aria-label={bottom ? t("Alt menü") : t("Ana menü")} className={bottom ? "mx-auto grid w-full max-w-4xl grid-cols-5 gap-1 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]" : "space-y-1 px-3"}>
    {navigation.map(({ to, label, Icon, ...rest }) => {
      const isBadge = "badge" in rest && rest.badge;
      return (
        <Button key={to} asChild variant="ghost" className={`w-full text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground ${bottom ? "h-14 min-w-0 flex-col gap-0.5 px-0.5 text-[10px] font-medium sm:h-12 sm:flex-row sm:gap-2 sm:text-sm" : `h-11 text-sm font-medium ${collapsed ? "justify-center px-0" : "justify-start px-3"}`}`}>
          <Link to={to} onClick={onNavigate} title={collapsed ? t(label) : undefined} aria-label={t(label)} activeOptions={{ exact: true }} activeProps={{ className: "bg-sidebar-active text-sidebar-foreground" }}>
            <div className="relative shrink-0 flex items-center justify-center">
              <Icon className="size-5 shrink-0" />
              {isBadge && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground animate-pulse">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </div>
            {!collapsed && <span className={bottom ? "min-w-0 truncate text-center leading-tight text-[10px] sm:text-xs" : ""}>{t(label)}</span>}
          </Link>
        </Button>
      );
    })}
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
              <SidebarFooter collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
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
function SidebarFooter({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { t } = useI18n();
  const { stations, rows, tables } = useFieldData();
  const tableCount = stations * 4 * rows * tables;

  return (
    <div className="mt-auto px-3 pb-5">
      {!collapsed && (
        <div className="mb-4 flex items-center gap-3 border-t border-sidebar-active px-3 pt-5">
          <HardHat className="size-5 text-sidebar-muted" />
          <div className="text-xs leading-5">
            <p className="font-medium">{t("Saha İmalat Takip")}</p>
            <p className="text-sidebar-muted">{t("{s} istasyon · {m} masa", { s: stations, m: tableCount.toLocaleString() })}</p>
          </div>
        </div>
      )}
      <Button
        variant="ghost"
        onClick={onToggle}
        title={collapsed ? t("Menüyü genişlet") : t("Menüyü daralt")}
        aria-label={collapsed ? t("Menüyü genişlet") : t("Menüyü daralt")}
        className="h-11 w-full justify-center text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground"
      >
        {collapsed ? <PanelLeftOpen /> : <><PanelLeftClose /><span>{t("Menüyü daralt")}</span></>}
      </Button>
    </div>
  );
}

/** Header indicators: weather + manual cloud & local backup dialog */
function HeaderIndicators() {
  const { t } = useI18n();

  return (
    <div className="hidden shrink-0 items-center gap-2 lg:flex">
      <BackupDialog />
      
      <div title={t("Saha Hava Durumu")} className="flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-xs text-muted-foreground">
        <CloudSun className="size-4 text-primary" /><span className="font-semibold tabular-nums text-foreground">34°C</span><Wind className="size-3.5" /><span className="tabular-nums">12 km/h</span>
      </div>
    </div>
  );
}