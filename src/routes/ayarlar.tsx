import { createFileRoute } from "@tanstack/react-router";
import { Save, PanelLeft, PanelBottom } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjectSettings } from "@/lib/project-settings";
import { useAppearanceSettings } from "@/lib/appearance-settings";
import { useI18n, LANGUAGES, type Language } from "@/lib/i18n";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  return <div className="space-y-6">
    <h2 className="text-2xl font-semibold">{t("Genel Ayarlar")}</h2>
    <section aria-labelledby="language-heading" className="max-w-2xl space-y-5">
      <h3 id="language-heading" className="text-xl font-semibold">{t("Dil Seçimi")}</h3>
      <RadioGroup aria-label={t("Dil Seçimi")} value={lang} onValueChange={value => setLang(value as Language)} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {LANGUAGES.map(({ value, label }) => <Label key={value} htmlFor={`lang-${value}`} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-md border p-4 text-base ${lang === value ? "border-primary bg-accent text-accent-foreground" : "bg-card text-card-foreground"}`}>
          <RadioGroupItem id={`lang-${value}`} value={value} className="shrink-0" />
          <span className="font-semibold text-primary">{value.toUpperCase()}</span>
          <span className="min-w-0">{label}</span>
        </Label>)}
      </RadioGroup>
    </section>
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
        <Button type="submit" className="h-11 min-w-32" disabled={!ready || !project.name.trim()}><Save />{t("Kaydet")}</Button>
      </div>
    </form>
    <section aria-labelledby="appearance-heading" className="max-w-2xl space-y-5 border-t pt-6">
      <h3 id="appearance-heading" className="text-xl font-semibold">{t("Görünüm Ayarları")}</h3>
      <RadioGroup aria-label={t("Menü yapısı")} value={appearance.layout} disabled={!appearance.ready} onValueChange={value => {
        if (value === "sidebar" || value === "bottom") appearance.setLayout(value);
      }} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {([{ value: "sidebar", label: "Yan Menü", Icon: PanelLeft }, { value: "bottom", label: "Alt Menü", Icon: PanelBottom }] as const).map(({ value, label, Icon }) => <Label key={value} htmlFor={`layout-${value}`} className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-md border p-4 text-base ${appearance.layout === value ? "border-primary bg-accent text-accent-foreground" : "bg-card text-card-foreground"}`}>
          <RadioGroupItem id={`layout-${value}`} value={value} className="shrink-0" />
          <Icon className="size-5 shrink-0 text-primary" />
          <span className="min-w-0">{t(label)}</span>
        </Label>)}
      </RadioGroup>
      {appearance.error && <p role="alert" className="text-sm text-destructive">{appearance.error}</p>}
    </section>
  </div>;
}