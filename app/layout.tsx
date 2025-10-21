import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Conflux',
  description: 'Where incentives meet behavior.',
};

function Nav(){
  return (
    <header className="sticky top-0 z-10 backdrop-blur border-b border-slate-800 bg-black/20">
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">Conflux</Link>
        <div className="flex gap-6 text-sm">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/experiments" className="hover:underline">Experiments</Link>
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </div>
      </nav>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-slate-400 flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:items-center">
            <span>© Conflux</span>
            <span className="opacity-80">
              Developed by <a className="underline decoration-slate-600 hover:decoration-slate-300 transition-colors"
                href="https://www.linkedin.com/in/kkschauhan" target="_blank" rel="noreferrer">@Linkedin/KKSChauhan</a> | <a
                className="underline decoration-slate-600 hover:decoration-slate-300 transition-colors"
                href="https://github.com/kkschauhan" target="_blank" rel="noreferrer">@Github/KKSChauhan</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
