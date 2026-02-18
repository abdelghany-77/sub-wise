import { DashboardStats } from "../dashboard/DashboardStats";
import { SpendingDonut } from "../charts/SpendingDonut";
import { BalanceTrendChart } from "../charts/BalanceTrendChart";
import { TransactionHistory } from "../transactions/TransactionHistory";
import { AddTransactionModal } from "../transactions/AddTransactionModal";
import { AccountsPanel } from "../accounts/AccountsPanel";
import { DataManager } from "../data/DataManager";
import type { Page } from "./Sidebar";

interface Props {
  page: Page;
}

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard",
  accounts: "Accounts",
  transactions: "Transactions",
  data: "Data & Backup",
};

export function MainContent({ page }: Props) {
  return (
    <main className="flex-1 overflow-y-auto min-h-screen">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-[#0d0d14]/80 backdrop-blur-sm border-b border-white/[0.06] px-6 lg:px-8 h-16 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white pl-10 lg:pl-0">
          {PAGE_TITLES[page]}
        </h1>
        {(page === "dashboard" || page === "transactions") && (
          <AddTransactionModal />
        )}
      </header>

      {/* Content */}
      <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
        {page === "dashboard" && (
          <>
            <DashboardStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpendingDonut />
              <BalanceTrendChart />
            </div>
            <TransactionHistory />
          </>
        )}

        {page === "accounts" && <AccountsPanel />}

        {page === "transactions" && <TransactionHistory />}

        {page === "data" && <DataManager />}
      </div>
    </main>
  );
}
