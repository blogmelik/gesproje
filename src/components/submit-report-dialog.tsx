import { useState } from "react";
import { Send, CheckCircle2, MessageSquare, User, FileText, Share2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { sendReportSubmission, exportSubmissionFile, type FieldSubmission } from "@/lib/submissions";
import { ITEMS, ZONES, type Data } from "@/lib/field-data";

interface Props {
  station: number | null;
  zone: number | null;
  row: number | null;
  data: Data;
  onBeforeSend?: () => void;
  children?: React.ReactNode;
}

export function SubmitReportDialog({ station, zone, row, data, onBeforeSend, children }: Props) {
  const [open, setOpen] = useState(false);
  const [senderName, setSenderName] = useState(() => localStorage.getItem("ges-last-sender-name") || "");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  // Filter modified tables for current station/zone/row or overall non-empty tables
  const prefix = station !== null && zone !== null && row !== null ? `${station}-${zone}-${row}-` : "";
  const modifiedEntries = Object.entries(data).filter(([key, vals]) => {
    if (prefix && !key.startsWith(prefix)) return false;
    return vals.some(v => v > 0);
  });

  const summaryText = prefix
    ? `İstasyon ${station! + 1}, Bölge ${ZONES[zone!] ?? ""}, Sıra ${row! + 1} (${modifiedEntries.length} masa)`
    : `${modifiedEntries.length} masa imalat verisi`;

  const handleSubmit = async (viaShare = false) => {
    if (!senderName.trim()) {
      toast.error("Lütfen adınızı veya ekip adını girin.");
      return;
    }

    onBeforeSend?.();
    localStorage.setItem("ges-last-sender-name", senderName.trim());
    setSending(true);

    const changes: Data = {};
    for (const [k, v] of modifiedEntries) {
      changes[k] = v;
    }

    const payload = {
      senderName: senderName.trim(),
      station: station ?? 0,
      zone: zone !== null ? ZONES[zone] ?? "A" : "A",
      row: row ?? 0,
      summaryText,
      note: note.trim() || undefined,
      changes
    };

    try {
      const res = await sendReportSubmission(payload);
      if (viaShare || res.sharedOffline) {
        // Prepare dummy submission object for file export
        const subObj: FieldSubmission = {
          ...payload,
          id: res.id,
          timestamp: new Date().toISOString(),
          status: "pending"
        };
        const shared = await exportSubmissionFile(subObj);
        if (shared) {
          toast.success("Rapor dosyası paylaşıldı!");
          setOpen(false);
        } else {
          toast.info("Rapor yerel olarak kaydedildi.");
          setOpen(false);
        }
      } else {
        toast.success(res.message, {
          description: "Rapor merkez bilgisayarındaki Gelen Kutusu'na iletildi. Onaylandıktan sonra ana projeye dahil edilecektir."
        });
        setOpen(false);
      }
    } catch {
      toast.error("Rapor gönderilirken bir hata oluştu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="h-11 gap-2 bg-primary text-primary-foreground font-semibold shadow-sm">
            <Send className="size-4" />
            <span>Merkeze Gönder</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Send className="size-5" />
            <DialogTitle className="text-xl">İmalat Raporunu Merkeze Gönder</DialogTitle>
          </div>
          <DialogDescription>
            Girdiğiniz imalat verileri merkez ofisteki masaüstü uygulamasının <strong>Gelen Kutusu</strong>'na iletilir. Şef onayından sonra projeye dahil olur.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="rounded-md border bg-muted/50 p-3 space-y-1 text-xs">
            <div className="flex items-center justify-between font-medium text-foreground">
              <span>Gönderilecek İmalat Kapsamı:</span>
              <span className="text-primary font-semibold">{summaryText}</span>
            </div>
            <p className="text-muted-foreground">
              {modifiedEntries.length > 0
                ? `${modifiedEntries.length} masaya ait imalat adetleri merkeze aktarılacak.`
                : "Seçili alanda henüz imalat girilmemiş görünüyor."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender-name" className="flex items-center gap-1.5 text-xs font-semibold">
              <User className="size-3.5 text-primary" />
              Gönderen Ekip / Kişi Adı *
            </Label>
            <Input
              id="sender-name"
              placeholder="Örn: Ahmet Usta / Montaj Ekibi 1"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              className="h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-note" className="flex items-center gap-1.5 text-xs font-semibold">
              <MessageSquare className="size-3.5 text-primary" />
              Saha Notu / Açıklama (İsteğe bağlı)
            </Label>
            <Textarea
              id="report-note"
              placeholder="Örn: 1. Sıra panelleri tamamlandı, cıvatalar torklandı."
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              className="resize-none text-xs"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={() => handleSubmit(false)}
              disabled={sending || modifiedEntries.length === 0}
              className="h-11 gap-2 font-semibold text-sm"
            >
              <Send className="size-4" />
              Onayla ve Merkeze Gönder
            </Button>

            <Button
              onClick={() => handleSubmit(true)}
              variant="outline"
              disabled={sending || modifiedEntries.length === 0}
              className="h-10 gap-2 text-xs"
            >
              <Share2 className="size-4" />
              WhatsApp / Dosya ile İlet (.gessub)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
