# ⚡ StellarGig

<div align="center">

**A Decentralized Escrow Platform for the Future of Freelance Work**

*Trustless milestone payments secured by Stellar Soroban smart contracts*

[![Live Demo](https://img.shields.io/badge/Live_Demo-stellar--gig.netlify.app-6366f1?style=for-the-badge&logo=netlify)](https://stellar-gig.netlify.app/)
[![GitHub](https://img.shields.io/badge/Source_Code-CodeBugMalik%2FStellarGig-181717?style=for-the-badge&logo=github)](https://github.com/CodeBugMalik/StellarGig)
[![Network](https://img.shields.io/badge/Network-Stellar_Testnet-00B4D8?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet)
[![Built for RiseIn](https://img.shields.io/badge/Built_for-RiseIn_Level_4-f59e0b?style=for-the-badge)](https://www.risein.com/)

</div>

---

## 📋 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Why Stellar?](#-why-stellar)
3. [Live Deployment](#-live-deployment)
4. [Contract Addresses & Transactions](#-contract-addresses--transactions)
5. [Architecture](#-architecture)
6. [Smart Contracts](#-smart-contracts)
7. [Production Hardening (Level 4)](#-production-hardening-level-4)
8. [Tech Stack](#-tech-stack)
9. [Project Structure](#-project-structure)
10. [Testing](#-testing)
11. [CI/CD Pipeline](#-cicd-pipeline)
12. [Local Development](#-local-development)
13. [Roadmap](#-roadmap)
14. [Author](#-author)

---

## 🔴 Problem Statement

The **$1.5 trillion freelance economy** is structurally broken and systematically favours centralized intermediaries over the workers who power it.

| Issue | Impact |
|-------|--------|
| **Platform Fees** | Upwork & Fiverr charge 10–20% of every payment, directly extracted from freelancer earnings |
| **Payment Risk** | 71% of freelancers report non-payment or severely delayed payments after delivering work |
| **Settlement Delays** | Cross-border payments via legacy banking rails take 5–14 business days and carry steep wire fees |
| **Opaque Disputes** | Centralized dispute resolution is slow, biased, and non-auditable, leaving freelancers vulnerable |

**StellarGig** eliminates the intermediary layer entirely by replacing it with programmable, auditable Soroban smart contracts. Clients fund an on-chain escrow vault before work begins; funds are automatically released to the freelancer upon milestone approval — no platform fees, no payment delays, no trust required.

---

## 🌟 Why Stellar?

StellarGig is not a generic blockchain application. It is a protocol that specifically requires Stellar's unique network architecture:

| Stellar Property | StellarGig Benefit |
|-----------------|-------------------|
| **~5 second finality** | Freelancers receive instant payouts instead of waiting days |
| **Sub-cent fees ($0.00001)** | Enables micro-milestones (e.g. $5 for a quick sketch) — economically unviable on Ethereum |
| **Soroban Inter-Contract Calls** | Our Job Contract securely commands the Escrow Vault Contract atomically on-chain |
| **SEP Anchor Integrations** | Future fiat on/off-ramp support for non-crypto-native users in emerging markets |
| **Fee Bump Transactions** | Path to gasless onboarding — sponsor transaction fees for new freelancers |

---

## 🌐 Live Deployment

| Resource | Link |
|----------|------|
| 🌍 **Live dApp** | [stellar-gig.netlify.app](https://stellar-gig.netlify.app/) |
| 🎬 **Demo Video** | [Google Drive — Walkthrough Recording](https://drive.google.com/file/d/1TVddXfG497UZLqCkzC25VmloXoKOw1zR/view?usp=sharing) |
| 📊 **Pitch Deck / PPT** | [Google Slides Link](https://drive.google.com/file/d/1KuJFOCBRJhovTVc6QowMoEuYJcNH35e_/view?usp=sharing) |
| 💻 **GitHub Repo** | [CodeBugMalik/StellarGig](https://github.com/CodeBugMalik/StellarGig) |
| 📋 **User Feedback Form** | [StellarGig Feedback — Google Forms](https://forms.gle/xz5QS6Fa4Kdzaf5Y6) |
| 📊 **Onboarded Users & Wallet Interactions** | [Responses Spreadsheet — Google Sheets](https://docs.google.com/spreadsheets/d/1IG7g996os6GVvmBCDLCtaIklxkw8zj31k_4zxBeq6GA/edit?usp=sharing) |

---

## 🛡️ August Submission Updates

### Bug Fixes

| File | Bug | Fix |
|------|-----|-----|
| `lib/constants.ts` | `HORIZON_URL` was hardcoded with no env override | Made it env-aware with `NEXT_PUBLIC_HORIZON_URL` fallback |
| `components/dashboard/EarningsChart.tsx` | Y-axis used `Ξ` (Ethereum symbol) instead of XLM | Changed ticker format to plain numeric (XLM shown in tooltip) |
| `app/jobs/[id]/page.tsx` | Cancel button guard checked `!job.freelancer` — always truthy because contract sets freelancer=client as placeholder | Changed guard to `job.freelancer === job.client` |
| `app/jobs/[id]/page.tsx` | `setInterval` poll for transaction status never cleaned up on unmount | Added `useRef` + `useEffect` cleanup; stored interval in `pollRef` |
| `components/wallet/WalletButton.tsx` | Wallet dropdown stayed open when clicking outside | Added `useRef` + `mousedown` listener to close on outside click |
| `lib/contracts/job-client.ts` | `parseJobStatus` / `parseMilestoneStatus` silently defaulted on unknown values | Added `console.warn` before fallback to surface contract mismatches |
| `.env.example` | Missing `NEXT_PUBLIC_HORIZON_URL` env variable documentation | Added the variable to `.env.example` |

### New Features

- **Network Status Banner** (`components/layout/NetworkStatusBanner.tsx`)
  - Displays a visible "You are on Stellar Testnet" warning banner at the top of every page
  - Automatically hidden on mainnet — zero config required
  - Integrated into root layout (`app/layout.tsx`)

- **Transaction History Component** (`components/dashboard/TransactionHistory.tsx`)
  - Shows a scrollable list of recent on-chain transactions with explorer links
  - Compact card design matching the existing dashboard aesthetic
  - Empty state guidance for new users

- **Reusable Poll Cleanup Pattern**
  - Replaced inline `setInterval` in `app/create/page.tsx` and `app/jobs/[id]/page.tsx` with ref-tracked intervals
  - Ensures all polling stops when component unmounts — eliminates memory leaks

- **Contract Status Logging**
  - Added developer-visible `console.warn` for unrecognized contract enum values
  - Helps catch contract-frontend version mismatches during development

### Test Additions

| Test File | What It Covers |
|-----------|----------------|
| `__tests__/components/EscrowStatusBar.test.tsx` | Zero state, partial release, full release, non-numeric input handling |
| `__tests__/lib/contract-parsers.test.ts` | All job/milestone status mappings, unknown status fallback, stroops round-trip, large values |
| `__tests__/components/NetworkStatusBanner.test.tsx` | Testnet banner renders with correct label and warning text |

## 🔗 Contract Addresses & Transactions

All contracts are deployed and cross-initialized on the **Stellar Testnet** using the `pranjal` developer identity.

### Deployed Contract IDs

| Contract | Address |
|----------|---------|
| **Escrow Vault Contract** | `CDQTRHKGXJDNUQMJ2MNQVSGB5SOEESSQGU65EX63G5Q5ZSS5ZTP5UCG7` |
| **Job Manager Contract** | `CB5ZWJ5F3ZBKQ2FOKYGEHW6RFX7F6ACKY52CKYVBESTFEHZUSSC4WTQX` |

### On-Chain Deployment Transactions

| Action | Transaction Hash |
|--------|-----------------|
| **Escrow Contract — Upload & Deploy** | [`1c24ec3f...3207bf`](https://stellar.expert/explorer/testnet/tx/1c24ec3f3447acded512a4a61b78588231fa3ed72f92c13fa658a9842f3207bf) |
| **Job Contract — Upload & Deploy** | [`ebc4756e...0446a`](https://stellar.expert/explorer/testnet/tx/ebc4756e1e5a6bbadb5a526ff25412a8c411ee886024af3d85c0592c8b90446a) |
| **Escrow Contract — Initialize (cross-link to Job)** | [`2bd6535b...2923e`](https://stellar.expert/explorer/testnet/tx/2bd6535bcec146191ddb260a66dca8ef59bfe9358e0fd0db9c7877aa2c82923e) |
| **Job Contract — Initialize (cross-link to Escrow)** | [`1feb4620...be6e8`](https://stellar.expert/explorer/testnet/tx/1feb462095db6093100083485fb138a1aafb688006e0ae0da32848d44dcbe6e8) |

---



## 🏗️ Architecture

StellarGig is composed of two Soroban smart contracts that communicate via Inter-Contract Calls (ICC), and a Next.js frontend that builds and submits signed Stellar transactions.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                             │
│                                                                     │
│  Landing │ Browse Jobs │ Job Detail │ Create Job │ Dashboard        │
│                      StellarWalletsKit                              │
│                  (Freighter / xBull / Albedo)                       │
└──────────────────┬─────────────────────────────┬───────────────────┘
                   │ TypeScript Contract Clients  │
          ┌────────▼─────────┐         ┌─────────▼────────┐
          │   Job Contract   │──ICC──→ │ Escrow Contract  │
          │                  │         │                  │
          │  create_job()    │         │  fund_job()      │
          │  accept_job()    │         │  release_        │
          │  submit_         │         │    milestone()   │
          │    milestone()   │         │  refund()        │
          │  approve_        │         │  get_escrow()    │
          │    milestone()   │         │                  │
          │  dispute_        │         │                  │
          │    milestone()   │         │                  │
          │  resolve_        │         │                  │
          │    dispute()     │         │                  │
          │  cancel_job()    │         │                  │
          │  mark_funded()   │         │                  │
          └──────────────────┘         └──────────────────┘
                            Stellar Testnet
```

### Inter-Contract Communication (ICC) Flow

The ICC design is the architectural centrepiece of StellarGig. All escrow state changes are triggered atomically by the Job Contract — there is no way for the frontend to manipulate escrow funds independently.

```
Step 1:  Client calls create_job()         → Job created with status: Open
Step 2:  Client calls fund_job()           → Escrow locks XLM
                                             Escrow ICCs → Job mark_funded()
                                             Job status: Funded (atomic)
Step 3:  Freelancer calls accept_job()     → Job status: InProgress
Step 4:  Freelancer calls submit_          → Job status: UnderReview
           milestone()
Step 5a: Client calls approve_milestone()  → Job ICCs → Escrow release_milestone()
                                             Freelancer receives XLM instantly
Step 5b: Client calls dispute_milestone()  → Job status: Disputed
         Client calls resolve_dispute()    → Approve: payment released via ICC
                                             Reject: milestone reset to Pending
Step 6:  Client calls cancel_job()         → Job ICCs → Escrow refund()
                                             Client receives full refund
```

---

## 📜 Smart Contracts

### Job Contract (`CB5ZWJ5F3ZBKQ2FOKYGEHW6RFX7F6ACKY52CKYVBESTFEHZUSSC4WTQX`)

Manages the full lifecycle of every freelance engagement on-chain.

| Function | Access | Description |
|----------|--------|-------------|
| `initialize()` | Admin (once) | Set the cross-linked Escrow Contract address |
| `create_job()` | Client | Post a new job with title, description, and milestones (1–10 max) |
| `accept_job()` | Freelancer | Accept a funded job (self-dealing guard enforced) |
| `submit_milestone()` | Freelancer | Submit a milestone for client review |
| `approve_milestone()` | Client | Approve milestone → ICC triggers escrow release |
| `dispute_milestone()` | Client | Raise a dispute on a submitted milestone |
| `resolve_dispute()` | Client | Approve (release payment) or reject (reset to Pending) |
| `cancel_job()` | Client | Cancel open/funded job → ICC triggers full escrow refund |
| `mark_funded()` | Escrow Contract only | Atomically marks job as Funded (auth-restricted ICC endpoint) |

**Security Hardening applied in Level 4:**
- Initialization guard — prevents double-initialization after deployment
- Input validation — non-empty title/description, positive milestone amounts, max 10 milestones
- Self-dealing guard — client cannot accept their own job as freelancer
- Caller authorization on `mark_funded` — only the registered Escrow Contract can call this
- Typed `#[contracterror]` enum — replaces all raw `panic!` strings
- Instance TTL extension — `extend_ttl(4096, 50000)` on every state-changing function

### Escrow Contract (`CDQTRHKGXJDNUQMJ2MNQVSGB5SOEESSQGU65EX63G5Q5ZSS5ZTP5UCG7`)

Holds XLM in a secure vault and releases it only on instruction from the Job Contract.

| Function | Access | Description |
|----------|--------|-------------|
| `initialize()` | Admin (once) | Set the cross-linked Job Contract address |
| `fund_job()` | Client | Lock XLM for a job → ICC calls `mark_funded()` on Job Contract |
| `release_milestone()` | Job Contract only | Transfer milestone amount to freelancer wallet |
| `refund()` | Job Contract only | Return remaining locked XLM to client |
| `get_escrow()` | Public (read) | Query current escrow state for a job |
| `get_total_escrowed()` | Public (read) | Query total XLM currently held in the vault |

---

## 🛡️ Production Hardening (Level 4)

The following security audits and production improvements were implemented and tested in Level 4:

### Smart Contract Security

| Fix | Contract | Description |
|-----|----------|-------------|
| Initialization Guard | Both | Prevents re-initialization after first deploy |
| `mark_funded` Auth | Job | Only the registered Escrow contract can transition job to Funded |
| Atomic Funding Flow | Escrow | `fund_job()` atomically ICCs `mark_funded()` — eliminates sync bugs |
| Milestone Bounds Check | Job | Validates 1–10 milestones, non-zero amounts, non-empty strings |
| Self-Dealing Guard | Job | Client cannot accept their own job as the freelancer |
| `resolve_dispute()` | Job | Client can approve (release payment) or reject (reset milestone) |
| Caller Restriction | Escrow | `release_milestone()` and `refund()` restricted to the Job Contract |
| Instance TTL Extension | Both | `extend_ttl(4096, 50000)` prevents ledger data expiry |
| Typed Error Enum | Both | `#[contracterror]` enum replaces all raw `panic!` strings |

### Frontend Production Quality

| Fix | File | Description |
|-----|------|-------------|
| Memory Leak Fix | `app/create/page.tsx` | Polling interval cleared on component unmount via `useRef` |
| N+1 Query Fix | `hooks/useJobs.ts` | Jobs fetched in parallel with `Promise.all` instead of sequential awaits |
| Session Key Validation | `hooks/useWallet.ts` | Public key regex check (`/^G[A-Z2-7]{55}$/`) before loading from session |
| Global Error Boundary | `components/ui/ErrorBoundary.tsx` | React class `ErrorBoundary` wrapping the full app layout |
| Loading Skeletons | `components/escrow/EscrowStatus.tsx` | Skeleton loaders prevent UI flashing on data fetch |
| Confirmation Modal | `components/ui/ConfirmModal.tsx` | Transaction warning dialog with action name and XLM amount before signing |
| scvVec Serialization Fix | `lib/contracts/job-client.ts` | Fixed `Bad union switch: 1` by using `scvVec` directly over `nativeToScVal` for milestone args |

### Monitoring & Analytics

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **PostHog** | Product analytics — user flows and feature engagement | `lib/analytics.ts` — tracks `wallet_connected`, `job_created`, `job_action_executed` |
| **Sentry** | Error monitoring and crash reporting | `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts` |
| **Lighthouse CI** | Automated performance and accessibility audits in CI | `lighthouserc.json` — runs in `ci.yml` on every push |

---

## 📸 Submission Screenshots

### 📱 Mobile Responsive UI

<p align="center">
  <img src="submission%20assets/mobuiss1.png" width="375" alt="Mobile UI Screenshot 1" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="submission%20assets/mobuiss2.png" width="375" alt="Mobile UI Screenshot 2" />
</p>

### 🔄 CI/CD Pipeline

<p align="center">
  <img src="submission%20assets/cicd%20ss.png" alt="CI/CD Pipeline Run" />
</p>

### 🧪 Test Suite Results

<p align="center">
  <img src="submission%20assets/test%20ss.png" alt="Test Execution Output" />
</p>

---

## 🧪 Testing

### Test Summary

| Suite | Tests | Status |
|-------|-------|--------|
| Frontend (Vitest) | 14 tests | ✅ All Passing |
| Escrow Contract (Rust) | 3 tests | ✅ All Passing |
| Job Contract (Rust) | 10 tests | ✅ All Passing |
| **Total** | **27 tests** | ✅ **27/27 Passing** |

### Frontend Tests (Vitest)

```bash
npm run test
```

| Test File | Coverage |
|-----------|----------|
| `Badge.test.tsx` | Status badge rendering across all 7 states |
| `MilestoneTracker.test.tsx` | Milestone progress display and completion count |
| `EmptyState.test.tsx` | Empty state component rendering with optional actions |
| `stellar.test.ts` | Address formatting, explorer link generation, XLM/stroop conversion |

### Contract Tests (Rust)

```bash
# Escrow Contract (3 tests)
cd contracts/escrow-contract && cargo test

# Job Contract (10 tests)
cd contracts/job-contract && cargo test
```

**Escrow Contract tests:** `test_fund_job`, `test_release_milestone`, `test_refund`

**Job Contract tests:** `test_create_job`, `test_create_job_empty_title` (panic), `test_double_initialization` (panic), `test_cancel_open_job`, `test_accept_job_and_submit_milestone`, `test_accept_job_self_dealing` (panic), `test_dispute_milestone`, `test_resolve_dispute_approve`, `test_resolve_dispute_reject`, `test_approve_milestone`

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | Next.js (App Router) | 14.2 | SSR, file-based routing, production builds |
| **Language** | TypeScript | 5.x | Full type safety across frontend and contract clients |
| **Styling** | Tailwind CSS | 3.4 | Utility-first CSS with dark mode |
| **Animations** | Framer Motion | 11.x | Micro-interactions and page transitions |
| **Smart Contracts** | Soroban (Rust) | stable | On-chain job and escrow logic |
| **Blockchain SDK** | @stellar/stellar-sdk | 12.3 | Transaction building, XDR encoding, RPC calls |
| **Wallet Integration** | StellarWalletsKit | 1.9 | Freighter, xBull, and Albedo multi-wallet support |
| **Frontend Testing** | Vitest + Testing Library | 2.1 | Unit and component tests |
| **Contract Testing** | soroban-sdk testutils | — | Rust contract simulation and mock ICC |
| **Error Monitoring** | Sentry | 10.x | Crash reporting and error tracking |
| **Analytics** | PostHog | 1.x | Product analytics and event capture |
| **Performance Auditing** | Lighthouse CI | 0.13 | Automated web performance checks in CI |
| **CI/CD** | GitHub Actions | — | Automated lint, test, build, and deploy pipeline |
| **Hosting** | Netlify | — | Frontend production deployment |

---

## 📁 Project Structure

```
StellarGig/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + test + build + Lighthouse CI on push
│       └── deploy-contract.yml       # Manual contract build and testnet deployment
├── app/                              # Next.js App Router pages
│   ├── page.tsx                      # Landing page — hero, value props, CTA
│   ├── jobs/
│   │   ├── page.tsx                  # Browse all open jobs
│   │   └── [id]/page.tsx             # Job detail — actions, milestones, escrow status
│   ├── create/page.tsx               # Multi-milestone job creation form
│   ├── dashboard/page.tsx            # Wallet activity feed and job history
│   └── layout.tsx                    # Root layout with ErrorBoundary and Navbar
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                # Glassmorphism nav with wallet connect + PostHog init
│   │   └── Footer.tsx
│   ├── wallet/
│   │   └── WalletButton.tsx          # Multi-wallet connection trigger
│   ├── jobs/
│   │   ├── JobCard.tsx               # Job listing card with status badge
│   │   └── MilestoneTracker.tsx      # Visual milestone progress indicator
│   ├── escrow/
│   │   └── EscrowStatus.tsx          # Escrow vault state with loading skeletons
│   ├── dashboard/
│   │   └── ActivityFeed.tsx          # On-chain event stream
│   └── ui/
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── ConfirmModal.tsx          # Transaction confirmation dialog
│       ├── ErrorBoundary.tsx         # React class error boundary
│       └── Skeleton.tsx
├── contracts/
│   ├── job-contract/
│   │   └── src/
│   │       ├── lib.rs                # Full job lifecycle contract
│   │       └── test.rs               # 10 unit tests with MockEscrowContract
│   └── escrow-contract/
│       └── src/
│           ├── lib.rs                # Escrow vault contract
│           └── test.rs               # 3 unit tests with MockJobContract
├── hooks/
│   ├── useJobs.ts                    # Parallel job fetching with Promise.all
│   └── useWallet.ts                  # Wallet session management with key validation
├── lib/
│   ├── stellar.ts                    # StellarHelper — wallet, transactions, polling, events
│   ├── analytics.ts                  # PostHog + Sentry event tracking wrapper
│   ├── constants.ts                  # Contract IDs, RPC URL, network passphrase
│   ├── types.ts                      # Shared TypeScript interfaces
│   └── contracts/
│       ├── job-client.ts             # TypeScript wrapper for Job Contract calls
│       └── escrow-client.ts          # TypeScript wrapper for Escrow Contract calls
├── __tests__/                        # Frontend test suite (Vitest)
├── sentry.client.config.ts           # Sentry client-side initialization
├── sentry.server.config.ts           # Sentry server-side initialization
├── sentry.edge.config.ts             # Sentry edge runtime initialization
├── lighthouserc.json                 # Lighthouse CI configuration
└── next.config.js                    # Next.js + Sentry webpack wrapper
```

---

## 🔄 CI/CD Pipeline

### Continuous Integration (`ci.yml`)

Triggered automatically on every push and pull request to `main`.

```
Push to main
     │
     ├── Frontend Job
     │     ├── npm ci
     │     ├── npm run lint
     │     ├── npm run test      ← 14 Vitest tests
     │     ├── npm run build     ← Next.js production build
     │     └── Lighthouse CI     ← Performance + accessibility audit
     │
     └── Contract Job
           ├── cargo build --target wasm32-unknown-unknown --release (escrow)
           ├── cargo build --target wasm32-unknown-unknown --release (job)
           ├── cargo test (escrow)  ← 3 Rust tests
           └── cargo test (job)     ← 10 Rust tests
```

### Contract Deployment (`deploy-contract.yml`)

Manually triggered via GitHub Actions workflow dispatch. Builds both WASM binaries and deploys to the Stellar Testnet.

---

## 🚀 Local Development

### Prerequisites

- **Node.js** 20+
- **Rust** (stable toolchain)
- **Stellar CLI** — `cargo install stellar-cli --locked`
- **Freighter Wallet** browser extension

### Installation

```bash
# Clone the repository
git clone https://github.com/CodeBugMalik/StellarGig.git
cd StellarGig

# Install frontend dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Edit `.env.local` with your contract IDs:

```env
NEXT_PUBLIC_JOB_CONTRACT_ID=CB5ZWJ5F3ZBKQ2FOKYGEHW6RFX7F6ACKY52CKYVBESTFEHZUSSC4WTQX
NEXT_PUBLIC_ESCROW_CONTRACT_ID=CDQTRHKGXJDNUQMJ2MNQVSGB5SOEESSQGU65EX63G5Q5ZSS5ZTP5UCG7
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

```bash
# Start development server
npm run dev
# → http://localhost:3000
```

### Building & Deploying Contracts

```bash
# Build WASM binaries
cd contracts/escrow-contract && cargo build --target wasm32-unknown-unknown --release
cd ../job-contract && cargo build --target wasm32-unknown-unknown --release

# Deploy to Stellar Testnet
stellar contract deploy \
  --wasm contracts/escrow-contract/target/wasm32-unknown-unknown/release/escrow_contract.wasm \
  --source pranjal --network testnet

stellar contract deploy \
  --wasm contracts/job-contract/target/wasm32-unknown-unknown/release/job_contract.wasm \
  --source pranjal --network testnet

# Cross-initialize both contracts
stellar contract invoke --id <ESCROW_ID> --source pranjal --network testnet \
  -- initialize --job_contract <JOB_ID>

stellar contract invoke --id <JOB_ID> --source pranjal --network testnet \
  -- initialize --escrow_contract <ESCROW_ID>
```

---

## 🗺️ Roadmap

### ✅ Level 3 — Orange Belt (Complete)
- Dual Soroban smart contracts with Inter-Contract Communication
- Next.js 14 frontend with multi-wallet support
- Milestone-based escrow lifecycle
- Real-time contract event streaming
- Testnet deployment with on-chain transactions

### ✅ Level 4 — Black Belt (Complete)
- Contract security hardening (13 targeted fixes across both contracts)
- Frontend production quality (memory leak, N+1 query, session validation, error boundary)
- Transaction Confirmation Modal before every state-changing action
- Loading skeleton UI to eliminate flashing screens
- PostHog product analytics + Sentry error monitoring integration
- Lighthouse CI integrated into GitHub Actions pipeline
- 10+ real users onboarded on Stellar Testnet with wallet interaction proof
- Fresh testnet deployment with hardened contracts, cross-initialized


### 🔜 Level 6 — Mainnet (Planned)
- Third-party security audit of both Soroban contracts
- **Mainnet deployment** of hardened contracts
- **Fee Sponsorship** via Stellar Fee Bump Transactions — gasless onboarding for non-crypto-native users
- **Multisig escrow** for high-value enterprise contracts
- Public launch on Twitter and Product Hunt
- Contribution: publish open-source technical guide on Soroban Inter-Contract Communication patterns

---

## 👨‍💻 Author

**Pranjal Malik** — [@CodeBugMalik](https://github.com/CodeBugMalik)

*Built for the [RiseIn Stellar dApp Development Program](https://www.risein.com/) — Level 4 Black Belt*
