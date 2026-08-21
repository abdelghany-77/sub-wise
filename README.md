# 💎 Walleteer — Wealth & Expense Tracker

A modern, high-end, privacy-first personal wealth and expense tracker built as an offline-capable Progressive Web App (PWA). Track multi-currency accounts, transactions, category budgets, and savings goals — all securely stored locally on your device.

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](package.json)
[![PWA](https://img.shields.io/badge/PWA-Supported-emerald.svg)](vite.config.ts)
[![License](https://img.shields.io/badge/License-MIT-blueviolet.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()

🌐 **Live Demo**: [https://abdelghany-77.github.io/sub-wise/](https://abdelghany-77.github.io/sub-wise/)

---

## ✨ Features & Capabilities

### 📊 1. Minimalist & High-Utility Dashboard
- **Interactive Summary Cards**: Live Net Worth, Inflow, Outflow, and Savings Rate cards with embedded inline SVG sparklines and dynamic Month-over-Month (MoM) delta badges (e.g. `+12.4% vs last month`).
- **Visual Analytics**: Interactive Spending Donut, Balance Trend, and Income vs. Expense charts with responsive tooltips.
- **Recent Activity**: Streamlined top-5 recent transactions list with an instant `View All →` shortcut to the full transaction powerhouse.

### 💳 2. Multi-Account Management
- Track Bank Accounts, Digital Wallets, Credit Cards, Savings, and Investment portfolios.
- Multi-currency support: **EGP, USD, EUR, GBP, SAR, AED**.
- Real-time aggregated Net Worth calculations across multiple currency assets.

### ⚡ 3. Full Powerhouse Transactions Page
- **Comprehensive Multi-Filter System**: Instant filtering by transaction type (All, Income, Expense, Transfer), linked Account, Category, and Date Range (`From` / `To`).
- **Instant Search**: Real-time note, category, account, and amount search.
- **Hover Row Actions**: Quick **Duplicate**, **Edit**, and **Delete** actions on each transaction row.
- **Strict Pagination Controls**: Page-size selector (`10`, `25`, `50` per page), detailed count indicator, and clickable pill navigation.

### 🎯 4. Smart Budgets & Net Worth Auto-Deduction
- Monthly spending limits per category with visual color-coded progress bars and budget alerts (80% warning, 100% exceeded).
- **Committed Monthly Spend**: Opt-in toggle on budgets to automatically subtract committed monthly allocations from your calculated Net Worth.

### 🏆 5. Savings Goals & Financial Reports
- Set target amounts, deadlines, and link dedicated savings accounts.
- Direct quick-contribute modal to fund goals incrementally.
- In-depth monthly financial reports with category breakdown comparisons and savings rate tracking.

### ⌨️ 6. Global Command Palette (`Cmd+K` / `Ctrl+K`)
- Open the Command Palette from anywhere with keyboard shortcuts (`Cmd+K` or `Ctrl+K`) or via the search bar in the navigation header.
- Rapidly search transactions, jump between pages, toggle privacy mode, or execute quick actions.

### 🔒 7. Enhanced Privacy Mode & Data Safety
- **1-Click Privacy Blur**: Applies smooth `filter: blur(8px)` with `user-select: none` across all sensitive balances and amounts.
- **100% Local & Offline**: All records persist in your browser via `localStorage` with automatic key migrations. No telemetry or server storage.
- **JSON Backup & Restore**: Export and import full encrypted snapshots of your data anytime.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | Modern UI Component Architecture |
| **TypeScript 5.9** | Strict Type Safety & Developer Experience |
| **Vite 7** | Lightning-fast Build Tooling & HMR Dev Server |
| **Tailwind CSS 3** | Bespoke Fintech Design System & Glassmorphism |
| **Zustand** | Performant Global State Management & Persistence |
| **Recharts** | Smooth Responsive Data Visualizations |
| **Lucide React** | Consistent Modern Iconography |
| **vite-plugin-pwa** | Service Worker, Manifest & Offline Caching |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** / **pnpm**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/abdelghany-77/sub-wise.git
cd sub-wise

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open your browser at `http://localhost:5173` (or the URL shown in terminal).

### Available Scripts

- `npm run dev` — Starts Vite dev server with hot module replacement
- `npm run build` — Compiles TypeScript (`tsc -b`) and bundles production assets with Vite
- `npm run preview` — Locally previews the generated production build
- `npm run typecheck` — Validates all TypeScript types without emitting files

---

## 📱 PWA & Mobile Installation

Walleteer is fully installable as a standalone Progressive Web App across all platforms:

- **Desktop (Chrome / Edge / Brave)**: Click the **Install** icon in the browser address bar.
- **iOS (Safari)**: Tap the **Share** button → **Add to Home Screen**.
- **Android (Chrome)**: Tap the menu (three dots) → **Install App** / **Add to Home screen**.

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── accounts/        # Account cards, creation & balance overview
│   ├── budgets/         # Category budgets & Net Worth auto-deduction
│   ├── charts/          # Donut, trend line, and income/expense charts
│   ├── dashboard/       # Summary cards, sparklines & recent activity
│   ├── data/            # JSON Backup export, import & danger zone
│   ├── goals/           # Savings targets, deadline & contribution logic
│   ├── layout/          # Sidebar, responsive navigation & top bar
│   ├── reports/         # Monthly breakdown & historical comparisons
│   ├── settings/        # Currency, date formats & calendar preferences
│   ├── transactions/    # Powerhouse table, multi-filter & add/edit modal
│   └── ui/              # Buttons, Cards, Modals, CommandPalette, Toasts
├── data/                # Initial demo accounts & transactions
├── lib/                 # Formatting utilities & ID generators
├── store/               # Zustand store with persistence & migrations
└── types/               # TypeScript schemas and category definitions
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
