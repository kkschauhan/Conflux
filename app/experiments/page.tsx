'use client';
import { useMemo, useState } from 'react';
import { Config } from '@/lib/sim';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const defaultBase: Config = {
  n: 10, w: 10, a: 0.3, T: 150,
  sigmaExec: 0.2, sigmaObs: 0.0,
  tax: { enabled: false, threshold: 0.3, rate: 0.0 },
  reward: { enabled: false, threshold: 0.7, rate: 0.0 },
  punish: { enabled: false, cost: 0.2, fine: 0.8, fracPunishers: 0.3 },
  mix: { CC: 5, Egoist: 5, Punitive: 0, Altruist: 0 },
  topology: { type: 'wellmixed', k: 4, p: 0.1 },
};

function useHeatmap(rows: any[]) {
  const taxs = Array.from(new Set(rows.map((r:any)=>r.tax_rate))).sort((a:any,b:any)=>a-b);
  const rews = Array.from(new Set(rows.map((r:any)=>r.reward_rate))).sort((a:any,b:any)=>a-b);
  const heatByPunish: Record<string, {xVals:number[], yVals:number[], grid:number[][]}> = {};
  (['false','true'] as const).forEach((p) => {
    const grid = rews.map((rew:number) => taxs.map((tax:number) => {
      const row = rows.find((r:any)=> r.tax_rate===tax && r.reward_rate===rew && String(r.punish)===p);
      return row ? row.final_coop_mean : NaN;
    }));
    heatByPunish[p] = { xVals: taxs, yVals: rews, grid };
  });
  let min=1, max=0;
  rows.forEach((r:any)=>{ min = Math.min(min, r.final_coop_mean); max = Math.max(max, r.final_coop_mean); });
  if (!isFinite(min) || !isFinite(max)) { min=0; max=1; }
  return { heatByPunish, min, max, xVals:taxs, yVals:rews };
}

function cellColor(v: number, min: number, max: number){
  if (!isFinite(v)) return 'transparent';
  const t = (v - min) / Math.max(1e-9, max - min);
  const hue = 0 + (140 * t);
  return `hsl(${hue} 70% 45%)`;
}

