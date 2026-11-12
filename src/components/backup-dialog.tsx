import { useState, useRef } from "react";
import { CloudUpload, CloudDownload, Download, Upload, Database, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { backupToFirebase, restoreFromFirebase, exportBackupFile, importBackupFile } from "@/lib/backup-service";
import { getSavedFirebaseConfig } from "@/lib/firebase";

export function BackupDialog({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState(() => localStorage.getItem("ges-last-cloud-backup") || "Henüz alınmadı");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasFirebase = Boolean(getSavedFirebaseConfig());

  const handleCloudUpload = async () => {
    setLoading(true);
    const toastId = toast.loading("Google Firebase'e yedekleniyor...");
    try {
      const res = await backupToFirebase();
      if (res.success) {
        toast.success(res.message, { id: toastId });
        setLastBackup(new Date().toLocaleString("tr-TR"));
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch {
      toast.error("Buluta yedekleme sırasında bir hata oluştu.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleCloudDownload = async () => {
    if (!confirm("Buluttaki yedek indirilecek ve mevcut yerel verilerinizin üzerine yazılacaktır. Onaylıyor musunuz?")) {
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Buluttan yedek çekiliyor...");
    try {
      const res = await restoreFromFirebase();
      if (res.success) {
        toast.success(res.message, { id: toastId });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch {
      toast.error("Buluttan geri yükleme sırasında bir hata oluştu.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleFileExport = async () => {
    const res = await exportBackupFile();
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Seçilen yedek dosyası içeri aktarılacak ve mevcut verilerin üzerine yazılacaktır. Devam edilsin mi?")) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Yedek dosyası işleniyor...");
    try {
      const res = await importBackupFile(file);
      if (res.success) {
        toast.success(res.message, { id: toastId });
        setTimeout(() => window.location.reload(), 1200);
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch {
      toast.error("Dosya içeri aktarılamadı.", { id: toastId });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium">
            <Database className="size-4 text-primary" />
            <span>Yedekleme</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Database className="size-5" />
            <DialogTitle className="text-xl">Yedekleme & Veri Yönetimi</DialogTitle>
          </div>
          <DialogDescription>
            Tüm şantiye imalatlarını, kilitleri ve arıza kayıtlarını Google Firebase bulutuna veya yerel dosya olarak yedekleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Cloud Section */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                <CloudUpload className="size-4 text-primary" />
                Google Firebase Bulut Yedekleme
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-success" />
                Manuel Mod
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              İstediğiniz zaman tek tıkla sahadaki en son durumu buluta yükleyebilir veya başka cihazdan geri yükleyebilirsiniz.
            </p>

            <div className="text-[11px] text-muted-foreground bg-muted/60 p-2 rounded">
              <span className="font-medium text-foreground">Son Bulut Yedeği:</span> {lastBackup}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button 
                onClick={handleCloudUpload} 
                disabled={loading}
                className="gap-2 h-10"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
                Buluta Yedekle
              </Button>

              <Button 
                onClick={handleCloudDownload} 
                disabled={loading}
                variant="outline"
                className="gap-2 h-10"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <CloudDownload className="size-4" />}
                Buluttan Geri Yükle
              </Button>
            </div>

            {!hasFirebase && (
              <p className="text-[11px] text-amber-500 bg-amber-500/10 p-2 rounded">
                ⚠️ Firebase henüz yapılandırılmamış. Ayarlar sekmesinden Firebase bilgilerinizi girebilir veya aşağıdaki çevrimdışı dosya yedeğini kullanabilirsiniz.
              </p>
            )}
          </div>

          {/* Local File Section */}
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Download className="size-4 text-primary" />
                Çevrimdışı Dosya Yedeği (.ges)
              </span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-success" />
                İnternetsiz
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              İnternet bağlantısı olmasa dahi tüm verileri şifreli tek bir dosya olarak bilgisayarınıza indirebilir veya WhatsApp/Mail ile paylaşabilirsiniz.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button 
                onClick={handleFileExport} 
                variant="secondary"
                disabled={loading}
                className="gap-2 h-10"
              >
                <Download className="size-4" />
                Dosya Olarak İndir
              </Button>

              <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="outline"
                disabled={loading}
                className="gap-2 h-10"
              >
                <Upload className="size-4" />
                Dosyadan Yükle
              </Button>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".ges,.json" 
                onChange={handleFileImport} 
                className="hidden" 
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
