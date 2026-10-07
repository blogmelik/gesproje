const fs = require('fs');
let content = fs.readFileSync('src/components/field-shell.tsx', 'utf8');

// Replace fetchCloudData
const oldFetch = `const fetchCloudData = async (isStartup = false) => {
    setSyncStatus('downloading');
    try {
      const { data, error } = await supabase.from('sync_store').select('value').eq('key', 'device-demo').single();
      if (error) throw error;
      
      if (data && data.value) {
        if (data.value.progress) localStorage.setItem("ges-progress-v1", data.value.progress);
        if (data.value.locked) localStorage.setItem("ges-locked-v1", data.value.locked);
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
  };`;

const newFetch = `const fetchCloudData = async (isStartup = false) => {
    setSyncStatus('downloading');
    try {
      const { data, error } = await supabase.from('sync_store').select('value').eq('key', 'device-demo').single();
      if (error) throw error;
      
      if (data && data.value) {
        if (!isElectron) {
          // Mobil uygulama SADECE kilitleri indirir (cunku sahadaki veriler ezelden beridir mobilin kendisindedir, offline veri kaybolmasin diye progress indirilmez)
          if (data.value.locked) localStorage.setItem("ges-locked-v1", data.value.locked);
        } else {
          // PC uygulamasi tum verileri indirir
          if (data.value.progress) localStorage.setItem("ges-progress-v1", data.value.progress);
          if (data.value.locked) localStorage.setItem("ges-locked-v1", data.value.locked);
          if (data.value.faults) localStorage.setItem("ges-faults", data.value.faults);
          if (data.value.settings) localStorage.setItem("ges-settings", data.value.settings);
          if (data.value.teams) localStorage.setItem("ges-teams", data.value.teams);
        }
        
        if (!isStartup) toast.success("Veriler yenilendi!");
        setTimeout(() => window.location.reload(), isStartup ? 100 : 800);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      if (!isStartup) toast.error("Buluttan veri cekilemedi.");
      setSyncStatus('error');
    }
  };`;

content = content.replace(oldFetch, newFetch);

// Replace useEffect for startup
const oldEffect = `useEffect(() => {
    // Sadece Electron (Bilgisayar) uygulamasinda ve ilk acilista otomatik calisir
    if (isElectron && !sessionStorage.getItem('startupSyncDone')) {
      sessionStorage.setItem('startupSyncDone', 'true');
      fetchCloudData(true);
    }
  }, [isElectron]);`;

const newEffect = `useEffect(() => {
    // Tum cihazlarda ilk acilista calisir.
    // PC tum veriyi cekerken, Mobil sadece merkezden gelen 'kilitleri' ceker
    if (!sessionStorage.getItem('startupSyncDone')) {
      sessionStorage.setItem('startupSyncDone', 'true');
      fetchCloudData(true);
    }
  }, [isElectron]);`;

content = content.replace(oldEffect, newEffect);

fs.writeFileSync('src/components/field-shell.tsx', content, 'utf8');
