import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageOff, Pencil, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ITEMS, STATIONS, ZONES } from "@/lib/field-data";
import { useI18n, translate, type Language } from "@/lib/i18n";
import { useTeams } from "@/lib/teams";
import { ExcelImportCard } from "@/components/excel-import-card";
import { faultStatus, useFaultReports, type FaultReport, type FaultStatus } from "@/lib/fault-reports";

export const Route = createFileRoute("/revizyon")({
  head: () => ({ meta: [
    { title: "Rapor Yönetimi — GES Saha İmalat Takip" },
    { name: "description", content: "Sahada bildirilen hatalı imalat kayıtlarını filtreleyin, inceleyin ve Excel'e aktarın." },
    { property: "og:title", content: "Rapor Yönetimi — GES Saha İmalat Takip" },
    { property: "og:description", content: "Açık, kritik ve giderilmiş saha hatalarının listesi." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RevisionPage,
});

interface Row { id: string; station: number; zone: string; row: number; table: number; item: string; status: FaultStatus; report: FaultReport; location: string; date: string; gps: string; xyz: string }

const formatDate = (iso: string, locale: string) => { const d = new Date(iso); return iso && !Number.isNaN(d.getTime()) ? d.toLocaleString(locale, { dateStyle: "short", timeStyle: "short" }) : "—"; };
const statusClass: Record<FaultStatus, string> = { "Açık": "border-progress text-progress", "Kritik": "border-destructive bg-destructive text-destructive-foreground", "Giderildi": "border-success text-success" };

function toRows(reports: Record<string, FaultReport>, lang: Language, locale: string): Row[] {
  const t = (s: string, v?: Record<string, string | number>) => translate(lang, s, v);
  return Object.entries(reports).flatMap(([id, report]) => {
    const [s, z, r, t1, i] = id.split("-").map(Number);
    const item = ITEMS[i ?? -1];
    if (s === undefined || z === undefined || r === undefined || t1 === undefined || !item) return [];
    const gps = report.latitude !== null && report.longitude !== null ? `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}` : "";
    const xyz = [report.x, report.y, report.z].some(Boolean) ? `X ${report.x || "—"} · Y ${report.y || "—"} · Z ${report.z || "—"}` : "";
    return [{ id, station: s + 1, zone: ZONES[z] ?? "", row: r + 1, table: t1 + 1, item: item.name, status: faultStatus(report), report,
      location: `${t("İst.")} ${s + 1} > ${ZONES[z]} > ${t("Sıra {n}", { n: r + 1 })} > ${t("Masa {n}", { n: t1 + 1 })}`, date: formatDate(report.createdAt, locale), gps, xyz }];
  }).sort((a, b) => b.report.createdAt.localeCompare(a.report.createdAt));
}

function RevisionPage() {
  const { reports, save, remove, ready, error } = useFaultReports();
  const { t, lang, locale } = useI18n();
  const teams = useTeams();
  const [status, setStatus] = useState("all");
  const [station, setStation] = useState("all");
  const [item, setItem] = useState("all");
  const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FaultReport | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(Boolean(document.querySelector(".dark"))); }, [selected, editing, status, station, item]);
  const rows = useMemo(() => toRows(reports, lang, locale).filter(r =>
    (status === "all" || (status === "unresolved" ? r.status !== "Giderildi" : r.status === status)) &&
    (station === "all" || r.station === Number(station)) && (item === "all" || r.item === item)), [reports, status, station, item, lang, locale]);

  function selectRow(row: Row | null) {
    setSelected(row);
    setEditing(false);
    setDraft(null);
    setConfirmDelete(false);
  }
  function applyEdit() {
    if (!selected || !draft) return;
    if (save(selected.id, draft)) {
      setSelected({ ...selected, report: draft, status: faultStatus(draft) });
      setEditing(false);
      toast.success(t("Değişiklikler kaydedildi"));
    } else toast.error(t("Değişiklikler kaydedilemedi"), { description: t("Lütfen tekrar deneyin.") });
  }
  function deleteFault() {
    if (!selected) return;
    if (remove(selected.id)) {
      selectRow(null);
      toast.success(t("Kayıt silindi"));
    } else toast.error(t("Kayıt silinemedi"));
  }

  async function exportExcel() {
    if (!rows.length) { toast.error(t("Aktarılacak kayıt yok"), { description: t("Filtreleri değiştirip tekrar deneyin.") }); return; }
    try {
      const XLSX = await import("xlsx");
      const headers = ["Tarih", "İstasyon", "Bölge", "Sıra", "Masa", "İmalat Kalemi", "Hata Açıklaması", "Enlem", "Boylam", "X", "Y", "Z", "Durum", "Sorumlu Ekip"].map(h => t(h));
      const data = rows.map(r => [r.date, r.station, r.zone, r.row, r.table, t(r.item), r.report.detail, r.report.latitude ?? "", r.report.longitude ?? "", r.report.x, r.report.y, r.report.z, t(r.status), r.report.team || ""]);
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
      sheet["!cols"] = headers.map(h => ({ wch: h === t("Hata Açıklaması") ? 48 : Math.max(10, h.length + 3) }));
      sheet["!autofilter"] = { ref: `A1:N${data.length + 1}` };
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, t("Hata Raporu").slice(0, 31));
        
        // Mobile-friendly download via Web Share API
        try {
          const wbout = XLSX.write(book, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const file = new File([blob], "saha_hata_raporu.xlsx", { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: "Saha Hata Raporu",
              text: "Saha Hata Raporu ektedir."
            });
            toast.success(t("Rapor paylaşıldı"), { description: t("{n} kayıt aktarıldı.", { n: rows.length }) });
            return;
          }
        } catch (shareErr) {
          console.error("Share failed", shareErr);
        }
        
        // Fallback for Desktop
        XLSX.writeFile(book, "saha_hata_raporu.xlsx");
        toast.success(t("Excel indirildi"), { description: t("saha_hata_raporu.xlsx — {n} kayıt aktarıldı.", { n: rows.length }) });
      } catch (err) { console.error(err); toast.error(t("Excel oluşturulamadı"), { description: t("Lütfen tekrar deneyin.") }); }
  }

  const filter = (label: string, value: string, onChange: (v: string) => void, options: [string, string][]) =>
    <div className="min-w-0 space-y-1"><span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="h-12 border bg-card font-semibold"><SelectValue /></SelectTrigger>
        <SelectContent className={`${dark ? "dark" : ""} max-h-72`}>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>;

  return <div className="mx-auto max-w-5xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0"><h2 className="text-2xl font-semibold leading-tight">{t("Rapor Yönetimi")}</h2><p className="text-sm font-semibold text-muted-foreground">{t("{n} kayıt listeleniyor", { n: rows.length })}</p></div>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {filter(t("Durum"), status, setStatus, [["all", t("Tüm Durumlar")], ["unresolved", t("Sadece Açık Hatalar")], ["Açık", t("Açık")], ["Kritik", t("Kritik")], ["Giderildi", t("Giderildi")]])}
      {filter(t("İstasyon"), station, setStation, [["all", t("Tüm İstasyonlar")], ...Array.from({ length: STATIONS }, (_, i): [string, string] => [String(i + 1), t("İstasyon {n}", { n: i + 1 })])])}
      {filter(t("İmalat Kalemi"), item, setItem, [["all", t("Tüm Kalemler")], ...ITEMS.map((x): [string, string] => [x.name, t(x.name)])])}
    </div>
    {error && <p role="alert" className="font-semibold text-destructive">{t(error)}</p>}
    {!ready ? <p className="text-muted-foreground">{t("Kayıtlar yükleniyor…")}</p> : rows.length === 0 ?
      <div className="rounded-md border border-dashed border-border p-8 text-center font-semibold text-muted-foreground">{t("Bu filtrelere uyan hata kaydı yok.")}</div> :
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs"><tr>{["Tarih", "Lokasyon", "İmalat Kalemi", "Hata Açıklaması", "Koordinat / GPS", "Durum", "Sorumlu Ekip"].map(h => <th key={h} className="px-3 py-3 font-semibold">{t(h)}</th>)}</tr></thead>
          <tbody>{rows.map(r => <tr key={r.id} tabIndex={0} onClick={() => selectRow(r)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectRow(r); } }}
            className="cursor-pointer border-t border-border bg-card transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
            <td className="whitespace-nowrap px-3 py-3 tabular-nums">{r.date}</td>
            <td className="whitespace-nowrap px-3 py-3 font-semibold">{r.location}</td>
            <td className="px-3 py-3 font-semibold">{t(r.item)}</td>
            <td className="max-w-64 px-3 py-3"><span className="line-clamp-2">{r.report.detail || "—"}</span></td>
            <td className="px-3 py-3 text-xs tabular-nums">{r.gps && <div>{r.gps}</div>}{r.xyz && <div className="text-muted-foreground">{r.xyz}</div>}{!r.gps && !r.xyz && "—"}</td>
            <td className="px-3 py-3"><span className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs font-semibold ${statusClass[r.status]}`}>{t(r.status)}</span></td>
            <td className="whitespace-nowrap px-3 py-3">{r.report.team || "—"}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    <ExcelImportCard onExport={exportExcel} />
    {selected && <Dialog open onOpenChange={open => { if (!open) selectRow(null); }}>
      <DialogContent className={`${dark ? "dark" : ""} max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-md border bg-background p-4 text-foreground sm:p-6`}>
        <DialogHeader className="pr-6 text-left">
          <DialogTitle className="font-display text-2xl tracking-normal">{t("{n} Hatası", { n: t(selected.item) })}</DialogTitle>
          <DialogDescription className="font-semibold">{selected.location}</DialogDescription>
        </DialogHeader>
        {selected.report.photo ? <img src={selected.report.photo} alt={`${t(selected.item)} ${t("hata fotoğrafı")}`} className="max-h-[50dvh] w-full rounded-md border border-border object-contain bg-muted" />
          : <div className="flex h-32 items-center justify-center gap-2 rounded-md border border-dashed border-border text-muted-foreground"><ImageOff className="size-5" />{t("Fotoğraf eklenmemiş")}</div>}
        {editing && draft ? <div className="space-y-4">
          <div className="space-y-2"><label htmlFor="rev-detail" className="font-semibold">{t("Hata Detayı")}</label>
            <Textarea id="rev-detail" value={draft.detail} onChange={e => setDraft({ ...draft, detail: e.target.value })} className="min-h-24 border text-base" /></div>
          <div className="space-y-2"><p className="text-sm font-semibold">{t("Haritacı Koordinat Girişi")}</p>
            <div className="grid grid-cols-3 gap-2">{(["x", "y", "z"] as const).map(axis => <div key={axis} className="min-w-0 space-y-1"><label htmlFor={`rev-${axis}`} className="text-sm font-semibold">{axis.toUpperCase()}</label><Input id={`rev-${axis}`} inputMode="decimal" value={draft[axis]} onChange={e => setDraft({ ...draft, [axis]: e.target.value })} className="h-11 min-w-0 border" /></div>)}</div></div>
          <div className="space-y-2"><span className="font-semibold">{t("Durum")}</span>
            <div className="flex min-h-12 flex-wrap items-center gap-2"><Switch checked={draft.resolved} onCheckedChange={resolved => setDraft({ ...draft, resolved })} aria-label={t("Hata giderildi")} /><span className={`text-sm font-semibold ${draft.resolved ? "text-success" : "text-destructive"}`}>{draft.resolved ? t("Giderildi") : t("Açık")}</span><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><Switch checked={draft.critical} disabled={draft.resolved} onCheckedChange={critical => setDraft({ ...draft, critical })} aria-label={t("Kritik hata")} />{t("Kritik")}</label></div></div>
          <div className="space-y-2"><label htmlFor="rev-team" className="font-semibold">{t("Sorumlu Ekip")}</label>
            <Select value={draft.team} onValueChange={team => setDraft({ ...draft, team })}><SelectTrigger id="rev-team" className="h-12 border"><SelectValue placeholder={teams.teams.length ? t("Ekip seçin") : t("Önce ekip ekleyin")} /></SelectTrigger><SelectContent className={dark ? "dark" : ""}>{draft.team && !teams.teams.includes(draft.team) && <SelectItem value={draft.team}>{draft.team}{t(" (silinmiş)")}</SelectItem>}{teams.teams.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={applyEdit} className="h-12 border border-border font-semibold"><Save />{t("Kaydet")}</Button>
            <Button variant="outline" className="h-12 border font-semibold" onClick={() => { setEditing(false); setDraft(null); }}>{t("Vazgeç")}</Button>
          </div>
        </div> : <>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {([[t("Tarih"), selected.date], [t("Durum"), t(selected.status)], [t("Sorumlu Ekip"), selected.report.team || "—"], ["GPS", selected.gps || "—"], ["X", selected.report.x || "—"], ["Y", selected.report.y || "—"], ["Z", selected.report.z || "—"]] as const).map(([k, v]) =>
              <div key={k} className="min-w-0"><dt className="text-xs font-semibold text-muted-foreground">{k}</dt><dd className="break-words font-semibold tabular-nums">{v}</dd></div>)}
            <div className="col-span-2"><dt className="text-xs font-semibold text-muted-foreground">{t("Hata Açıklaması")}</dt><dd className="whitespace-pre-wrap font-semibold">{selected.report.detail || "—"}</dd></div>
          </dl>
          {confirmDelete && <p role="alert" className="text-sm font-semibold text-destructive">{t("Bu kayıt kalıcı olarak silinecek.")}</p>}
          <div className="grid grid-cols-2 gap-2">
            {confirmDelete ? <>
              <Button variant="destructive" className="h-12 font-semibold" onClick={deleteFault}><Trash2 />{t("Evet, Sil")}</Button>
              <Button variant="outline" className="h-12 border font-semibold" onClick={() => setConfirmDelete(false)}>{t("Vazgeç")}</Button>
            </> : <>
              <Button className="h-12 border border-border font-semibold" onClick={() => { setDraft(selected.report); setEditing(true); }}><Pencil />{t("Düzenle")}</Button>
              <Button variant="outline" className="h-12 border font-semibold text-destructive" onClick={() => setConfirmDelete(true)}><Trash2 />{t("Sil")}</Button>
            </>}
          </div>
          <Button variant="outline" className="h-12 w-full border font-semibold" onClick={() => selectRow(null)}>{t("Kapat")}</Button>
        </>}
      </DialogContent>
    </Dialog>}
  </div>;
}
