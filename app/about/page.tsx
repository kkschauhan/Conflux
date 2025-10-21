import Link from 'next/link';

export const metadata = {
  title: 'About Conflux',
  description: 'What Conflux is and how its parameters affect outcomes',
};

function Section({title, children}:{title:string; children:React.ReactNode}){
  return (
    <section className="rounded-2xl bg-[var(--card)] p-6 space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function AboutPage(){
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Conflux — About & FAQ</h1>
      <p className="text-slate-300">
        Conflux is an interactive lab for <em>public-goods dynamics</em>. It lets you simulate
        how incentives (tax, reward, punishment), network topology, and behavioral rules
        shape cooperation and welfare over time.
      </p>

      <Section title="Quick Tour">
        <ul className="list-disc pl-6 space-y-1 text-slate-300">
          <li><strong>Home</strong>: play with parameters and watch curves evolve.</li>
          <li><strong>Experiments</strong>: run grid sweeps and visualize outcomes with a heatmap.</li>
          <li><strong>Compare Topologies</strong>: overlay well-mixed vs small-world for the same settings.</li>
        </ul>
        <div className="text-sm text-slate-400">
          Try the <Link className="underline" href="/">Simulator</Link> or the <Link className="underline" href="/experiments">Factorial Experiments</Link>.
        </div>
      </Section>

      <Section title="Model Overview">
        <p className="text-slate-300">
          In each round, agents receive an endowment <code>w</code> and choose a contribution <code>c<sub>i</sub>∈[0,w]</code>.
          The sum of contributions is multiplied by a marginal per-capita return (<code>a</code>) and redistributed.
          Policies add incentives: taxes for under-contributing, rewards for generous contributors, and
          punishment for defectors. Noise captures execution jitter and imperfect observation.
        </p>
      </Section>

      <Section title="Parameters & Implications">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Core</h3>
            <table className="w-full text-sm">
              <tbody className="align-top">
                <tr><td className="py-1 pr-3 font-mono">n</td><td>Population size. Larger <em>n</em> increases payoff dilution; cooperation is harder without mechanisms.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">w</td><td>Per-round endowment. Upper bound on each contribution.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">a (MPCR)</td><td>Marginal per-capita return. If <em>a&lt;1</em>, pure egoists defect unless incentives counterbalance.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">T</td><td>Number of rounds. Longer horizons allow beliefs to stabilize.</td></tr>
              </tbody>
            </table>
            <h3 className="font-semibold mt-4 mb-2">Noise</h3>
            <table className="w-full text-sm">
              <tbody className="align-top">
                <tr><td className="py-1 pr-3 font-mono">σ_exec</td><td>Execution noise: agents miss intended contribution (trembling-hand). Can accidentally nudge cooperation.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">σ_obs</td><td>Observation noise: misperceive others’ contributions. Increases misclassification under punishment.</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Mechanisms</h3>
            <table className="w-full text-sm">
              <tbody className="align-top">
                <tr><td className="py-1 pr-3 font-mono">Tax (on low c)</td><td>Activated when <code>c&lt;τ·w</code>, levies <code>rate·(w−c)</code>. Discourages free-riding.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">τ (threshold)</td><td>Low contributions below <code>τ</code> are penalized. Higher τ is harsher.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">Reward (for high c)</td><td>Activated when <code>c≥ρ·w</code>, grants <code>rate·c</code>. Encourages generosity.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">ρ (threshold)</td><td>Higher ρ targets only top contributors; lower ρ spreads rewards widely.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">Punishment</td><td>Expected fine on under-contributors. Effective but may reduce welfare if overused under noise.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">fine</td><td>Penalty magnitude on defectors.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">punishers share</td><td>Share of potential punishers in the population/neighborhood.</td></tr>
              </tbody>
            </table>
            <h3 className="font-semibold mt-4 mb-2">Topology</h3>
            <table className="w-full text-sm">
              <tbody className="align-top">
                <tr><td className="py-1 pr-3 font-mono">well-mixed</td><td>Everyone interacts with everyone. One global public good.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">small-world</td><td>Watts–Strogatz neighbors + rewiring. Local public goods; clusters can sustain cooperation.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">k</td><td>Initial ring degree (even). Higher k broadens neighborhoods.</td></tr>
                <tr><td className="py-1 pr-3 font-mono">p</td><td>Rewire probability. Larger p reduces path length; may mix behavior faster.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section title="Agent Types">
        <ul className="list-disc pl-6 space-y-1 text-slate-300">
          <li><strong>Egoist</strong>: best-response to current beliefs, accounting for mechanisms and risks.</li>
          <li><strong>Conditional Cooperator</strong>: tends toward the believed average contribution.</li>
          <li><strong>Punitive Cooperator</strong>: like CC, but benefits from punishing defectors (modeled as expected risk).</li>
          <li><strong>Altruist</strong>: contributes high fraction regardless of beliefs (e.g., 0.8·w).</li>
        </ul>
      </Section>

      <Section title="Common Patterns & Tips">
        <ul className="list-disc pl-6 space-y-1 text-slate-300">
          <li>When <em>a&lt;1</em>, incentives are needed for egoists to cooperate.</li>
          <li>Under high <code>σ_obs</code>, generous punishment backfires due to misclassification.</li>
          <li>Small-world topology can preserve cooperative clusters even if global cooperation is low.</li>
          <li>Rewards often lift average welfare, taxes/punishment can lift cooperation but may reduce welfare if too harsh.</li>
        </ul>
      </Section>

      <Section title="FAQ">
        <div className="space-y-3">
          <details className="group rounded-lg border border-slate-800 p-4">
            <summary className="cursor-pointer select-none text-slate-100">Is the punishment stage explicit?</summary>
            <p className="mt-2 text-slate-300">For speed and clarity, Conflux uses an expected-penalty heuristic based on punisher share and thresholds. A full second-stage model is on the roadmap.</p>
          </details>
          <details className="group rounded-lg border border-slate-800 p-4">
            <summary className="cursor-pointer select-none text-slate-100">How are beliefs updated?</summary>
            <p className="mt-2 text-slate-300">Agents track a scalar belief about average contributions and update with an adaptive learning rate that increases with prediction error.</p>
          </details>
          <details className="group rounded-lg border border-slate-800 p-4">
            <summary className="cursor-pointer select-none text-slate-100">Why two topologies?</summary>
            <p className="mt-2 text-slate-300">Well-mixed approximates mean-field interaction; small-world captures local clustering and short paths—good proxies for many real networks.</p>
          </details>
          <details className="group rounded-lg border border-slate-800 p-4">
            <summary className="cursor-pointer select-none text-slate-100">Can I export results?</summary>
            <p className="mt-2 text-slate-300">Yes—use CSV export on the Experiments page. For full reproducibility, save the config alongside results.</p>
          </details>
        </div>
      </Section>
    </main>
  );
}
