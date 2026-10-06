import { tone } from "@/lib/field-data";

export function FieldProgress({ value, height = "h-3", label }: { value: number; height?: string; label?: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}
      className={`w-full ${height} overflow-hidden rounded-sm border border-border bg-muted`}>
      <div className={`h-full ${tone(value)} transition-all duration-300 motion-reduce:transition-none`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}