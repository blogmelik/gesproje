import React from 'react';
import { createFileRoute } from "@tanstack/react-router";
import { Save, PanelLeft, PanelBottom, Lock, DownloadCloud, LogOut, Database, Sliders } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjectSettings } from "@/lib/project-settings";
import { useAppearanceSettings } from "@/lib/appearance-settings";
import { useI18n, LANGUAGES, type Language } from "@/lib/i18n";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFieldData, type SiteConfig } from "@/lib/field-data";
import { BackupDialog } from "@/components/backup-dialog";
import { APP_VERSION, BUILD_NUMBER, RELEASE_DATE } from "@/lib/version";

export const Route = createFileRoute("/ayarlar")({
  head: () => ({ meta: [
    { title: "Genel Ayarlar — GES Saha İmalat Takip" },
    { name: "description", content: "Saha projesinin adını ve detayını düzenleyin, yan veya alt menü görünümünü seçin." },
    { property: "og:title", content: "Genel Ayarlar — GES Saha İmalat Takip" },
    { property: "og:description", content: "Proje bilgileri ve menü görünümü için genel saha ayarları." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { project, ready, error, update, save } = useProjectSettings();
  const appearance = useAppearanceSettings();
  const { t, lang, setLang } = useI18n();
  const { siteConfig, updateSiteConfig } = useFieldData();
  const [newPin, setNewPin] = React.useState("");

  const isElectron = typeof window !== 'undefined' && 
    (window.navigator.userAgent.toLowerCase().includes("electron") || window.location.protocol === "app:");

  // Site configuration form state
  const [siteForm, setSiteForm] = React.useState<SiteConfig>(siteConfig);

  React.useEffect(() => {
    setSiteForm(siteConfig);
  }, [siteConfig]);

  const handleSaveSiteParams = () => {
    updateSiteConfig(siteForm);
    toast.success("Saha imalat parametreleri başarıyla güncellendi!");
  };

  const updatePin = () => {
    if (newPin.length < 4) {
      toast.error("PIN en az 4 haneli olmalıdır.");
      return;
    }
    localStorage.setItem("ges-app-pin", newPin);
    toast.success("PIN kodu başarıyla güncellendi.");
    setNewPin("");
  };

  const handleLockDevice = () => {
    localStorage.removeItem("ges-unlocked-device");
    sessionStorage.removeItem("ges-unlocked");
    window.location.reload();
  };

  const updateUrl = isElectron 
    ? "https://github.com/blogmelik/gesproje/releases/download/latest-win/SahaTakip-Masaustu-Guncel.exe"
    : "https://raw.githubusercontent.com/blogmelik/gesproje/builds/release/SahaTakip-Guncel.apk";

  const checkUpdates = (e?: React.MouseEvent) => {
    e?.preventDefault();
    try {
      if (typeof window !== "undefined") {
        const electron = (window as unknown as { require?: (mod: string) => { shell?: { openExternal: (url: string) => void } } }).require?.("electron");
        if (electron?.shell?.openExternal) {
          electron.shell.openExternal(updateUrl);
          toast.success("Güncelleme indirme bağlantısı tarayıcınızda açıldı.");
          return;
        }
      }
    } catch { /* ignore */ }

    if ((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()) {
      window.open(updateUrl, "_system");
      toast.success("İndirme işlemi mobil tarayıcınızda başlatıldı.");
      return;
    }

    const a = document.createElement("a");
    a.href = updateUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("İndirme işlemi başlatıldı.");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">{t("Genel Ayarlar")}</h2>

      {/* Dil Seçimi */}
      <section aria-labelledby="language-heading" className="max-w-2xl space-y-5">
        <h3 id="language-heading" className="text-xl font-semibold">{t("Dil Seçimi")}</h3>
        <RadioGroup aria-label={t("Dil Seçimi")} value={lang} onValueChange={value => setLang(value as Language)} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LANGUAGES.map(({ value, label }) => (
            <Label key={value} htmlFor={`lang-${value}`} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-md border p-4 text-base ${lang === value ? "border-primary bg-accent text-accent-foreground" : "bg-card text-card-foreground"}`}>
              <RadioGroupItem id={`lang-${value}`} value={value} className="shrink-0" />
              <span className="font-semibold text-primary">{value.toUpperCase()}</span>
              <span className="min-w-0">{label}</span>
            </Label>
          ))}
        </RadioGroup>
      </section>

      {/* Proje Bilgileri */}
      <form className="max-w-2xl space-y-6 rounded-md border bg-card p-5 text-card-foreground shadow-sm sm:p-7" onSubmit={event => {
        event.preventDefault();
        if (save(project)) toast.success(t("Ayarlar kaydedildi"));
      }}>
        <div className="space-y-2">
          <Label htmlFor="project-name">{t("Proje Adı")}</Label>
          <Input id="project-name" className="h-12 text-base" required maxLength={120} disabled={!ready} value={project.name} onChange={event => update({ ...project, name: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-detail">{t("Proje Detayı")}</Label>
          <Input id="project-detail" className="h-12 text-base" maxLength={180} disabled={!ready} placeholder="50MW Kapasite - Faz 1" value={project.detail} onChange={event => update({ ...project, detail: event.target.value })} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
        <div className="flex justify-end border-t pt-5">
          <Button type="submit" className="h-11 min-w-32" disabled={!ready || !project.name.trim()}><Save className="size-4" />{t("Kaydet")}</Button>
        </div>
      </form>

      {/* Saha & İmalat Parametreleri (Masaüstü / Yönetici Paneli) */}
      <section className="max-w-2xl space-y-5 rounded-md border bg-card p-5 text-card-foreground shadow-sm sm:p-7">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Sliders className="size-5 text-primary" />
              Saha İmalat Parametreleri {isElectron && "(Yönetici)"}
            </h3>
            <p className="text-sm text-muted-foreground">
              İstasyon, sıra, masa sayıları ile masa başına düşen montaj hedef adetlerini manuel olarak belirleyin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="param-stations" className="text-xs font-semibold">İstasyon Sayısı</Label>
            <Input
              id="param-stations"
              type="number"
              min={1}
              max={200}
              value={siteForm.stations}
              onChange={e => setSiteForm({ ...siteForm, stations: Number(e.target.value) })}
              className="h-11 font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="param-rows" className="text-xs font-semibold">Sıra Sayısı (Bölge Başına)</Label>
            <Input
              id="param-rows"
              type="number"
              min={1}
              max={100}
              value={siteForm.rows}
              onChange={e => setSiteForm({ ...siteForm, rows: Number(e.target.value) })}
              className="h-11 font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="param-tables" className="text-xs font-semibold">Masa Sayısı (Sıra Başına)</Label>
            <Input
              id="param-tables"
              type="number"
              min={1}
              max={50}
              value={siteForm.tables}
              onChange={e => setSiteForm({ ...siteForm, tables: Number(e.target.value) })}
              className="h-11 font-semibold"
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            1 Masa İçin Hedef Montaj Adetleri
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            <div className="space-y-1.5">
              <Label htmlFor="param-kolon" className="text-xs font-medium">Kolon Sayısı</Label>
              <Input
                id="param-kolon"
                type="number"
                min={1}
                value={siteForm.kolonTarget}
                onChange={e => setSiteForm({ ...siteForm, kolonTarget: Number(e.target.value) })}
                className="h-10 text-center font-bold text-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="param-asik" className="text-xs font-medium">Aşık Sayısı</Label>
              <Input
                id="param-asik"
                type="number"
                min={1}
                value={siteForm.asikTarget}
                onChange={e => setSiteForm({ ...siteForm, asikTarget: Number(e.target.value) })}
                className="h-10 text-center font-bold text-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="param-kiris" className="text-xs font-medium">Kiriş Sayısı</Label>
              <Input
                id="param-kiris"
                type="number"
                min={1}
                value={siteForm.kirisTarget}
                onChange={e => setSiteForm({ ...siteForm, kirisTarget: Number(e.target.value) })}
                className="h-10 text-center font-bold text-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="param-payanda" className="text-xs font-medium">Payanda Sayısı</Label>
              <Input
                id="param-payanda"
                type="number"
                min={1}
                value={siteForm.payandaTarget}
                onChange={e => setSiteForm({ ...siteForm, payandaTarget: Number(e.target.value) })}
                className="h-10 text-center font-bold text-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="param-panel" className="text-xs font-medium">Panel Sayısı</Label>
              <Input
                id="param-panel"
                type="number"
                min={1}
                value={siteForm.panelTarget}
                onChange={e => setSiteForm({ ...siteForm, panelTarget: Number(e.target.value) })}
                className="h-10 text-center font-bold text-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={handleSaveSiteParams} className="gap-2">
            <Save className="size-4" />
            Parametreleri Güncelle ve Kaydet
          </Button>
        </div>
      </section>

      {/* Görünüm Ayarları */}
      <section aria-labelledby="appearance-heading" className="max-w-2xl space-y-5 border-t pt-6">
        <h3 id="appearance-heading" className="text-xl font-semibold">{t("Görünüm Ayarları")}</h3>
        <RadioGroup aria-label={t("Menü yapısı")} value={appearance.layout} disabled={!appearance.ready} onValueChange={value => {
          if (value === "sidebar" || value === "bottom") appearance.setLayout(value);
        }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {([{ value: "sidebar", label: "Yan Menü", Icon: PanelLeft }, { value: "bottom", label: "Alt Menü", Icon: PanelBottom }] as const).map(({ value, label, Icon }) => (
            <Label key={value} htmlFor={`layout-${value}`} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-md border p-4 text-base ${appearance.layout === value ? "border-primary bg-accent text-accent-foreground" : "bg-card text-card-foreground"}`}>
              <RadioGroupItem id={`layout-${value}`} value={value} className="shrink-0" />
              <Icon className="size-5 shrink-0 text-primary" />
              <span className="min-w-0">{t(label)}</span>
            </Label>
          ))}
        </RadioGroup>
        {appearance.error && <p role="alert" className="text-sm text-destructive">{appearance.error}</p>}
      </section>

      {/* Masaüstü Merkez Güvenlik Ayarları */}
      {isElectron && (
        <section className="max-w-2xl space-y-5 mt-10 p-6 border border-destructive/20 bg-destructive/5 rounded-lg">
          <div className="flex items-center gap-3 mb-4 text-destructive">
            <Lock className="size-6" />
            <h3 className="text-xl font-semibold">Güvenlik Ayarları (Merkez Yetkisi)</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Bu şifre, uygulamayı telefonda açan herkes için geçerli olacaktır. Sadece yetkili bilgisayardan değiştirilebilir.</p>
          <div className="flex gap-4 items-center">
            <Input 
              type="password" 
              placeholder="Yeni PIN Kodunu Girin" 
              value={newPin} 
              onChange={(e) => setNewPin(e.target.value)} 
              className="max-w-[200px]"
            />
            <Button variant="destructive" onClick={updatePin}>PIN Kodunu Güncelle</Button>
          </div>
        </section>
      )}

      {/* Yedekleme & Geri Yükleme */}
      <section className="max-w-2xl space-y-5 mt-10 p-6 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="size-5 text-primary" />
              Yedekleme & Geri Yükleme
            </h3>
            <p className="text-sm text-muted-foreground">Tüm saha verilerini Google Firebase bulutuna veya çevrimdışı dosya (.ges) olarak yedekleyin.</p>
          </div>
          <BackupDialog>
            <Button className="shrink-0 gap-2">
              <Database className="size-4" />
              Yedekleme Menüsü
            </Button>
          </BackupDialog>
        </div>
      </section>

      {/* Sistem Güncellemesi */}
      <section className="max-w-2xl space-y-5 mt-6 p-6 border rounded-lg bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DownloadCloud className="size-5 text-primary" />
              Sistem Güncellemesi
            </h3>
            <p className="text-sm text-muted-foreground">
              {isElectron 
                ? "Windows Masaüstü uygulamasının (.exe) en son güncel sürümünü indirin."
                : "Android Mobil uygulamasının (.apk) en son güncel sürümünü indirin."}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                v{APP_VERSION} (Derleme: #{BUILD_NUMBER})
              </span>
              <span className="text-xs text-muted-foreground">Tarih: {RELEASE_DATE}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={checkUpdates} className="shrink-0 gap-2">
              <DownloadCloud className="size-4" />
              Güncellemeyi İndir
            </Button>
            <a
              href={updateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline hover:text-primary/80 shrink-0"
              title="Doğrudan Tarayıcı İndirme Linki"
            >
              Doğrudan İndir
            </a>
          </div>
        </div>
      </section>

      {/* Oturumu Kapat / Kilitle */}
      <section className="max-w-2xl space-y-5 mt-6 p-6 border border-border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <LogOut className="size-5 text-muted-foreground" />
              Oturumu Kapat / Kilitle
            </h3>
            <p className="text-sm text-muted-foreground">Uygulamayı PIN korumalı kilit ekranına döndürür.</p>
          </div>
          <Button variant="outline" onClick={handleLockDevice} className="shrink-0 gap-2">
            <LogOut className="size-4" />
            Kilitle
          </Button>
        </div>
      </section>
    </div>
  );
}
