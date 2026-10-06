import { Quote as QuoteIcon } from "lucide-react";
import { dailyQuotes } from "@/lib/daily-quotes";
import { useI18n } from "@/lib/i18n";

// Başlangıç kayması: liste bugünden farklı bir sözle dönmeye başlar.
const QUOTE_OFFSET = 57;

// Seçim yılın gününe göre yapılır; tüm liste yaklaşık 120 günde bir döner.
function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function QuoteOfDay() {
  const { lang } = useI18n();
  const quote =
    dailyQuotes[(dayOfYear() - 1 + QUOTE_OFFSET) % dailyQuotes.length] ??
    dailyQuotes[0]!;
  return (
    <p className="flex items-start gap-2 text-sm italic text-muted-foreground">
      <QuoteIcon className="mt-0.5 size-4 shrink-0 opacity-60" aria-hidden />
      <span>{quote[lang]}</span>
    </p>
  );
}
