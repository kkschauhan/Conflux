'use client';
import { useMemo, useState } from 'react';
import { simulate, Config } from '@/lib/sim';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const defaultCfg: Config = {
  n: 10, w: 10, a: 0.3, T: 200,
  sigmaExec: 0.2, sigmaObs: 0.0,
  tax: { enabled: false, threshold: 0.3, rate: 0.2 },
  reward: { enabled: false, threshold: 0.7, rate: 0.1 },
  punish: { enabled: false, cost: 0.2, fine: 0.8, fracPunishers: 0.0 },
  mix: { CC: 6, Egoist: 4, Punitive: 0, Altruist: 0 },
  topology: { type: 'wellmixed', k: 4, p: 0.1 },
};

function Slider({label, min, max, step, value, onChange}:{label:string,min:number,max:number,step:number,value:number,onChange:(v:number)=>void}){
  return (<div className="flex items-center gap-3">
    <div className="w-56 text-sm text-slate-300">{label}: <span className="font-mono text-slate-100">{typeof value==='number'?value.toFixed(2):value}</span></div>
    <input className="w-full" type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(parseFloat(e.target.value))}/>
  </div>);
}
function Toggle({label, checked, onChange}:{label:string,checked:boolean,onChange:(v:boolean)=>void}){
  return (<label className="flex items-center gap-3 text-sm">
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} />
    <span>{label}</span>
  </label>);
}

