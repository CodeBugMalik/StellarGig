# ⚡ StellarGig — Decentralized Freelancer Escrow Platform

> Trustless freelance payments powered by Stellar Soroban smart contracts with inter-contract communication, real-time event streaming, and milestone-based escrow.

**Built for [RiseIn Level 3 — Orange Belt](https://www.risein.com/)**

---

## 🌟 Overview

StellarGig is a production-ready decentralized application (dApp) that solves the trust problem in freelance payments. Clients post jobs with milestones, fund an on-chain escrow, freelancers complete work, and payments are automatically released through inter-contract communication between the **Job Contract** and **Escrow Vault Contract**.

### Key Features

- **🔗 Inter-Contract Communication** — Job contract calls Escrow contract to release payments on milestone approval
- **💰 Milestone-Based Escrow** — Break projects into milestones with individual payment releases
- **📊 Real-Time Event Streaming** — Live event polling from Soroban contracts with auto-refresh
- **👛 Multi-Wallet Support** — Freighter, xBull, and Albedo via StellarWalletsKit
- **🛡️ Dispute Resolution** — Clients can dispute submitted milestones
- **📱 Mobile Responsive** — Fully responsive design tested at 375px+
- **🔄 CI/CD Pipeline** — GitHub Actions for automated build, test, and deploy
- **✅ Comprehensive Testing** — 10+ tests across frontend (Vitest) and contracts (Rust)

---

## 🏗️ Architecture

```
┌──────────────────┐         cross-contract call         ┌──────────────────┐
│   Job Contract   │ ──────────────────────────────────→  │ Escrow Contract  │
│                  │    approve_milestone() calls          │                  │
│  - create_job    │    escrow.release_milestone()         │  - fund_job      │
│  - accept_job    │                                       │  - release       │
│  - approve       │    cancel_job() calls                 │  - refund        │
│  - dispute       │    escrow.refund()                    │  - get_escrow    │
│  - cancel        │                                       │                  │
└──────────────────┘                                       └──────────────────┘
         ↑                                                          ↑
         │              TypeScript Contract Clients                 │
         └──────────────────────┬───────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   Next.js Frontend    │
                    │                       │
                    │  - Landing Page       │
                    │  - Browse Jobs        │
                    │  - Job Detail         │
                    │  - Create Job         │
                    │  - Dashboard          │
                    └───────────────────────┘
```

### Inter-Contract Communication Flow

1. Client creates a job on the **Job Contract**
2. Client funds escrow on the **Escrow Contract**
3. Freelancer accepts and works on milestones
4. Client approves a milestone → **Job Contract calls Escrow Contract** (`release_milestone`)
5. Escrow automatically releases payment to the freelancer
6. If cancelled → **Job Contract calls Escrow Contract** (`refund`) to return funds

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) | SSR, file-based routing |
| **Language** | TypeScript 5 | Type safety |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **Animations** | Framer Motion + CSS | Micro-interactions |
| **Blockchain** | Soroban (Rust) | Smart contracts |
| **SDK** | @stellar/stellar-sdk 12 | Blockchain interaction |
| **Wallets** | StellarWalletsKit 1.9 | Multi-wallet support |
| **Testing** | Vitest + Testing Library | Frontend tests |
| **Contract Tests** | soroban-sdk testutils | Rust contract tests |
| **CI/CD** | GitHub Actions | Build, test, deploy |
| **Hosting** | Vercel | Frontend deployment |

---

## 📁 Project Structure

```
stellargig/
├── .github/workflows/       # CI/CD pipelines
│   ├── ci.yml               # Build + test on push/PR
│   └── deploy-contract.yml  # Manual contract deployment
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── jobs/page.tsx        # Browse all jobs
│   ├── jobs/[id]/page.tsx   # Job detail + actions
│   ├── create/page.tsx      # Create new job form
│   └── dashboard/page.tsx   # User dashboard
├── components/              # React components
│   ├── layout/              # Navbar, Footer
│   ├── wallet/              # WalletButton
│   ├── jobs/                # JobCard, MilestoneTracker
│   ├── escrow/              # EscrowStatus
│   ├── dashboard/           # ActivityFeed
│   └── ui/                  # Button, Badge, Modal, Skeleton
├── contracts/               # Soroban smart contracts
│   ├── job-contract/        # Job management contract
│   └── escrow-contract/     # Escrow vault contract
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities + contract clients
│   ├── stellar.ts           # StellarHelper class
│   ├── contracts/            # TypeScript contract wrappers
│   ├── types.ts             # Shared types
│   └── constants.ts         # Config + contract IDs
└── __tests__/               # Frontend test suite
```

