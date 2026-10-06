const fs = require('fs');
let content = fs.readFileSync('src/components/field-shell.tsx', 'utf8');

const importStmt = 'import { supabase } from "@/lib/supabase";\nimport { toast } from "sonner";\n';
if(!content.includes('import { supabase }')) {
    content = importStmt + content;
}

const replacement = `function HeaderIndicators() {
  const { t } = useI18n();
  const { pendingCount, saveChanges } = useFieldData();
  const [isSyncing, setIsSyncing] = useState(false);
  const synced = pendingCount === 0;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      saveChanges();
      const payload = {
        progress: localStorage.getItem("ges-progress-v1"),
        faults: localStorage.getItem("ges-faults"),
        settings: localStorage.getItem("ges-settings"),
        teams: localStorage.getItem("ges-teams")
      };

      const { error } = await supabase
        .from('sync_store')
        .upsert({ 
          key: 'device-demo', 
          value: payload,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Veriler basariyla buluta gonderildi!");
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Esitleme hatasi. Internet baglantinizi kontrol edin.");
    } finally {
      setIsSyncing(false);
    }
  };

  return <div className="hidden shrink-0 items-center gap-2 lg:flex">
    <div title={t("Saha Hava Durumu")} className="flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-xs text-muted-foreground"><CloudSun className="size-4 text-primary" /><span className="font-semibold tabular-nums text-foreground">34°C</span><Wind className="size-3.5" /><span className="tabular-nums">12 km/h</span></div>
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSync}
      disabled={isSyncing}
      title={synced ? "Senkronize" : "Kaydedilmemis"} 
      className={\`h-8 gap-1.5 px-2.5 text-xs font-medium \${isSyncing ? 'animate-pulse opacity-50' : ''}\`}
    >
      {synced ? <CloudCheck className="size-4 text-success" /> : <CloudUpload className="size-4 text-destructive" />}
      <span>{isSyncing ? "Esitleniyor..." : (synced ? "Bulutla Esitle" : \`Kaydet ve Esitle (\${pendingCount})\`)}</span>
    </Button>
  </div>;
}`;

const newContent = content.replace(/function HeaderIndicators\(\) \{[\s\S]*?\}/, replacement);
fs.writeFileSync('src/components/field-shell.tsx', newContent, 'utf8');