export default function Page(){
  const [cfg, setCfg] = useState<Config>(defaultCfg);
  const result = useMemo(()=> simulate(cfg), [cfg]);
  const series = result.historyC.map((C,i)=>({t:i, coop: C/(cfg.n*cfg.w), payoff: result.historyPayoffs[i]}));
  const smallWorld = cfg.topology?.type==='smallworld';

  // Compare Topologies (same cfg but flip topology)
  // const cfgWM = { ...cfg, topology: { ...(cfg.topology||{k:4,p:0.1,type:'wellmixed'}), type:'wellmixed' } };
  // const cfgSW = { ...cfg, topology: { ...(cfg.topology||{k:4,p:0.1,type:'wellmixed'}), type:'smallworld' } };
  const cfgWM: Config = {
  ...cfg,
  topology: {
    ...(cfg.topology ?? { k: 4, p: 0.1, type: 'wellmixed' as const }),
    type: 'wellmixed' as const,
  },
};

const cfgSW: Config = {
  ...cfg,
  topology: {
    ...(cfg.topology ?? { k: 4, p: 0.1, type: 'wellmixed' as const }),
    type: 'smallworld' as const,
  },
};

  const resWM = useMemo(()=> simulate(cfgWM), [cfgWM]);
  const resSW = useMemo(()=> simulate(cfgSW), [cfgSW]);
  const compareSeries = resWM.historyC.map((C,i)=> ({
    t: i,
    wellmixed: C/(cfg.n*cfg.w),
    smallworld: (resSW.historyC[i] ?? resSW.historyC.at(-1) ?? 0)/(cfg.n*cfg.w)
  }));

  return (<main className="max-w-6xl mx-auto p-6">
    <h1 className="text-3xl font-semibold">Policy levers. Collective outcomes.</h1>
    <p className="text-slate-300 mt-2">Explore tax, reward, punishment, noise, and network topology.</p>

    <section className="grid lg:grid-cols-2 gap-6 mt-6">
      <div className="rounded-2xl bg-[var(--card)] p-5 space-y-4">
        <h2 className="text-lg font-medium">Mechanisms & Topology</h2>
        <div className="flex flex-wrap gap-6">
          <Toggle label="Tax" checked={cfg.tax.enabled} onChange={v=>setCfg({...cfg, tax:{...cfg.tax, enabled:v}})} />
          <Toggle label="Reward" checked={cfg.reward.enabled} onChange={v=>setCfg({...cfg, reward:{...cfg.reward, enabled:v}})} />
          <Toggle label="Punish" checked={cfg.punish.enabled} onChange={v=>setCfg({...cfg, punish:{...cfg.punish, enabled:v}})} />
          <Toggle label="Small-world topology" checked={smallWorld} onChange={v=>setCfg({...cfg, topology:{...(cfg.topology||{k:4,p:0.1,type:'wellmixed'}), type: (v?'smallworld':'wellmixed')}})} />
        </div>
        <Slider label="a (MPCR)" min={0} max={1.2} step={0.05} value={cfg.a} onChange={v=>setCfg({...cfg, a:v})} />
        <Slider label="Tax threshold (τ)" min={0} max={1.0} step={0.05} value={cfg.tax.threshold} onChange={v=>setCfg({...cfg, tax:{...cfg.tax, threshold:v}})} />
        <Slider label="Tax rate" min={0} max={0.6} step={0.02} value={cfg.tax.rate} onChange={v=>setCfg({...cfg, tax:{...cfg.tax, rate:v}})} />
        <Slider label="Reward threshold (ρ)" min={0} max={1.0} step={0.05} value={cfg.reward.threshold} onChange={v=>setCfg({...cfg, reward:{...cfg.reward, threshold:v}})} />
        <Slider label="Reward rate" min={0} max={0.6} step={0.02} value={cfg.reward.rate} onChange={v=>setCfg({...cfg, reward:{...cfg.reward, rate:v}})} />
        <Slider label="Punish fine" min={0} max={1.2} step={0.05} value={cfg.punish.fine} onChange={v=>setCfg({...cfg, punish:{...cfg.punish, fine:v}})} />
        <Slider label="Punishers share" min={0} max={1} step={0.05} value={cfg.punish.fracPunishers} onChange={v=>setCfg({...cfg, punish:{...cfg.punish, fracPunishers:v}})} />
        <Slider label="σ_exec (noise)" min={0} max={1.0} step={0.05} value={cfg.sigmaExec} onChange={v=>setCfg({...cfg, sigmaExec:v})} />
        <Slider label="σ_obs (obs noise)" min={0} max={1.0} step={0.05} value={cfg.sigmaObs} onChange={v=>setCfg({...cfg, sigmaObs:v})} />
        {smallWorld && (<>
          <Slider label="k (degree)" min={2} max={Math.max(2, cfg.n-1)} step={2} value={cfg.topology!.k} onChange={v=>setCfg({...cfg, topology:{...cfg.topology!, k:Math.round(v)}})} />
          <Slider label="p (rewire prob)" min={0} max={1} step={0.05} value={cfg.topology!.p} onChange={v=>setCfg({...cfg, topology:{...cfg.topology!, p:v}})} />
        </>)}
      </div>
      <div className="rounded-2xl bg-[var(--card)] p-5 space-y-2">
        <h2 className="text-lg font-medium">Population Mix</h2>
        <Slider label="CC" min={0} max={cfg.n} step={1} value={cfg.mix.CC} onChange={v=>setCfg({...cfg, mix:{...cfg.mix, CC:Math.round(v)}})} />
        <Slider label="Egoist" min={0} max={cfg.n} step={1} value={cfg.mix.Egoist} onChange={v=>setCfg({...cfg, mix:{...cfg.mix, Egoist:Math.round(v)}})} />
        <Slider label="Punitive" min={0} max={cfg.n} step={1} value={cfg.mix.Punitive} onChange={v=>setCfg({...cfg, mix:{...cfg.mix, Punitive:Math.round(v)}})} />
        <Slider label="Altruist" min={0} max={cfg.n} step={1} value={cfg.mix.Altruist} onChange={v=>setCfg({...cfg, mix:{...cfg.mix, Altruist:Math.round(v)}})} />
        <p className="text-xs text-slate-400">Ensure CC+Egoist+Punitive+Altruist = n ({cfg.n}).</p>
      </div>
    </section>

    <section className="mt-6 rounded-2xl bg-[var(--card)] p-5">
      <h2 className="text-lg font-medium mb-3">Cooperation & Payoff</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="t" />
            <YAxis yAxisId="left" domain={[0,1]} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="coop" dot={false} stroke="#60a5fa" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="payoff" dot={false} stroke="#39FF14" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>

    <section className="mt-6 rounded-2xl bg-[var(--card)] p-5">
      <h2 className="text-lg font-medium mb-3">Compare Topologies (same settings)</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={compareSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="t" />
            <YAxis domain={[0,1]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="wellmixed" dot={false} stroke="#60a5fa" strokeWidth={2} />
            <Line type="monotone" dataKey="smallworld" dot={false} stroke="#39FF14" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  </main>);
}
