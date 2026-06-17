'use client';

import Link from 'next/link';
import { FiArrowRight, FiCheckCircle, FiDollarSign, FiLock, FiShield, FiZap } from 'react-icons/fi';

const steps = [
  {
    icon: FiZap,
    title: 'Create a Job',
    description: 'Post your project with milestones and set the payment amount in XLM.',
  },
  {
    icon: FiLock,
    title: 'Fund Escrow',
    description: 'Lock funds in a Soroban smart contract — trustless and transparent.',
  },
  {
    icon: FiCheckCircle,
    title: 'Complete & Release',
    description: 'Approve milestones to release payments automatically to the freelancer.',
  },
];

const features = [
  {
    icon: FiShield,
    title: 'Inter-Contract Escrow',
    description: 'Job and Escrow contracts communicate on-chain for trustless payment release.',
  },
  {
    icon: FiDollarSign,
    title: 'Milestone Payments',
    description: 'Break projects into milestones with individual escrow releases.',
  },
  {
    icon: FiZap,
    title: 'Real-time Events',
    description: 'Live event streaming from Soroban contracts with auto-refresh.',
  },
];

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
              Built on Stellar Soroban
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Trustless Freelancing
              <br />
              <span className="gradient-text">on Stellar</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-400 sm:text-xl">
              Create jobs, fund on-chain escrow, complete milestones, and release payments — 
              all powered by Soroban smart contracts with zero intermediaries.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/jobs" className="btn-primary h-12 px-8 text-base">
                Browse Jobs
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/create" className="btn-secondary h-12 px-8 text-base">
                Post a Job
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          How It Works
        </h2>
        <p className="mt-3 text-center text-slate-400">
          Three simple steps to trustless freelance payments.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="card text-center group"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 group-hover:bg-brand-500/20 transition-colors">
                <step.icon className="h-7 w-7" />
              </div>
              <div className="mb-2 text-xs font-bold text-brand-400">
                STEP {index + 1}
              </div>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-surface-700 bg-surface-800/50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            Built for Production
          </h2>
          <p className="mt-3 text-center text-slate-400">
            Advanced Soroban features that make this a real-world dApp.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="card">
                <feature.icon className="mb-3 h-6 w-6 text-brand-400" />
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-purple-500/5 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-3 text-slate-400">
            Connect your Stellar wallet and start posting or accepting jobs today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/create" className="btn-primary h-12 px-8 text-base">
              Create Your First Job
            </Link>
            <Link href="/jobs" className="btn-secondary h-12 px-8 text-base">
              Explore Open Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
