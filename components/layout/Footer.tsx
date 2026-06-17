import { FiZap, FiGithub } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <FiZap className="h-4 w-4 text-white" />
          <span>StellarGig — Trustless Freelancing on Stellar Testnet</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/CodeBugMalik/StellarGig"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <FiGithub className="h-5 w-5" />
          </a>
          <span className="text-xs text-zinc-500 font-medium">
            Built by Pranjal Malik
          </span>
        </div>
      </div>
    </footer>
  );
}
