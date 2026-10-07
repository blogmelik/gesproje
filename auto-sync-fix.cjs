const fs = require('fs');
let content = fs.readFileSync('src/components/field-shell.tsx', 'utf8');

const orig = content.substring(content.indexOf('function HeaderIndicators() {'));

const replacement = `function HeaderIndicators() {
  const { t } = useI18n();
  const { pendingCount } = useFieldData();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncedHash, setLastSyncedHash] = useState('');

  useEffect(() => {
    // Sadece onaylanmis veri (pendingCount === 0) veya genel bir degisiklik oldugunda otomatik calisir
    const payloadStr = JSON.stringify({
      progress: localStorage.getItem("ges-progress-v1"),
      faults: localStorage.getItem("ges-faults"),
      settings: localStorage.getItem("ges-settings"),
      teams: localStorage.getItem("ges-teams")
    });

    if (payloadStr === lastSyncedHash) return; // Degisiklik yoksa atla
    
    // Draft asamasinda isek bekle (Kaydet butonuna basilinca pendingCount 0 olur)
    if (pendingCount > 0) return;

    const autoSync = async () => {
      setSyncStatus('syncing');
      try {
        const { error } = await supabase
          .from('sync_store')
          .upsert({ 
            key: 'device-demo', 
            value: JSON.parse(payloadStr),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
        setSyncStatus('idle');
        setLastSyncedHash(payloadStr); // Son gonderilen veriyi kaydet
      } catch (err) {
        console.error("Auto-sync error:", err);
        setSyncStatus('error');
      }
    };

    const timer = setTimeout(autoSync, 2000); // 2 saniye bekle (debounce)
    return () => clearTimeout(timer);
  }, [pendingCount, lastSyncedHash]); // LocalStorage degisikliklerini algilamak icin pendingCount'a ve zamanlayiciya bagliyiz

  return <div className="hidden shrink-0 items-center gap-2 lg:flex">
    <div title={t("Saha Hava Durumu")} className="flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-xs text-muted-foreground">
      <CloudSun className="size-4 text-primary" /><span className="font-semibold tabular-nums text-foreground">34°C</span><Wind className="size-3.5" /><span className="tabular-nums">12 km/h</span>
    </div>
    
    <div 
      title={syncStatus === 'syncing' ? "Buluta gönderiliyor..." : syncStatus === 'error' ? "Eşitleme Hatası" : pendingCount > 0 ? "Kaydedilmeyi Bekliyor" : "Bulutla Eşitlendi"} 
      className={\`flex h-8 items-center gap-1.5 rounded-sm border px-2.5 text-xs font-medium 
        \${syncStatus === 'syncing' ? 'text-blue-500 animate-pulse' : syncStatus === 'error' ? 'text-destructive' : pendingCount > 0 ? 'text-amber-500' : 'text-success'}\`}
    >
      {syncStatus === 'syncing' ? <CloudUpload className="size-4" /> : 
       syncStatus === 'error' ? <CloudUpload className="size-4" /> : 
       pendingCount > 0 ? <CloudUpload className="size-4" /> : 
       <CloudCheck className="size-4" />}
      
      <span>
        {syncStatus === 'syncing' ? "Eşitleniyor..." : 
         syncStatus === 'error' ? "Bağlantı Yok" : 
         pendingCount > 0 ? \`Taslak (\${pendingCount})\` : "Eşitlendi"}
      </span>
    </div>
  </div>;
}`;

content = content.replace(orig, replacement);

if(!content.includes('import { useEffect, useState }')) {
    content = content.replace('import { useState', 'import { useEffect, useState');
}

fs.writeFileSync('src/components/field-shell.tsx', content, 'utf8');
