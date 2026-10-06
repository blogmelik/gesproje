import { useRef, useState } from "react";
import { Download, Upload, Check, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFieldData } from "@/lib/field-data";
import { useI18n } from "@/lib/i18n";
import { downloadTemplate, readImportFile, type ImportResult } from "@/lib/excel-import";

export function ExcelImportCard({ onExport }: { onExport: () => void }) {
  const { importData } = useFieldData();
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error(t("Dosya 10MB'dan büyük olamaz")); return; }
    setBusy(true);
    try { setResult(await readImportFile(file)); }
    catch { toast.error(t("Excel dosyası okunamadı")); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }

  const count = result ? Object.keys(result.updates).length : 0;
  return <section aria-labelledby="import-heading" className="space-y-4 border-t pt-6">
    <h3 id="import-heading" className="text-xl font-semibold">{t("Dışa Aktar ve İçe Aktar")}</h3>
    <p className="text-sm text-muted-foreground">{t("Şablonu indirin, masa bazında tamamlanan miktarları doldurup yükleyin.")}</p>
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" className="h-11" onClick={() => downloadTemplate()}><Download />{t("Şablonu İndir")}</Button>
      <Button className="h-11" disabled={busy} onClick={() => input.current?.click()}><Upload />{t("İçe Aktar")}</Button>
      <Button variant="secondary" className="h-11" onClick={onExport}><FileSpreadsheet />{t("Dışa Aktar")}</Button>
      <input ref={input} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
    </div>
    {result && <div className="space-y-3 rounded-md border bg-card p-4 text-card-foreground shadow-sm">
      <p className="font-medium">{t("{n} masa güncellenecek, {e} hata", { n: count, e: result.errors.length })}</p>
      {result.errors.length > 0 && <ul className="max-h-40 list-disc space-y-1 overflow-auto pl-5 text-sm text-destructive">
        {result.errors.slice(0, 50).map((err, i) => <li key={i}>{err}</li>)}
      </ul>}
      <div className="flex gap-3">
        <Button className="h-11" disabled={!count} onClick={() => { importData(result.updates); toast.success(t("{n} masa verisi yüklendi", { n: count })); setResult(null); }}><Check />{t("Onayla ve Yükle")}</Button>
        <Button variant="outline" className="h-11" onClick={() => setResult(null)}>{t("Vazgeç")}</Button>
      </div>
    </div>}
  </section>;
}
