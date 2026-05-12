# 💰 SubWise — Wealth Tracker

A modern, privacy-first personal finance tracker built as a Progressive Web App (PWA). Track your accounts, transactions, budgets, and savings goals — all stored locally on your device.

![SubWise](https://img.shields.io/badge/version-0.1.1-blue) ![PWA](https://img.shields.io/badge/PWA-supported-green) ![License](https://img.shields.io/badge/license-MIT-purple)

## ✨ Features

- **Multi-Account Management** — Bank accounts, digital wallets, credit cards, savings & investments
- **Transaction Tracking** — Income, expenses & transfers with categories and notes
- **Recurring Transactions** — Automatic generation of daily, weekly, monthly, or yearly transactions
- **Budget Management** — Set spending limits per category with progress tracking and alerts
- **Savings Goals** — Visual progress tracking with deadlines and contributions
- **Financial Reports** — Monthly analysis with income vs expense charts and spending trends
- **Privacy Mode** — Blur all financial data with one click
- **Data Backup** — Export/import all data as JSON
- **Offline Support** — Full PWA with offline capability
- **Multi-Currency** — Support for EGP, USD, EUR, GBP, SAR, AED

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI Framework |
| **TypeScript** | Type Safety |
| **Vite** | Build Tool & Dev Server |
| **Zustand** | State Management |
| **Tailwind CSS 3** | Styling |
| **Recharts** | Data Visualization |
| **Lucide React** | Icons |
| **vite-plugin-pwa** | PWA Support |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/abdelghany-77/sub-wise.git
cd sub-wise

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📱 PWA Installation

SubWise can be installed as a standalone app on any device:

- **Desktop**: Click the install icon in your browser's address bar
- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Install App

## 🏗️ Project Structure

```
src/
├── components/
│   ├── accounts/        # Account management
│   ├── budgets/         # Budget tracking
│   ├── charts/          # Data visualizations
│   ├── dashboard/       # Dashboard stats
│   ├── data/            # Import/Export
│   ├── goals/           # Savings goals
│   ├── layout/          # Sidebar & Main layout
│   ├── reports/         # Financial reports
│   ├── settings/        # App settings
│   ├── transactions/    # Transaction management
│   └── ui/              # Reusable UI components
├── data/                # Demo data
├── lib/                 # Utility functions
├── store/               # Zustand state management
└── types/               # TypeScript type definitions
```

## 🔒 Privacy

All data is stored locally in your browser's localStorage. No data is ever sent to any server. The Privacy Mode feature allows you to blur all financial information with a single click.

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ using React + TypeScript + Vite
