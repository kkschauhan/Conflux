export const metadata = {
  title: 'Contact — Conflux',
  description: 'Get in touch with the developer of Conflux',
};

function Card({ title, subtitle, href, children }:{
  title: string; subtitle?: string; href?: string; children?: React.ReactNode
}){
  const content = (
    <div className="rounded-2xl bg-[var(--card)] p-5 shadow-sm hover:shadow transition-shadow break-words">
      <div className="text-sm uppercase tracking-wide text-slate-400">{subtitle}</div>
      <h3 className="text-xl font-semibold mt-1 break-all">{title}</h3>
      {children ? <div className="mt-2 text-slate-300">{children}</div> : null}
    </div>
  );
  if(href){
    return <a href={href} target="_blank" rel="noreferrer" className="block">{content}</a>;
  }
  return content;
}

export default function ContactPage(){
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="text-slate-300">Questions, feedback, or collaboration ideas for <strong>Conflux</strong>? Reach out below.</p>
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        <Card title="@LinkedIn/KKSChauhan" subtitle="LinkedIn" href="https://www.linkedin.com/in/kkschauhan">
          <p>Connect with me on LinkedIn.</p>
        </Card>

        <Card title="@Github/KKSChauhan" subtitle="GitHub" href="https://github.com/kkschauhan">
          <p>check out my GitHub.</p>
        </Card>

        <Card title="kshitij7chauhan@gmail.com" subtitle="Email" href="mailto:kshitij7chauhan@gmail.com">
          <p>Drop me a line anytime.</p>
        </Card>
      </section>

      <section className="rounded-2xl bg-[var(--card)] p-5 space-y-3">
        <h2 className="text-lg font-semibold">What to include</h2>
        <ul className="list-disc pl-6 text-slate-300 space-y-1">
          <li>Short context about your use case or question</li>
          <li>Screenshots or settings that help reproduce behavior (if reporting an issue)</li>
          <li>Preferred follow‑up method</li>
        </ul>
      </section>
    </main>
  );
}
