import { useEffect, useRef, useState } from "react";
import { Settings, Camera, ImagePlus, MapPin, Save, Trash2, TriangleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeams } from "@/lib/teams";
import { useI18n } from "@/lib/i18n";
import { TeamManagerDialog } from "@/components/team-manager-dialog";
import { emptyFault, prepareFaultPhoto, type FaultReport } from "@/lib/fault-reports";

interface Props {
  context: { id: string; label: string };
  initial: FaultReport | undefined;
  storageError: string;
  onSave: (id: string, report: FaultReport) => boolean;
  onClose: () => void;
}

export function FaultReportDialog({ context, initial, storageError, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<FaultReport>(() => initial ?? emptyFault());
  const [mediaError, setMediaError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [dark, setDark] = useState(false);
  const teams = useTeams();
  const { t } = useI18n();
  const [managing, setManaging] = useState(false);
  const teamOptions = draft.team && !teams.teams.includes(draft.team) ? [...teams.teams, draft.team] : teams.teams;
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const current = useRef(draft);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    setDark(Boolean(document.querySelector(".dark")));
    return () => { active.current = false; };
  }, []);

  function update(patch: Partial<FaultReport>) {
    const next = { ...current.current, ...patch };
    current.current = next;
    setDraft(next);
    onSave(context.id, next);
  }
  async function upload(file?: File) {
    if (!file) return;
    setMediaError("");
    setPhotoBusy(true);
    try {
      const photo = await prepareFaultPhoto(file);
      if (active.current) update({ photo });
    } catch (error) {
      if (active.current) setMediaError(error instanceof Error ? t(error.message) : t("Fotoğraf açılamadı."));
    } finally { if (active.current) setPhotoBusy(false); }
  }
  function locate() {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError(t("Bu cihaz konum hizmetini desteklemiyor.")); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      if (!active.current) return;
      update({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setLocating(false);
    }, error => {
      if (!active.current) return;
      setLocating(false);
      setLocationError(t(error.code === 1 ? "Konum izni verilmedi. Cihaz ayarlarından izin verebilir veya X, Y, Z bilgilerini girebilirsiniz." : error.code === 3 ? "Konum alma süresi doldu. Tekrar deneyin veya koordinatları girin." : "Konum bulunamadı. Konum hizmetini kontrol edin veya koordinatları girin."));
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={`${dark ? "dark" : ""} max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-md border bg-background p-4 text-foreground sm:p-6`}>
      <DialogHeader className="text-left pr-6">
        <DialogTitle className="flex items-center gap-2 font-display text-2xl tracking-normal"><TriangleAlert className="size-6 shrink-0 text-destructive" />{t("Hata Bildir")}</DialogTitle>
        <DialogDescription className="font-semibold">{context.label}</DialogDescription>
      </DialogHeader>
      <form className="space-y-5" onSubmit={event => { event.preventDefault(); if (onSave(context.id, current.current)) onClose(); }}>
        <div className="space-y-2"><label htmlFor="fault-detail" className="font-semibold">{t("Hata Detayı")}</label><Textarea id="fault-detail" value={draft.detail} onChange={event => update({ detail: event.target.value })} className="min-h-24 border text-base" /></div>
        <fieldset className="space-y-3"><legend className="mb-2 font-semibold">{t("Kamera ve Medya")}</legend>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" disabled={photoBusy} onClick={() => camera.current?.click()} className="h-12 border"><Camera />{t("Kamera")}</Button>
            <Button type="button" variant="outline" disabled={photoBusy} onClick={() => gallery.current?.click()} className="h-12 border"><ImagePlus />{t("Galeri")}</Button>
          </div>
          <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label={t("Kameradan fotoğraf")} className="hidden" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
          <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp" aria-label={t("Galeriden fotoğraf")} className="hidden" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
          {photoBusy && <p role="status" className="flex items-center gap-2 text-sm"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />{t("Fotoğraf hazırlanıyor…")}</p>}
          {draft.photo && <div className="flex items-center gap-3"><img src={draft.photo} alt={t("Hata fotoğrafı")} className="h-20 w-24 rounded-md border object-cover" /><Button type="button" variant="ghost" size="icon" onClick={() => update({ photo: null })} aria-label={t("Fotoğrafı kaldır")} title={t("Fotoğrafı kaldır")} className="size-11 text-destructive"><Trash2 /></Button></div>}
          {mediaError && <p role="alert" className="text-sm font-semibold text-destructive">{mediaError}</p>}
        </fieldset>
        <fieldset className="space-y-3"><legend className="mb-2 font-semibold">{t("Konum Bilgisi")}</legend>
          <Button type="button" variant="outline" disabled={locating} onClick={locate} className="h-12 w-full border">{locating ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <MapPin />}{locating ? t("Konum alınıyor…") : t("Mevcut Konumu Al")}</Button>
          {draft.latitude !== null && draft.longitude !== null && <dl className="grid grid-cols-2 gap-2 text-sm"><div><dt className="text-muted-foreground">{t("Enlem")}</dt><dd className="font-semibold tabular-nums">{draft.latitude.toFixed(6)}</dd></div><div><dt className="text-muted-foreground">{t("Boylam")}</dt><dd className="font-semibold tabular-nums">{draft.longitude.toFixed(6)}</dd></div></dl>}
          {locationError && <p role="alert" className="text-sm font-semibold text-destructive">{locationError}</p>}
          <div className="space-y-2"><p className="text-sm font-semibold">{t("Haritacı Koordinat Girişi")}</p><div className="grid grid-cols-3 gap-2">{(["x", "y", "z"] as const).map(axis => <div key={axis} className="min-w-0 space-y-1"><label htmlFor={`fault-${axis}`} className="text-sm font-semibold">{axis.toUpperCase()}</label><Input id={`fault-${axis}`} inputMode="decimal" value={draft[axis]} onChange={event => update({ [axis]: event.target.value })} className="h-11 min-w-0 border" /></div>)}</div></div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-2"><label htmlFor="fault-resolved" className="font-semibold">{t("Durum")}</label><div className="flex min-h-12 flex-wrap items-center gap-2"><Switch id="fault-resolved" checked={draft.resolved} onCheckedChange={resolved => update({ resolved })} aria-label={t("Hata giderildi")} /><span className={`text-sm font-semibold ${draft.resolved ? "text-success" : "text-destructive"}`}>{draft.resolved ? t("Giderildi") : t("Açık")}</span><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><Switch checked={draft.critical} disabled={draft.resolved} onCheckedChange={critical => update({ critical })} aria-label={t("Kritik hata")} />{t("Kritik")}</label></div></div>
          <div className="col-span-2 space-y-2"><label htmlFor="fault-team" className="font-semibold">{t("Sorumlu Ekip")}</label><div className="flex flex-wrap gap-2"><Select value={draft.team} onValueChange={team => update({ team })}><SelectTrigger id="fault-team" className="h-12 min-w-40 flex-1 border"><SelectValue placeholder={teamOptions.length ? t("Ekip seçin") : t("Önce ekip ekleyin")} /></SelectTrigger><SelectContent className={dark ? "dark" : ""}>{teamOptions.map(team => <SelectItem key={team} value={team}>{team}{teams.teams.includes(team) ? "" : t(" (silinmiş)")}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" onClick={() => setManaging(true)} className="h-12 shrink-0 border font-semibold"><Settings />{t("Ekipleri Yönet")}</Button></div></div>
        </div>
        {storageError && <p role="alert" className="text-sm font-semibold text-destructive">{t(storageError)}</p>}
        <Button type="submit" disabled={photoBusy || locating} className="h-12 w-full border border-border font-semibold"><Save />{t("Kaydet")}</Button>
      </form>
    </DialogContent>
    {managing && <TeamManagerDialog teams={teams} dark={dark} onClose={() => setManaging(false)} />}
  </Dialog>;
}