import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import type { useTeams } from "@/lib/teams";

export function TeamManagerDialog({ teams, dark, onClose }: { teams: ReturnType<typeof useTeams>; dark: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");
  const { t } = useI18n();

  function add() { const e = teams.add(name); setError(e); if (!e) setName(""); }
  function saveEdit() { if (!editing) return; const e = teams.rename(editing, editValue); setError(e); if (!e) setEditing(null); }

  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className={`${dark ? "dark" : ""} max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-md border bg-background p-4 text-foreground sm:p-6`}>
      <DialogHeader className="pr-6 text-left">
        <DialogTitle className="font-display text-2xl tracking-normal">{t("Ekipleri Yönet")}</DialogTitle>
        <DialogDescription className="font-semibold">{t("Sorumlu ekipler")}</DialogDescription>
      </DialogHeader>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); add(); }}>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("Yeni ekip adı")} aria-label={t("Yeni ekip adı")} maxLength={60} className="h-12 border text-base" />
        <Button type="submit" className="h-12 shrink-0 border border-border font-semibold"><Plus />{t("Ekle")}</Button>
      </form>
      {error && <p role="alert" className="text-sm font-semibold text-destructive">{t(error)}</p>}
      {teams.teams.length === 0 ? <p className="rounded-md border border-dashed border-border p-4 text-center text-sm font-semibold text-muted-foreground">{t("Henüz ekip yok.")}</p> :
        <ul className="space-y-2">{teams.teams.map(team => <li key={team} className="flex min-h-14 items-center gap-2 rounded-md border border-border bg-card p-2">
          {editing === team ? <>
            <Input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveEdit(); } if (e.key === "Escape") { e.stopPropagation(); setEditing(null); } }} aria-label={`${team} ${t("yeni adı")}`} maxLength={60} className="h-11 border" />
            <Button type="button" size="icon" variant="outline" onClick={saveEdit} aria-label={t("Kaydet")} title={t("Kaydet")} className="size-11 shrink-0 border text-success"><Check /></Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => setEditing(null)} aria-label={t("Vazgeç")} title={t("Vazgeç")} className="size-11 shrink-0"><X /></Button>
          </> : <>
            <span className="min-w-0 flex-1 break-words px-1 font-semibold">{team}</span>
            <Button type="button" size="icon" variant="outline" onClick={() => { setEditing(team); setEditValue(team); setError(""); }} aria-label={`${team} ${t("Düzenle")}`} title={t("Düzenle")} className="size-11 shrink-0 border"><Pencil /></Button>
            <Button type="button" size="icon" variant="outline" onClick={() => { setError(teams.remove(team)); }} aria-label={`${team} ${t("Sil")}`} title={t("Sil")} className="size-11 shrink-0 border text-destructive hover:text-destructive"><Trash2 /></Button>
          </>}
        </li>)}</ul>}
      <Button type="button" variant="outline" onClick={onClose} className="h-12 border font-semibold">{t("Kapat")}</Button>
    </DialogContent>
  </Dialog>;
}