function downloadCSV(rows:any[]){
  if(!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => String(r[h])).join(','))).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'factorial_results.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function Experiments(){
  const [base, setBase] = useState<Config>(defaultBase);
  const [taxRates, setTaxRates] = useState<string>('0,0.1,0.2,0.3');
  const [rewardRates, setRewardRates] = useState<string>('0,0.1,0.2');
  const [punishFlags, setPunishFlags] = useState<string>('false,true');
  const [rows, setRows] = useState<any[]>([]);

  const run = async () => {
    const body = {
      base, 
      taxRates: taxRates.split(',').map(s=>parseFloat(s.trim())).filter(v=>!Number.isNaN(v)),
      rewardRates: rewardRates.split(',').map(s=>parseFloat(s.trim())).filter(v=>!Number.isNaN(v)),
      punishFlags: punishFlags.split(',').map(s=>s.trim().toLowerCase()==='true'),
    };
    const res = await fetch('/api/factorial', { method:'POST', body: JSON.stringify(body) });
    const j = await res.json();
    setRows(j.data || []);
  };

  const combos = useMemo(() => Array.from(new Set(rows.map((r:any)=>`R${r.reward_rate}-P${r.punish}`))), [rows]);
  const xVals = useMemo(() => Array.from(new Set(rows.map((r:any)=>r.tax_rate))).sort((a:any,b:any)=>a-b), [rows]);
  const seriesData = useMemo(() => xVals.map((x:number)=>{
    const obj:any = { tax: x };
    combos.forEach(key=>{
      const [R,P] = key.replace('R','').split('-P');
      const row = rows.find((r:any)=>r.tax_rate===x && r.reward_rate===parseFloat(R) && String(r.punish)===P);
      obj[key] = row ? row.final_coop_mean : null;
    });
    return obj;
  }), [xVals, combos, rows]);

  const { heatByPunish, min, max, yVals } = useHeatmap(rows);

  // Ticks for colorbar
  const nTicks = 5;
  const ticks = useMemo(() => Array.from({length: nTicks}, (_, i) => min + (i * (max - min) / Math.max(1, nTicks - 1))), [min, max]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Factorial Experiments</h1>
      <p className="text-slate-300">Sweep tax × reward × punish; optionally toggle small-world topology.</p>

      <section className="rounded-2xl bg-[var(--card)] p-5 space-y-3">
        <h2 className="text-lg font-medium">Base Config</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-sm">a (MPCR)
            <input className="w-full mt-1 bg-slate-800 p-2 rounded" type="number" step="0.05" value={base.a}
              onChange={e=>setBase({...base, a: parseFloat(e.target.value)})} />
          </label>
          <label className="text-sm">Punishers share
            <input className="w-full mt-1 bg-slate-800 p-2 rounded" type="number" step="0.05" value={base.punish.fracPunishers}
              onChange={e=>setBase({...base, punish:{...base.punish, fracPunishers: parseFloat(e.target.value)}})} />
          </label>
          <label className="text-sm">Tax threshold (τ)
            <input className="w-full mt-1 bg-slate-800 p-2 rounded" type="number" step="0.05" min={0} max={1} value={base.tax.threshold}
              onChange={e=>setBase({...base, tax:{...base.tax, threshold: parseFloat(e.target.value)}})} />
          </label>
          <label className="text-sm">Reward threshold (ρ)
            <input className="w-full mt-1 bg-slate-800 p-2 rounded" type="number" step="0.05" min={0} max={1} value={base.reward.threshold}
              onChange={e=>setBase({...base, reward:{...base.reward, threshold: parseFloat(e.target.value)}})} />
          </label>
          <label className="text-sm">Topology
            <select className="w-full mt-1 bg-slate-800 p-2 rounded" value={base.topology?.type||'wellmixed'}
              onChange={e=>setBase({...base, topology:{...(base.topology||{k:4,p:0.1,type:'wellmixed'}), type: e.target.value as any}})}>
              <option value="wellmixed">wellmixed</option>
              <option value="smallworld">smallworld</option>
            </select>
          </label>
          {base.topology?.type==='smallworld' && (
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">k (degree)
                <input className="w-full mt-1 bg-slate-800 p-2 rounded" type="number" step={2} value={base.topology!.k}
                  onChange={e=>setBase({...base, topology:{...base.topology!, k: parseInt(e.target.value||'4',10)}})} />
              </label>
              <label className="text-sm">p (rewire)
                <input className="w-full mt-1 bg-slate-800 p-2 rounded" type="number" step={0.05} value={base.topology!.p}
                  onChange={e=>setBase({...base, topology:{...base.topology!, p: parseFloat(e.target.value||'0.1')}})} />
              </label>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--card)] p-5 space-y-3">
        <h2 className="text-lg font-medium">Design Grid</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="text-sm">Tax rates (comma-separated)
            <input className="w-full mt-1 bg-slate-800 p-2 rounded" value={taxRates} onChange={e=>setTaxRates(e.target.value)} />
          </label>
          <label className="text-sm">Reward rates
            <input className="w-full mt-1 bg-slate-800 p-2 rounded" value={rewardRates} onChange={e=>setRewardRates(e.target.value)} />
          </label>
          <label className="text-sm">Punish flags (true/false)
            <input className="w-full mt-1 bg-slate-800 p-2 rounded" value={punishFlags} onChange={e=>setPunishFlags(e.target.value)} />
          </label>
        </div>
        <div className="flex gap-3">
          <button className="mt-3 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600" onClick={run}>Run factorial</button>
          <button className="mt-3 px-4 py-2 rounded bg-slate-700 hover:bg-slate-600" onClick={()=>downloadCSV(rows)} disabled={!rows.length}>Export CSV</button>
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--card)] p-5 space-y-4">
        <h2 className="text-lg font-medium">Results — Final Cooperation (Lines)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tax" />
              <YAxis domain={[0,1]} />
              <Tooltip />
              <Legend />
              {Array.from(new Set(combos)).map((key)=> (
                <Line key={key} type="monotone" dataKey={key} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--card)] p-5 space-y-3">
        <h2 className="text-lg font-medium">Results — Heatmap (Cooperation)</h2>
        <p className="text-sm text-slate-400">Rows = reward rate, Columns = tax rate. Left = punish=false; Right = punish=true.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {(['false','true'] as const).map((p) => {
            const H = heatByPunish[p];
            return (
              <div key={p}>
                <div className="text-sm mb-2">punish = {p}</div>
                <div className="grid" style={{gridTemplateColumns: `repeat(${H.xVals.length}, minmax(0,1fr))`, gap: '2px'}}>
                  {H.grid.map((row, rIdx) => (
                    <div key={rIdx} className="contents">
                      {row.map((v, cIdx) => (
                        <div key={`${rIdx}-${cIdx}`} className="aspect-square rounded"
                          title={`reward=${H.yVals[rIdx]}, tax=${H.xVals[cIdx]}, coop=${isFinite(v)?v.toFixed(3):'—'}`}
                          style={{ background: cellColor(v, min, max) }} />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                  <span>reward ↑ ({yVals.join(', ')})</span>
                  <span>tax →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Colorbar Legend with dynamic ticks */}
        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-1">Cooperation scale</div>
          <div className="relative">
            <div className="h-3 rounded" style={{background: 'linear-gradient(90deg, hsl(0 70% 45%), hsl(140 70% 45%))'}} />
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative h-full">
                {ticks.map((t, i) => (
                  <div key={i} className="absolute top-0 h-full" style={{left: `${(i/(ticks.length-1))*100}%`, transform: 'translateX(-50%)'}}>
                    <div className="w-px h-3 bg-white/70" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-300 mt-1">
            {ticks.map((t, i) => (<span key={i}>{t.toFixed(2)}</span>))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[var(--card)] p-5 space-y-4">
        <h2 className="text-lg font-medium">Results Table</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-300">
              <tr>
                <th className="py-2 pr-4">Tax</th>
                <th className="py-2 pr-4">Reward</th>
                <th className="py-2 pr-4">Punish</th>
                <th className="py-2 pr-4">Coop (mean)</th>
                <th className="py-2 pr-4">± CI95</th>
                <th className="py-2 pr-4">Payoff (mean)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i)=> (
                <tr key={i} className="border-t border-slate-700">
                  <td className="py-2 pr-4">{r.tax_rate}</td>
                  <td className="py-2 pr-4">{r.reward_rate}</td>
                  <td className="py-2 pr-4">{String(r.punish)}</td>
                  <td className="py-2 pr-4">{r.final_coop_mean.toFixed(3)}</td>
                  <td className="py-2 pr-4">{r.final_coop_ci95.toFixed(3)}</td>
                  <td className="py-2 pr-4">{r.payoff_mean.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
