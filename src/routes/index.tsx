import { createFileRoute } from "@tanstack/react-router";
import { FieldProgress } from "@/components/field-progress";
import { ITEMS, STATIONS, ZONES, ROWS, TABLES, pct, textTone, useFieldData } from "@/lib/field-data";
import { exportProgressExcel } from "@/lib/excel-export";
import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, Layers, Building2, CircleDashed, Gauge } from "lucide-react";
import { ProgressBarChart } from "@/components/progress-bar-chart";
import { QuoteOfDay } from "@/components/quote-of-day";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Genel Bakış — GES Saha İmalat Takip" },
    { name: "description", content: "GES sahasının genel tamamlanma oranı, biten istasyonlar ve imalat kalemlerinin ilerleme özeti." },
    { property: "og:title", content: "Genel Bakış — GES Saha İmalat Takip" },
    { property: "og:description", content: "36 istasyonun imalat ilerlemesi ve saha tamamlanma yüzdeleri." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const { data, overall, stationPct, completeTables } = useFieldData();
  const [exporting, setExporting] = useState(false);
  const { t, locale } = useI18n();
  const overallPct = pct(overall.done, overall.total);
  const tableCount = STATIONS * ZONES.length * ROWS * TABLES;
  async function handleExport() {
    setExporting(true);
    const id = toast.loading(t("İlerleme raporu hazırlanıyor…"));
    try {
      const count = await exportProgressExcel(data);
      toast.success(t("Rapor indirildi"), { id, description: t("saha_genel_ilerleme.xlsx — {n} masa listelendi.", { n: count.toLocaleString(locale) }) });
    } catch {
      toast.error(t("Rapor oluşturulamadı"), { id, description: t("Lütfen tekrar deneyin.") });
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl font-semibold">{t("Genel Bakış")}</h2>
      </div>
      <QuoteOfDay />
      <section aria-labelledby="overall-heading" className="space-y-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <h3 id="overall-heading" className="text-base font-semibold">{t("Genel Tamamlanma")}</h3>
          <span className={`font-display text-4xl font-semibold leading-none ${textTone(overallPct)}`}>%{overallPct}</span>
        </div>
        <FieldProgress value={overallPct} height="h-3" label={t("Genel Tamamlanma")} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3">
          <div className="hidden lg:block"><Metric icon={Gauge} label={t("Genel Tamamlanma")} value={`%${overallPct}`} sub="" /></div>
          <Metric icon={Layers} label={t("Tamamlanan Masa")} value={completeTables.toLocaleString(locale)} sub={`/ ${tableCount.toLocaleString(locale)}`} />
          <Metric icon={Building2} label={t("Biten İstasyon")} value={String(stationPct.filter(value => value >= 100).length)} sub="/ 36" />
          <Metric icon={CircleDashed} label={t("Başlamamış İst.")} value={String(stationPct.filter(value => value === 0).length)} sub="/ 36" />
        </div>
      </section>
      <div className="border-t border-border pt-6 lg:grid lg:grid-cols-2 lg:gap-6">
      <section aria-labelledby="items-heading">
        <h3 id="items-heading" className="mb-4 text-base font-semibold">{t("İmalat İlerlemesi")}</h3>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:gap-y-3">
          {ITEMS.map((item, index) => {
            const total = item.target * tableCount;
            const done = overall.per[index] ?? 0;
            const progress = pct(done, total);
            return <div key={item.name} className="border-b pb-5 lg:pb-3">
              <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <span className="text-sm font-semibold">{t(item.name)}</span>
                <span className={`text-sm font-semibold ${textTone(progress)}`}>%{progress}</span>
              </div>
              <FieldProgress value={progress} label={`${t(item.name)} ${t("ilerleme")}`} />
              <p className="mt-1 text-xs text-muted-foreground">{done.toLocaleString(locale)} / {total.toLocaleString(locale)} {t("adet")}</p>
            </div>;
          })}
        </div>
      </section>
      <section aria-label={t("Kalem Bazlı İlerleme")} className="hidden rounded-md border bg-card p-4 shadow-sm lg:block">
        <h3 className="mb-3 text-base font-semibold">{t("Kalem Bazlı İlerleme")}</h3>
        <ProgressBarChart data={[{ name: t("Genel %"), value: overallPct }, ...ITEMS.map((item, index) => ({ name: t(item.name), value: pct(overall.per[index] ?? 0, item.target * tableCount) }))]} />
      </section>
      </div>
      <div className="flex justify-center pt-2 md:justify-end">
        <Button onClick={handleExport} disabled={exporting} className="min-h-12 w-full px-5 text-base font-semibold md:w-auto md:text-sm md:font-medium">
          {exporting ? <Loader2 className="size-5 animate-spin" /> : <FileSpreadsheet className="size-5" />}
          <span className="leading-tight">{t("İlerleme Raporu (Excel)")}</span>
        </Button>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub }: { icon: typeof Layers; label: string; value: string; sub: string }) {
  return <div className="min-w-0 rounded-md border bg-card p-5 shadow-sm lg:p-3">
    <div className="mb-4 flex items-center justify-between gap-2 lg:mb-2"><span className="text-sm font-medium text-muted-foreground">{label}</span><Icon className="size-5 text-primary" /></div>
    <div className="flex flex-wrap items-baseline gap-2"><span className="text-3xl font-semibold tabular-nums">{value}</span><span className="whitespace-nowrap text-sm text-muted-foreground">{sub}</span></div>
  </div>;
}
