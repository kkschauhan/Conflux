export type Topology = { type: 'wellmixed' | 'smallworld'; k: number; p: number };
export type Config={n:number;w:number;a:number;T:number;sigmaExec:number;sigmaObs:number;
tax:{enabled:boolean;threshold:number;rate:number};reward:{enabled:boolean;threshold:number;rate:number};
punish:{enabled:boolean;cost:number;fine:number;fracPunishers:number};
mix:{CC:number;Egoist:number;Punitive:number;Altruist:number};
topology?: Topology };

function randn(){let u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

function ringNeighbors(n:number, i:number, k:number){
  const half=Math.floor(k/2); const N:number[]=[];
  for(let d=1; d<=half; d++){ N.push((i-d+n)%n); N.push((i+d)%n); }
  return N;
}

function makeSmallWorld(n:number, k:number, p:number){
  const adj: number[][] = Array.from({length:n}, ()=>[]);
  const add=(u:number,v:number)=>{ if(!adj[u].includes(v)) adj[u].push(v); if(!adj[v].includes(u)) adj[v].push(u); };
  const half=Math.floor(k/2);
  for(let i=0;i<n;i++){ for(let d=1; d<=half; d++){ const j=(i+d)%n; add(i,j);} }
  for(let i=0;i<n;i++){ for(let d=1; d<=half; d++){ const j=(i+d)%n; if(Math.random()<p){
    adj[i]=adj[i].filter(x=>x!==j); adj[j]=adj[j].filter(x=>x!==i);
    let r=i, tries=0; while((r===i || adj[i].includes(r)) && tries<5*n){ r=Math.floor(Math.random()*n); tries++; }
    if(r!==i){ add(i,r);} else { add(i,j); }
  } } }
  return adj;
}

export function simulate(cfg:Config){
  const n=cfg.n;
  const agents:{type:string}[]=[]; const push=(t:string,k:number)=>{for(let i=0;i<k;i++)agents.push({type:t});};
  push('Egoist',cfg.mix.Egoist); push('CC',cfg.mix.CC); push('Punitive',cfg.mix.Punitive); push('Altruist',cfg.mix.Altruist);
  while(agents.length<n) agents.push({type:'Egoist'});

  const topo= cfg.topology ?? { type: 'wellmixed', k: 4, p: 0.1 };
  const adj = topo.type==='smallworld' ? makeSmallWorld(n, Math.max(2, topo.k|0), Math.max(0, Math.min(1, topo.p))) : null;

  let beliefs=Array(n).fill(cfg.w/2); const historyC:number[]=[]; const historyPayoffs:number[]=[];
  for(let t=0;t<cfg.T;t++){
    const intended:number[]=[];
    for(let i=0;i<n;i++){
      const typ=agents[i].type;
      if(typ==='Egoist'){ intended.push(bestResponseEgoist(cfg, beliefs[i])); }
      else if(typ==='CC' || typ==='Punitive'){ intended.push(Math.max(0, Math.min(cfg.w, Math.round(beliefs[i])))); }
      else { intended.push(Math.round(0.8*cfg.w)); }
    }
    const contribs=intended.map(c=>Math.max(0,Math.min(cfg.w,c+cfg.sigmaExec*randn())));
    const obs=contribs.map(c=>c+cfg.sigmaObs*randn());
    const C=contribs.reduce((a,b)=>a+b,0);
    let payoff=new Array(n).fill(0);

    if(topo.type==='smallworld' && adj){
      for(let i=0;i<n;i++){
        const group=[i, ...adj[i]];
        const Cg=group.reduce((acc,j)=>acc+contribs[j],0);
        payoff[i]=(cfg.w-contribs[i])+cfg.a*Cg;
      }
      if(cfg.punish.enabled){
        const thr=cfg.tax.threshold*cfg.w;
        for(let i=0;i<n;i++){
          const expectedPun=(adj[i]?.length||0)*cfg.punish.fracPunishers;
          if(obs[i]<thr){ payoff[i]-= expectedPun*cfg.punish.fine / Math.max(1,(adj[i]?.length||1)); }
        }
      }
    } else {
      payoff = contribs.map(c=>(cfg.w-c)+cfg.a*C);
      if(cfg.punish.enabled){
        const thr=cfg.tax.threshold*cfg.w; const expectedPun=Math.max(n-1,0)*cfg.punish.fracPunishers;
        obs.forEach((co,i)=>{ if(co<thr){ payoff[i]-= expectedPun*cfg.punish.fine/n; } });
      }
    }

    if(cfg.tax.enabled){ contribs.forEach((c,i)=>{ if(c<cfg.tax.threshold*cfg.w) payoff[i]-=cfg.tax.rate*(cfg.w-c); }); }
    if(cfg.reward.enabled){ contribs.forEach((c,i)=>{ if(c>=cfg.reward.threshold*cfg.w) payoff[i]+=cfg.reward.rate*c; }); }

    historyC.push(C); const avg=C/n; historyPayoffs.push(payoff.reduce((a,b)=>a+b,0)/n);
    beliefs=beliefs.map(b=>{ const err=Math.abs(b-avg); const lrMin=0.05, lrMax=0.8; const lr=lrMin+(lrMax-lrMin)*(1-Math.exp(-3*err/(1+b))); return (1-lr)*b+lr*avg; });
  }
  const tail=(arr:number[],k:number)=>arr.slice(Math.max(0,arr.length-k));
  const coopTail= tail(historyC,50).reduce((a,b)=>a+b,0)/(Math.max(1,tail(historyC,50).length)*n*cfg.w);
  const payoffTail= tail(historyPayoffs,50).reduce((a,b)=>a+b,0)/Math.max(1,tail(historyPayoffs,50).length);
  const convT= convergence(historyC); return { historyC, historyPayoffs, coopTail, payoffTail, convT };
}

function bestResponseEgoist(cfg:Config, obsAvg:number){ let bestC=0, bestU=-1e18; const n=cfg.n;
  for(let c=0;c<=cfg.w;c++){ const C=c+(n-1)*obsAvg; let u=(cfg.w-c)+cfg.a*C;
    if(cfg.tax.enabled && c<cfg.tax.threshold*cfg.w) u-=cfg.tax.rate*(cfg.w-c);
    if(cfg.reward.enabled && c>=cfg.reward.threshold*cfg.w) u+=cfg.reward.rate*c;
    if(cfg.punish.enabled){ const thr=cfg.tax.threshold*cfg.w; const sigma=Math.max(cfg.sigmaObs,1e-6);
      const pBelow=0.5*(1+Math.tanh((thr-c)/(2*sigma))); const expectedPun=Math.max(n-1,0)*cfg.punish.fracPunishers; u-= expectedPun*pBelow*cfg.punish.fine/n; }
    if(u>bestU){bestU=u; bestC=c;} } return bestC; }

function convergence(series:number[], tol=1e-3, window=20){ const m=Math.max(1,Math.max(...series)); const s=series.map(x=>x/m);
  for(let t=window;t<s.length;t++){ const w=s.slice(t-window,t); const mean=w.reduce((a,b)=>a+b,0)/w.length;
    const sd=Math.sqrt(w.reduce((a,b)=>a+(b-mean)**2,0)/w.length); if(sd<tol) return t; } return NaN; }

export function ensemble(cfg:Config, runs:number){ const rows:any[]=[]; for(let i=0;i<runs;i++){ const r=simulate(cfg);
  rows.push({final_cooperation:r.coopTail, avg_payoff_tail:r.payoffTail, convergence_time:r.convT}); }
  const mean=(k:string)=> rows.reduce((a,b)=>a+b[k],0)/rows.length;
  const std=(k:string)=>{ const m=mean(k); return Math.sqrt(rows.reduce((a,b)=>a+(b[k]-m)**2,0)/rows.length); };
  const ciHalf=(k:string)=> 1.96*std(k)/Math.sqrt(rows.length);
  const ci={ final_cooperation:{mean:mean('final_cooperation'),ci95_halfwidth:ciHalf('final_cooperation')},
             avg_payoff_tail:{mean:mean('avg_payoff_tail'),ci95_halfwidth:ciHalf('avg_payoff_tail')}}; return {df:rows, ci}; }

export function factorialServer(base:Config, taxRates:number[], rewardRates:number[], punishFlags:boolean[], runs:number){
  const data:any[]=[]; for(const tax of taxRates){ for(const rew of rewardRates){ for(const pun of punishFlags){
    const cfg=JSON.parse(JSON.stringify(base)); cfg.tax.enabled=tax>0; cfg.tax.rate=tax; cfg.reward.enabled=rew>0; cfg.reward.rate=rew; cfg.punish.enabled=pun;
    const res=ensemble(cfg, runs); data.push({tax_rate:tax,reward_rate:rew,punish:pun,
      final_coop_mean:res.ci.final_cooperation.mean, final_coop_ci95:res.ci.final_cooperation.ci95_halfwidth,
      payoff_mean:res.ci.avg_payoff_tail.mean, payoff_ci95:res.ci.avg_payoff_tail.ci95_halfwidth}); }}}
  return data;
}