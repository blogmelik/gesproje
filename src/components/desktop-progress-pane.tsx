import { useState } from "react";
import { ChevronRight, Folder, FolderOpen, Table2, Lock, Unlock, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FieldProgress } from "@/components/field-progress";
import { useI18n } from "@/lib/i18n";
import { ITEMS, STATIONS, ZONES, ROWS, TABLES, TABLE_TOTAL, tableKey, pct, textTone, sumRange, type Data } from "@/lib/field-data";

type Props = {
  data: Data;
  stationPct: number[];
  station: number | null;
  zone: number | null;
  row: number | null;
  onSelect: (station: number, zone: number, row: number, table: number) => void;
  setItem: (key: string, index: number, value: number) => void;
  reported: (id: string) => boolean;
  faultsReady: boolean;
  onFault: (id: string, label: string) => void;
};

/** Desktop-only split pane: explorer-style tree (30%) + compact spreadsheet entry (70%). */
export function DesktopProgressPane({ data, stationPct, station, zone, row, onSelect, setItem, reported, faultsReady, onFault }: Props) {
  const { t } = useI18n();
  const [openStations, setOpenStations] = useState<Set<number>>(() => new Set(station === null ? [] : [station]));
  const [openZones, setOpenZones] = useState<Set<string>>(() => new Set(station !== null && zone !== null ? [`${station}-${zone}`] : []));
  const [openRows, setOpenRows] = useState<Set<string>>(() => new Set());
  const [activeTable, setActiveTable] = useState<number | null>(null);
  const toggle = <T,>(set: Set<T>, value: T) => { const next = new Set(set); if (next.has(value)) next.delete(value); else next.add(value); return next; };
  const prefixPct = (prefix: string) => { const s = sumRange(data, key => key.startsWith(prefix)); return pct(s.done, s.total); };
  function pick(s: number, z: number, r: number, table: number) {
    onSelect(s, z, r, table);
    setActiveTable(table);
    requestAnimationFrame(() => document.getElementById(`dq-${tableKey(s, z, r, table)}-0`)?.focus());
  }
  const node = "flex w-full min-w-0 items-center gap-1.5 rounded-sm px-1.5 py-1 text-left text-[13px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return <div className="flex h-[calc(100dvh-11rem)] min-h-[520px] flex-row overflow-hidden rounded-md border bg-card shadow-sm">
    <aside aria-label={t("Saha Gezgini")} className="flex w-[30%] min-w-0 flex-col border-r">
      <p className="border-b bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Saha Gezgini")}</p>
      <ul role="tree" className="min-h-0 flex-1 overflow-y-auto p-2">
        {Array.from({ length: STATIONS }, (_, s) => {
          const sOpen = openStations.has(s);
          return <li key={s} role="treeitem" aria-expanded={sOpen}>
            <button type="button" className={`${node} font-medium`} onClick={() => setOpenStations(v => toggle(v, s))}>
              <ChevronRight className={`size-3.5 shrink-0 transition-transform ${sOpen ? "rotate-90" : ""}`} />
              {sOpen ? <FolderOpen className="size-4 shrink-0 text-primary" /> : <Folder className="size-4 shrink-0 text-primary" />}
              <span className="min-w-0 flex-1 truncate">{t("İstasyon {n}", { n: s + 1 })}</span>
              <span className={`text-xs tabular-nums ${textTone(stationPct[s] ?? 0)}`}>%{stationPct[s] ?? 0}</span>
            </button>
            {sOpen && <ul role="group" className="ml-3 border-l pl-1">
              {ZONES.map((name, z) => {
                const zk = `${s}-${z}`;
                const zOpen = openZones.has(zk);
                const zp = prefixPct(`${s}-${z}-`);
                return <li key={name} role="treeitem" aria-expanded={zOpen}>
                  <button type="button" className={node} onClick={() => setOpenZones(v => toggle(v, zk))}>
                    <ChevronRight className={`size-3.5 shrink-0 transition-transform ${zOpen ? "rotate-90" : ""}`} />
                    <span className="min-w-0 flex-1 truncate">{t("Bölge {n}", { n: name })}</span>
                    <span className={`text-xs tabular-nums ${textTone(zp)}`}>%{zp}</span>
                  </button>
                  {zOpen && <ul role="group" className="ml-3 border-l pl-1">
                    {Array.from({ length: ROWS }, (_, r) => {
                      const rk = `${s}-${z}-${r}`;
                      const rOpen = openRows.has(rk) || (station === s && zone === z && row === r);
                      const current = station === s && zone === z && row === r;
                      return <li key={r} role="treeitem" aria-expanded={rOpen}>
                        <button type="button" className={`${node} ${current ? "bg-muted font-semibold" : ""}`} onClick={() => { setOpenRows(v => toggle(v, rk)); pick(s, z, r, 0); }}>
                          <ChevronRight className={`size-3.5 shrink-0 transition-transform ${rOpen ? "rotate-90" : ""}`} />
                          <span className="min-w-0 flex-1 truncate">{t("Sıra {n}", { n: r + 1 })}</span>
                          <span className={`text-xs tabular-nums ${textTone(prefixPct(`${rk}-`))}`}>%{prefixPct(`${rk}-`)}</span>
                        </button>
                        {rOpen && <ul role="group" className="ml-3 border-l pl-1">
                          {Array.from({ length: TABLES }, (_, m) => {
                            const vals = data[tableKey(s, z, r, m)] ?? [];
                            const mp = pct(vals.reduce((a, b) => a + b, 0), TABLE_TOTAL);
                            const sel = current && activeTable === m;
                            return <li key={m} role="treeitem" aria-selected={sel}>
                              <button type="button" className={`${node} ${sel ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`} onClick={() => pick(s, z, r, m)}>
                                <Table2 className="size-3.5 shrink-0" />
                                <span className="min-w-0 flex-1 truncate">{t("Masa {n}", { n: m + 1 })}</span>
                                <span className={`text-xs tabular-nums ${sel ? "" : textTone(mp)}`}>%{mp}</span>
                              </button>
                            </li>;
                          })}
                        </ul>}
                      </li>;
                    })}
                  </ul>}
                </li>;
              })}
            </ul>}
          </li>;
        })}
      </ul>
    </aside>
    <section className="flex w-[70%] min-w-0 flex-col">
      {station === null || zone === null || row === null
        ? <div className="grid flex-1 place-items-center text-sm text-muted-foreground">{t("Soldan bir masa seçin")}</div>
        : <>
          <p className="border-b bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">{t("İstasyon {n}", { n: station + 1 })} › {t("Bölge {n}", { n: ZONES[zone] ?? "" })} › {t("Sıra {n}", { n: row + 1 })}</p>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                  <th className="border px-2 py-1.5">{t("Masa")}</th>
                  {ITEMS.map(item => <th key={item.name} className="border px-2 py-1.5">{t(item.name)} <span className="font-normal">/ {item.target}</span></th>)}
                  <th className="border px-2 py-1.5 text-right">{t("Toplam")}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: TABLES }, (_, m) => {
                  const key = tableKey(station, zone, row, m);
                  const values = data[key] ?? [];
                  const tableName = t("Masa {n}", { n: m + 1 });
                  const total = pct(values.reduce((a, b) => a + b, 0), TABLE_TOTAL);
                  return <tr key={key} className={activeTable === m ? "bg-accent/40" : ""} onFocus={() => setActiveTable(m)}>
                    <th scope="row" className="border px-2 py-1.5 text-left font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isElectron ? (
                            <button 
                              onClick={() => toggleLock(key)}
                              className={`p-1 rounded hover:bg-muted ${locks[key] ? 'text-destructive' : 'text-muted-foreground'}`}
                              title={locks[key] ? "Kilidi Ac" : "Kilitle"}
                            >
                              {locks[key] ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                            </button>
                          ) : (
                            locks[key] && <Lock className="size-4 text-destructive" title="Kilitli" />
                          )}
                          <span>{tableName}</span>
                        </div>
                      </th>
                    {ITEMS.map((item, index) => {
                      const value = values[index] ?? 0;
                      const progress = pct(value, item.target);
                      const id = `${key}-${index}`;
                      const label = `${t("İstasyon {n}", { n: station + 1 })} · ${t("Bölge {n}", { n: ZONES[zone] ?? "" })} · ${t("Sıra {n}", { n: row + 1 })} · ${tableName} · ${t(item.name)}`;
                      return <td key={item.name} className="border px-1.5 py-1 align-top">
                        <div className="flex items-center gap-1">
                          <Input id={`dq-${id}`} aria-label={`${tableName} ${t(item.name)} ${t("miktarı")}`} type="number" inputMode="numeric" min={0} max={item.target} value={value} onFocus={e => e.currentTarget.select()} onChange={e => setItem(key, index, Number(e.target.value))} disabled={locks[key]} className="h-8 min-w-0 flex-1 px-1.5 text-right text-sm tabular-nums md:text-sm disabled:opacity-50 disabled:cursor-not-allowed" />
                          <button type="button" tabIndex={-1} disabled={!faultsReady} title={t("Hata Bildir")} aria-label={`${tableName} ${t(item.name)} ${t("Hata Bildir")}`} onClick={() => onFault(id, label)} className={`grid size-7 shrink-0 place-items-center rounded-sm hover:bg-muted ${reported(id) ? "text-destructive" : "text-muted-foreground"}`}><TriangleAlert className="size-3.5" /></button>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5"><div className="flex-1"><FieldProgress value={progress} height="h-1" label={`${tableName} ${t(item.name)} ${t("ilerleme")}`} /></div><span className={`w-9 text-right text-[11px] tabular-nums ${textTone(progress)}`}>%{progress}</span></div>
                      </td>;
                    })}
                    <td className={`border px-2 py-1.5 text-right font-semibold tabular-nums ${textTone(total)}`}>%{total}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </>}
    </section>
  </div>;
}
