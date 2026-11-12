import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function PinScreen({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => {
    return localStorage.getItem("ges-unlocked-device") === "true" || sessionStorage.getItem("ges-unlocked") === "true";
  });
  const [pin, setPin] = useState("");
  const expectedPin = localStorage.getItem("ges-app-pin") || "1984";

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === expectedPin.trim()) {
      sessionStorage.setItem("ges-unlocked", "true");
      localStorage.setItem("ges-unlocked-device", "true");
      setUnlocked(true);
    } else {
      toast.error("Hatalı PIN kodu!");
      setPin("");
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
            <Lock className="size-8" />
          </div>
          <h2 className="text-xl font-bold">Özgün İnşaat Saha</h2>
          <p className="text-sm text-muted-foreground">Uygulamaya girmek için PIN kodunu giriniz.</p>
        </div>
        <form onSubmit={handleUnlock} className="space-y-4">
          <Input 
            type="password" 
            inputMode="numeric"
            autoFocus
            placeholder="PIN Kodu" 
            value={pin} 
            onChange={(e) => setPin(e.target.value)} 
            className="h-12 text-center text-2xl tracking-widest"
          />
          <Button type="submit" className="h-12 w-full text-base">Giriş Yap</Button>
        </form>
      </div>
    </div>
  );
}
