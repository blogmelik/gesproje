const fs = require('fs');
let content = fs.readFileSync('src/routes/ayarlar.tsx', 'utf8');

// Ensure necessary lucide icons are imported
if (!content.includes('Lock,')) {
    content = content.replace('PanelBottom } from "lucide-react";', 'PanelBottom, Lock, DownloadCloud } from "lucide-react";');
}

// Add state for PIN
const stateSearch = `const { t, lang, setLang } = useI18n();`;
const stateReplace = `const { t, lang, setLang } = useI18n();
  const [newPin, setNewPin] = React.useState("");
  const isElectron = window.navigator.userAgent.toLowerCase().includes("electron");

  const updatePin = async () => {
    if (newPin.length < 4) return toast.error("PIN en az 4 haneli olmalidir.");
    try {
      const { error } = await import('@/lib/supabase').then(m => m.supabase)
        .from("sync_store").upsert({ key: "device-demo-security", value: { pin: newPin } });
      if (error) throw error;
      localStorage.setItem("ges-app-pin", newPin);
      toast.success("PIN kodu basariyla guncellendi.");
      setNewPin("");
    } catch (e) {
      toast.error("PIN guncellenemedi.");
    }
  };

  const checkUpdates = () => {
    const url = isElectron 
      ? "https://raw.githubusercontent.com/blogmelik/gesproje/builds/release/SahaTakip-Masaustu-Guncel.exe"
      : "https://raw.githubusercontent.com/blogmelik/gesproje/builds/release/SahaTakip-Guncel.apk";
    
    // Redirect to download
    window.location.href = url;
  };
`;

if (!content.includes('const [newPin, setNewPin]')) {
    content = content.replace(stateSearch, stateReplace);
}

// Add React import if missing
if (!content.includes('import React')) {
    content = `import React from 'react';\n` + content;
}

// Add UI sections before the final `</div>`
const newSections = `
    {isElectron && (
      <section className="max-w-2xl space-y-5 mt-10 p-6 border border-destructive/20 bg-destructive/5 rounded-lg">
        <div className="flex items-center gap-3 mb-4 text-destructive">
          <Lock className="size-6" />
          <h3 className="text-xl font-semibold">Güvenlik Ayarları (Merkez Yetkisi)</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Bu şifre, uygulamayı telefonda açan herkes için geçerli olacaktır. Sadece yetkili bilgisayardan değiştirilebilir.</p>
        <div className="flex gap-4 items-center">
          <Input 
            type="password" 
            placeholder="Yeni PIN Kodunu Girin" 
            value={newPin} 
            onChange={(e) => setNewPin(e.target.value)} 
            className="max-w-[200px]"
          />
          <Button variant="destructive" onClick={updatePin}>PIN Kodunu Güncelle</Button>
        </div>
      </section>
    )}

    <section className="max-w-2xl space-y-5 mt-10 p-6 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DownloadCloud className="size-5 text-primary" />
            Sistem Güncellemesi
          </h3>
          <p className="text-sm text-muted-foreground">En yeni özellikleri almak için uygulamanın güncel sürümünü indirin.</p>
        </div>
        <Button onClick={checkUpdates} className="shrink-0 gap-2">
          <DownloadCloud className="size-4" />
          Güncellemeyi İndir
        </Button>
      </div>
    </section>
  </div>`;

const endSearch = `</section>\n  </div>`;
if (content.includes(endSearch)) {
    content = content.replace(endSearch, `</section>\n${newSections}`);
} else {
    // If not found, append before the last `</div>`
    const lastDiv = content.lastIndexOf('</div>');
    content = content.substring(0, lastDiv) + newSections;
}

fs.writeFileSync('src/routes/ayarlar.tsx', content, 'utf8');
