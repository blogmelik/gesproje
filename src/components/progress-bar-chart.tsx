import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ProgressBarChart({ data }: { data: { name: string; value: number }[] }) {
  return <ResponsiveContainer width="100%" height={320}>
    <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
      <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
      <YAxis domain={[0, 100]} unit="%" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
      <Tooltip cursor={{ fill: "var(--muted)" }} formatter={(v: number) => [`%${v}`, ""]} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 4, color: "var(--foreground)", fontSize: 12 }} />
      <Bar dataKey="value" fill="var(--primary)" radius={[2, 2, 0, 0]} maxBarSize={56} />
    </BarChart>
  </ResponsiveContainer>;
}
