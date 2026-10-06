import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronRight, Minus, Plus, Check, TriangleAlert, Save } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppearanceSettings } from "@/lib/appearance-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldProgress } from "@/components/field-progress";
import { FaultReportDialog } from "@/components/fault-report-dialog";
import { DesktopProgressPane } from "@/components/desktop-progress-pane";
import { useFaultReports } from "@/lib/fault-reports";
import { useI18n } from "@/lib/i18n";
import { ITEMS, STATIONS, ZONES, ROWS, TABLES, TABLE_TOTAL, tableKey, pct, textTone, sumRange, useFieldData } from "@/lib/field-data";

export const Route = createFileRoute("/rapor-yaz")({
  head: () => ({ meta: [
    { title: "İlerleme — GES Saha İmalat Takip" },
    { name: "description", content: "İstasyon, bölge ve sıra seçerek dört masanın kolon, kiriş, payanda, aşık ve panel imalat miktarlarını girin." },
    { property: "og:title", content: "İlerleme — GES Saha İmalat Takip" },
    { property: "og:description", content: "GES saha imalatları için istasyon, bölge, sıra ve masa bazında veri girişi." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ReportPage,
});

function ReportPage() {
  const { draftData: data, stationPct, stageItem: setItem, pendingCount, saveChanges } = useFieldData();
  const { layout } = useAppearanceSettings();
  const faults = useFaultReports();
  const { t } = useI18n();
  const [selectedFault, setSelectedFault] = useState<{ id: string; label: string } | null>(null);
  const [station, setStation] = useState<number | null>(null);
  const [zone, setZone] = useState<number | null>(null);
  const [row, setRow] = useState<number | null>(null);
  const step = station === null ? 1 : zone === null ? 2 : row === null ? 3 : 4;
  const title = t(step === 1 ? "İstasyon Seçimi" : step === 2 ? "Bölge Seçimi" : step === 3 ? "Sıra Seçimi" : "Masa İmalatları");
  function backTo(level: number) {
    if (level <= 1) setStation(null);
    if (level <= 2) setZone(null);
    setRow(null);
  }
  function prefixPct(prefix: string) {
    const summary = sumRange(data, key => key.startsWith(prefix));
    return pct(summary.done, summary.total);
  }
  return <div className={`space-y-5 ${pendingCount ? "pb-20" : ""}`}>
    {pendingCount > 0 && <div className={`fixed right-4 z-30 sm:right-6 ${layout === "bottom" ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(1rem+env(safe-area-inset-bottom))]"}`}>
      <Button className="h-12 px-6 shadow-sm" onClick={() => { saveChanges(); toast.success(t("İlerleme kaydedildi")); }}><Save className="size-5" />{t("Kayıt et")}</Button>
    </div>}
    {selectedFault && <FaultReportDialog key={selectedFault.id} context={selectedFault} initial={faults.reports[selectedFault.id]} storageError={faults.error} onSave={faults.save} onClose={() => setSelectedFault(null)} />}
    {faults.error && !selectedFault && <p role="alert" className="text-sm font-semibold text-destructive">{faults.error}</p>}
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h2 className="text-2xl font-semibold">{t("İlerleme")}</h2>
      <span className="text-sm font-semibold text-muted-foreground lg:hidden">{t("Adım {n} / 4", { n: step })}</span>
    </div>
    <div className="hidden lg:block">
      <DesktopProgressPane data={data} stationPct={stationPct} station={station} zone={zone} row={row}
        onSelect={(s, z, r) => { setStation(s); setZone(z); setRow(r); }} setItem={setItem}
        reported={id => Boolean(faults.reports[id])} faultsReady={faults.ready} onFault={(id, label) => setSelectedFault({ id, label })} />
    </div>
    <div className="space-y-5 lg:hidden">
    {station !== null && <div className="grid grid-cols-2 gap-3">
      <div className="min-w-0 space-y-1.5"><label id="station-label" className="text-xs font-medium text-muted-foreground">{t("İstasyon")}</label>
        <Select value={String(station)} onValueChange={value => setStation(Number(value))}>
          <SelectTrigger aria-labelledby="station-label" className="h-11 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>{Array.from({ length: STATIONS }, (_, index) => <SelectItem key={index} value={String(index)}>{t("İstasyon {n}", { n: index + 1 })}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="min-w-0 space-y-1.5"><label id="zone-label" className="text-xs font-medium text-muted-foreground">{t("Bölge")}</label>
        <Select value={zone === null ? "" : String(zone)} onValueChange={value => setZone(Number(value))}>
          <SelectTrigger aria-labelledby="zone-label" className="h-11 bg-card"><SelectValue placeholder={t("Bölge Seçimi")} /></SelectTrigger>
          <SelectContent>{ZONES.map((name, index) => <SelectItem key={name} value={String(index)}>{t("Bölge {n}", { n: name })}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>}
    {station !== null && <nav aria-label={t("Seçim yolu")} className="flex flex-wrap items-center gap-1 border-b border-border pb-3">
      <Button variant="ghost" onClick={() => backTo(1)} className="h-11 px-2 text-base font-semibold">{t("İstasyonlar")}</Button>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      <Button variant="ghost" onClick={() => backTo(2)} className="h-11 px-2 text-base font-semibold">{t("İstasyon {n}", { n: station + 1 })}</Button>
      {zone !== null && <><ChevronRight className="size-4 shrink-0 text-muted-foreground" /><Button variant="ghost" onClick={() => backTo(3)} className="h-11 px-2 text-base font-semibold">{t("Bölge {n}", { n: ZONES[zone] ?? "" })}</Button></>}
      {row !== null && <><ChevronRight className="size-4 shrink-0 text-muted-foreground" /><span aria-current="step" className="px-2 py-3 font-semibold">{t("Sıra {n}", { n: row + 1 })}</span></>}
    </nav>}
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h3 className="min-w-0 text-2xl font-semibold">{title}</h3>
      {step > 1 && <Button variant="outline" onClick={() => backTo(step - 1)} className="h-11 shrink-0 border px-3 font-semibold"><ArrowLeft />{t("Geri Dön")}</Button>}
    </div>
    {step === 1 && <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: STATIONS }, (_, index) => <SelectionCard key={index} label={t("İstasyon {n}", { n: index + 1 })} number={String(index + 1)} caption={t("İstasyon")} progress={stationPct[index] ?? 0} onClick={() => setStation(index)} />)}
    </div>}
    {step === 2 && <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {ZONES.map((name, index) => <SelectionCard key={name} label={t("Bölge {n}", { n: name })} number={name} caption={t("Bölge")} progress={prefixPct(`${station}-${index}-`)} onClick={() => setZone(index)} />)}
    </div>}
    {step === 3 && <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {Array.from({ length: ROWS }, (_, index) => <SelectionCard key={index} label={t("Sıra {n}", { n: index + 1 })} number={String(index + 1)} caption={t("Sıra")} progress={prefixPct(`${station}-${zone}-${index}-`)} onClick={() => setRow(index)} />)}
    </div>}
    {station !== null && zone !== null && row !== null && <div className="grid items-start gap-5 md:grid-cols-2">
      {Array.from({ length: TABLES }, (_, table) => {
        const key = tableKey(station, zone, row, table);
        const values = data[key] ?? [];
        const tableName = t("Masa {n}", { n: table + 1 });
        const totalPct = pct(values.reduce((sum, value) => sum + value, 0), TABLE_TOTAL);
        return <article key={key} aria-label={tableName} className="min-w-0 rounded-md border border-border bg-card">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-muted px-4 py-3">
            <h4 className="font-display text-2xl font-semibold">{tableName}</h4>
            <span className={`text-xl font-semibold ${textTone(totalPct)}`}>%{totalPct}</span>
          </header>
          <div className="divide-y divide-border px-4">
            {ITEMS.map((item, index) => {
              const value = values[index] ?? 0;
              const progress = pct(value, item.target);
              const inputId = `quantity-${key}-${index}`;
              return <div key={item.name} className="space-y-3 py-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <label htmlFor={inputId} className="font-display text-xl font-semibold">{t(item.name)}</label>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 font-semibold ${textTone(progress)}`}>{progress === 100 && <Check className="size-4" />}%{progress}</span>
                    <Button variant="outline" size="icon" disabled={!faults.ready} title={t("Hata Bildir")} aria-label={`${tableName} ${t(item.name)} ${t("Hata Bildir")}`} data-reported={Boolean(faults.reports[`${key}-${index}`])} onClick={() => setSelectedFault({ id: `${key}-${index}`, label: `${t("İstasyon {n}", { n: station + 1 })} · ${t("Bölge {n}", { n: ZONES[zone] ?? "" })} · ${t("Sıra {n}", { n: row + 1 })} · ${tableName} · ${t(item.name)}` })} className={`size-11 border ${faults.reports[`${key}-${index}`] ? "border-destructive text-destructive hover:text-destructive" : "text-muted-foreground"}`}><TriangleAlert className="size-5" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-2">
                  <Button variant="outline" size="icon" disabled={value === 0} onClick={() => setItem(key, index, value - 1)} aria-label={`${tableName} ${t(item.name)} ${t("azalt")}`} className="h-12 w-12 border [&_svg]:size-6"><Minus /></Button>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <Input id={inputId} aria-label={`${tableName} ${t(item.name)} ${t("miktarı")}`} type="number" inputMode="numeric" min={0} max={item.target} step={1} value={value} onChange={event => setItem(key, index, Number(event.target.value))} className="h-12 min-w-0 border bg-background px-1 text-center font-display text-2xl font-semibold md:text-2xl" />
                    <span className="whitespace-nowrap font-display text-xl font-semibold text-muted-foreground">/ {item.target}</span>
                  </div>
                  <Button size="icon" disabled={value >= item.target} onClick={() => setItem(key, index, value + 1)} aria-label={`${tableName} ${t(item.name)} ${t("artır")}`} className="h-12 w-12 border border-border [&_svg]:size-6"><Plus /></Button>
                </div>
                <FieldProgress value={progress} label={`${tableName} ${t(item.name)} ${t("ilerleme")}`} />
              </div>;
            })}
          </div>
        </article>;
      })}
    </div>}
    </div>
  </div>;
}

function SelectionCard({ label, number, caption, progress, onClick }: { label: string; number: string; caption: string; progress: number; onClick: () => void }) {
  const { t } = useI18n();
  return <Button variant="outline" aria-label={label} onClick={onClick} className="h-auto min-h-32 min-w-0 flex-col items-stretch gap-1 whitespace-normal border bg-card px-3 py-3 text-left shadow-none hover:border-ring">
    <span className="text-xs font-semibold text-muted-foreground">{caption}</span>
    <span className="font-display text-3xl font-semibold leading-none">{number}</span>
    <span className={`mt-1 text-sm font-semibold ${textTone(progress)}`}>%{progress}</span>
    <FieldProgress value={progress} height="h-2" label={`${label} ${t("ilerleme")}`} />
  </Button>;
}