---

## 📜 Smart Contracts

### Job Contract
Manages the full lifecycle of freelance jobs: creation, acceptance, milestone submission, approval, disputes, and cancellation.

**Key Functions:**
- `create_job()` — Post a new job with milestones
- `accept_job()` — Freelancer accepts a funded job
- `submit_milestone()` — Freelancer submits work
- `approve_milestone()` — Client approves → **triggers inter-contract escrow release**
- `dispute_milestone()` — Client disputes submitted work
- `cancel_job()` — Cancel and **refund via inter-contract call**

### Escrow Contract
Holds funds in escrow and releases them based on instructions from the Job Contract.

**Key Functions:**
- `fund_job()` — Lock XLM for a job
- `release_milestone()` — Release payment to freelancer (called by Job Contract)
- `refund()` — Return remaining funds to client (called by Job Contract)
- `get_escrow()` — Read escrow state

---

## ⚠️ Error Handling

| Error Type | Handling |
|-----------|---------|
| Wallet not installed | "Please install Freighter or another Stellar wallet" |
| Connection rejected | "Wallet connection was declined by the user" |
| Insufficient balance | "Insufficient XLM balance for transaction fees" |
| Transaction rejected | Toast notification with error message |
| Contract not found | Graceful error with fallback UI |
| Job not found | "This job does not exist" page |
| Unauthorized action | Contract-level `require_auth()` enforcement |
| Network error | "Network error. Please check your connection" |
| Transaction timeout | Polling with status indicators |
| Invalid state transition | Contract panics with descriptive message |

---

## 🧪 Testing

### Frontend Tests (Vitest)
```bash
npm run test
```

Tests include:
- `Badge.test.tsx` — Status badge rendering with correct labels
- `MilestoneTracker.test.tsx` — Milestone progress display
- `EmptyState.test.tsx` — Empty state component rendering
- `stellar.test.ts` — Address formatting, explorer links, unit conversion

### Contract Tests (Rust)
```bash
cd contracts/escrow-contract && cargo test
cd contracts/job-contract && cargo test
```

Tests include:
- Job creation and count tracking
- Job acceptance and milestone submission flow
- Milestone dispute handling
- Job cancellation
- Escrow funding and deposit verification
- Milestone release and balance updates
- Escrow refund processing

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Rust (stable)
- Stellar CLI (`cargo install stellar-cli`)
- A Stellar wallet (Freighter recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/CodeBugMalik/StellarGig.git
cd StellarGig

# Install frontend dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your contract IDs

# Run development server
npm run dev
```

### Contract Deployment

```bash
# Generate a deployer key
stellar keys generate deployer --network testnet

# Build contracts
cd contracts/escrow-contract && cargo build --target wasm32-unknown-unknown --release
cd ../job-contract && cargo build --target wasm32-unknown-unknown --release

# Deploy escrow first, then job contract
stellar contract deploy --wasm contracts/escrow-contract/target/wasm32-unknown-unknown/release/escrow_contract.wasm --source deployer --network testnet

stellar contract deploy --wasm contracts/job-contract/target/wasm32-unknown-unknown/release/job_contract.wasm --source deployer --network testnet

# Initialize both contracts with each other's address
stellar contract invoke --id ESCROW_ID --source deployer --network testnet -- initialize --job_contract JOB_ID
stellar contract invoke --id JOB_ID --source deployer --network testnet -- initialize --escrow_contract ESCROW_ID
```

---

## 🔄 CI/CD Pipeline

### Continuous Integration (`ci.yml`)
- **Triggered**: On push/PR to `main`
- **Frontend**: `npm ci` → `npm run lint` → `npm run test` → `npm run build`
- **Contracts**: Build WASM → Run `cargo test` for both contracts

### Contract Deployment (`deploy-contract.yml`)
- **Triggered**: Manual workflow dispatch
- **Process**: Build → Deploy to Stellar Testnet

---

## 🎨 Design

- **Theme**: Premium dark theme with indigo/purple accents
- **Typography**: Inter (Google Fonts)
- **Animations**: Fade-in, slide-up, pulse-glow micro-animations
- **Components**: Glassmorphism navbar, gradient accents, status badges
- **Responsive**: Mobile-first design (375px → 1440px+)

---

## 📄 License

This project is built for the RiseIn Stellar dApp Development Program — Level 3 Orange Belt.

---

## 👨‍💻 Author

**CodeBugMalik** — [GitHub](https://github.com/CodeBugMalik)
