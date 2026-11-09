import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeLense AI — Developer-First Legacy Codebase, Blast-Radius & Interactive KT Blueprint Copilot',
  description:
    'Developer-first static-analysis intelligence platform transforming legacy codebases into line-cited technical blueprints, live change-impact blast-radius simulations, and characterization test armor using Gemini 2.5 Flash.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-blue-500/30 selection:text-blue-200">
        {children}
      </body>
    </html>
  );
}
