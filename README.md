# Walleteer — Wealth and Expense Tracker

Walleteer is a privacy-first personal finance and wealth management web application built as an installable Progressive Web App (PWA). It helps you track multi-currency bank accounts, cash wallets, credit cards, investments, category budgets, and savings goals with zero server dependencies—all data stays completely on your local device.

Live Demo: https://abdelghany-77.github.io/sub-wise/

---

## Overview

Managing personal finances often involves compromising privacy or dealing with bloated interfaces. Walleteer was built to offer a fast, distraction-free, and privacy-respecting alternative. It functions entirely client-side, storing records in your browser's local storage while providing rich data visualization and responsive layout controls across desktop, tablet, and mobile devices.

---

## Core Capabilities

### Dashboard & Analytics
- Overview cards for Net Worth, Inflow, Outflow, and Savings Rate with inline trend sparklines and month-over-month percentage changes.
- Interactive visualizations powered by Recharts, including category spending distribution donuts, balance trend lines, and income versus expense comparisons.
- Clean recent activity feed displaying the latest five transactions with direct navigation to the full transactions ledger.

### Accounts & Multi-Currency Support
- Support for multiple asset types: Bank Accounts, Digital Wallets, Credit Cards, Savings Accounts, and Investment portfolios.
- Multi-currency tracking with support for EGP, USD, EUR, GBP, SAR, and AED.
- Aggregated net worth calculations factoring in real-time exchange balance totals across all connected accounts.

### Transaction Management
- Dedicated transactions powerhouse view with comprehensive filtering by transaction type (Income, Expense, Transfer), linked account, category, and date range.
- Real-time text search across transaction notes, categories, accounts, and amounts.
- Inline row interactions on hover for editing, deleting, or one-click duplicating past entries.
- Structured pagination with configurable page sizes (10, 25, 50 items per page) and tabular numerical formatting to prevent layout jitter.

### Budgets & Net Worth Deductions
- Category-level monthly spending limits with color-coded progress bars and automated threshold warnings at 80% and 100%.
- Committed Monthly Spend option: allows specific recurring monthly budgets to be automatically deducted from your net worth calculations as committed expenditure.

### Savings Goals & Milestones
- Target-based savings tracking with target amounts, target dates, and linked accounts.
- Incremental contribution modal to record deposits toward specific goals.

### Command Palette
- Global shortcut (`Cmd+K` on macOS or `Ctrl+K` on Windows/Linux) to access search, jump between application pages, trigger new transactions, or toggle privacy settings instantly.

### Privacy Mode & Offline Capabilities
- One-click Privacy Mode that applies a localized 8px blur and disables text selection across sensitive financial figures.
- Service worker implementation allowing full offline access and fast resource caching.
- JSON backup export and restore utility for data ownership and local data migration.

---

## Technology Stack

- Frontend Framework: React 19 with TypeScript
- Build Tool: Vite 7
- State Management: Zustand with persistence middleware
- Styling: Tailwind CSS (custom dark theme and glassmorphic surface tokens)
- Charting: Recharts
- Icons: Lucide React
- PWA Integration: vite-plugin-pwa (Workbox)

---

## Getting Started

### Prerequisites
- Node.js 18.0 or newer
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/abdelghany-77/sub-wise.git
   cd sub-wise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser at the local URL printed in the terminal (typically `http://localhost:5173`).

---

## Available Scripts

- `npm run dev`: Starts the Vite development server with hot module replacement.
- `npm run build`: Type-checks TypeScript code and compiles the production bundle into `dist/`.
- `npm run preview`: Starts a local server to preview the production build.
- `npm run typecheck`: Runs `tsc -b --noEmit` to validate all TypeScript types.

---

## PWA Installation

Walleteer can be installed natively as a standalone application:

- Desktop (Chrome, Edge, Brave): Click the Install icon on the right side of the address bar.
- iOS (Safari): Tap the Share button in Safari, then select "Add to Home Screen".
- Android (Chrome): Tap the browser menu (three dots) and select "Install App" or "Add to Home screen".

---

## Directory Structure

```
src/
├── components/
│   ├── accounts/        # Account cards, creation, and balance lists
│   ├── budgets/         # Category limits and net worth deduction settings
│   ├── charts/          # Donut, trend line, and income/expense chart components
│   ├── dashboard/       # Summary cards, sparklines, and recent activity
│   ├── data/            # JSON export, import, and data reset tools
│   ├── goals/           # Savings targets, deadlines, and contribution flows
│   ├── layout/          # Desktop sidebar, mobile bottom navigation, and top bar
│   ├── reports/         # Monthly summaries and category analysis
│   ├── settings/        # Currency preferences, date format, and start of week
│   ├── transactions/    # Full transactions ledger, filter toolbar, and edit modals
│   └── ui/              # Reusable buttons, cards, modals, command palette, toasts
├── data/                # Initial sample accounts and transaction records
├── lib/                 # Formatting utilities, currency helpers, and ID generators
├── store/               # Zustand state stores with localStorage migration
└── types/               # TypeScript interfaces, types, and category constants
```

---

## Privacy Notice

All data created in Walleteer remains exclusively inside your device's browser storage (`localStorage`). No tracking scripts, analytics, or remote database connections are included.

---