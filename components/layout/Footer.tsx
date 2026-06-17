import { FiZap, FiGithub } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="border-t border-surface-700 bg-surface-900">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <FiZap className="h-4 w-4 text-brand-400" />
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
          <span className="text-xs text-slate-500">
            Built for RiseIn Level 3 Orange Belt
          </span>
        </div>
      </div>
    </footer>
  );
}
