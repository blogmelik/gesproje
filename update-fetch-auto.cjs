const fs = require('fs');
let content = fs.readFileSync('src/components/field-shell.tsx', 'utf8');

const origHeader = content.substring(content.indexOf('function HeaderIndicators() {'));

const newHeader = `function HeaderIndicators() {
  const { t } = useI18n();
  const { pendingCount } = useFieldData();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'downloading'>('idle');
  const [lastSyncedHash, setLastSyncedHash] = useState('');

  // Is this running in electron?
  const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');

  const fetchCloudData = async (isStartup = false) => {
    setSyncStatus('downloading');
    try {
      const { data, error } = await supabase.from('sync_store').select('value').eq('key', 'device-demo').single();
      if (error) throw error;
      
      if (data && data.value) {
        if (data.value.progress) localStorage.setItem("ges-progress-v1", data.value.progress);
        if (data.value.faults) localStorage.setItem("ges-faults", data.value.faults);
        if (data.value.settings) localStorage.setItem("ges-settings", data.value.settings);
        if (data.value.teams) localStorage.setItem("ges-teams", data.value.teams);
        
        if (!isStartup) toast.success("Veriler yenilendi!");
        setTimeout(() => window.location.reload(), isStartup ? 100 : 800);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (!isStartup) toast.error("Buluttan veri cekilemedi.");
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    // Sadece Electron (Bilgisayar) uygulamasinda ve ilk acilista otomatik calisir
    if (isElectron && !sessionStorage.getItem('startupSyncDone')) {
      sessionStorage.setItem('startupSyncDone', 'true');
      fetchCloudData(true);
    }
  }, [isElectron]);

  useEffect(() => {
    const payloadStr = JSON.stringify({
      progress: localStorage.getItem("ges-progress-v1"),
      faults: localStorage.getItem("ges-faults"),
      settings: localStorage.getItem("ges-settings"),
      teams: localStorage.getItem("ges-teams")
    });

    if (payloadStr === lastSyncedHash) return;
    if (pendingCount > 0) return;

    const autoSync = async () => {
      if (syncStatus === 'downloading') return;
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
        setLastSyncedHash(payloadStr);
      } catch (err) {
        console.error("Auto-sync error:", err);
        setSyncStatus('error');
      }
    };

    const timer = setTimeout(autoSync, 2000);
    return () => clearTimeout(timer);
  }, [pendingCount, lastSyncedHash, syncStatus]);


  return <div className="hidden shrink-0 items-center gap-2 lg:flex">
    {isElectron && (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => fetchCloudData(false)}
        disabled={syncStatus === 'downloading'}
        className={\`h-8 gap-1.5 px-2.5 text-xs font-medium \${syncStatus === 'downloading' ? 'animate-pulse opacity-50' : ''}\`}
        title="Verileri Yenile"
      >
        <RefreshCw className={\`size-4 text-primary \${syncStatus === 'downloading' ? 'animate-spin' : ''}\`} />
        <span>Yenile</span>
      </Button>
    )}
    
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

content = content.replace(origHeader, newHeader);

// Ensure RefreshCw is imported
if (!content.includes('RefreshCw')) {
  content = content.replace('CloudSun,', 'CloudSun, RefreshCw,');
}

fs.writeFileSync('src/components/field-shell.tsx', content, 'utf8');
