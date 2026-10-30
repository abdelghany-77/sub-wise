import { useState } from "react";
import { CalendarClock, Users2 } from "lucide-react";
import { SubscriptionsPanel } from "../subscriptions/SubscriptionsPanel";
import { IousPanel } from "../ious/IousPanel";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";

type Tab = "subscriptions" | "ious";

interface Props {
  initialTab?: Tab;
}

export function CommitmentsPanel({ initialTab = "subscriptions" }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const recurring = useStore((s) => s.recurring);
  const ious = useStore((s) => s.ious);

  const activeBillsCount = recurring.filter(
    (r) => (r.status ?? "active") === "active",
  ).length;
  const pendingIousCount = ious.filter((i) => i.status === "pending").length;

  const tabs: {
    id: Tab;
    shortLabel: string;
    longLabel: string;
    icon: typeof CalendarClock;
    count: number;
    activeClass: string;
    idleBadge: string;
  }[] = [
    {
      id: "subscriptions",
      shortLabel: "Bills",
      longLabel: "Subscriptions & Bills",
      icon: CalendarClock,
      count: activeBillsCount,
      activeClass:
        "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/30 border-blue-400/25",
      idleBadge: "bg-white/[0.08] text-white/60",
    },
    {
      id: "ious",
      shortLabel: "IOUs",
      longLabel: "IOUs · Lent & Borrowed",
      icon: Users2,
      count: pendingIousCount,
      activeClass:
        "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-600/30 border-indigo-400/25",
      idleBadge: "bg-indigo-500/20 text-indigo-300",
    },
  ];

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Bills and IOUs"
        className="grid grid-cols-2 sm:inline-grid sm:grid-cols-[auto_auto] p-1 gap-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/20 w-full sm:w-auto"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`commitments-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls="commitments-tabpanel"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-2 px-3 sm:px-5 py-2 min-h-[40px] rounded-xl border text-sm font-semibold transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                isActive
                  ? cn("text-white", tab.activeClass)
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.04]",
              )}
            >
              <Icon size={15} className="flex-shrink-0" aria-hidden="true" />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline whitespace-nowrap">
                {tab.longLabel}
              </span>
              {tab.count > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] leading-none font-mono font-bold",
                    isActive ? "bg-black/30 text-white" : tab.idleBadge,
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        key={activeTab}
        id="commitments-tabpanel"
        role="tabpanel"
        aria-labelledby={`commitments-tab-${activeTab}`}
        className="animate-fade-in"
      >
        {activeTab === "subscriptions" ? <SubscriptionsPanel /> : <IousPanel />}
      </div>
    </div>
  );
}
