import { useEffect, useState } from "react";
import { CalendarClock, Layers, Users2 } from "lucide-react";
import { SubscriptionsPanel } from "../subscriptions/SubscriptionsPanel";
import { InstallmentsPanel } from "../installments/InstallmentsPanel";
import { IousPanel } from "../ious/IousPanel";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";
import { useT } from "../../lib/i18n";

type Tab = "subscriptions" | "installments" | "ious";

interface Props {
  initialTab?: Tab;
}

export function CommitmentsPanel({ initialTab = "subscriptions" }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const recurring = useStore((s) => s.recurring);
  const installments = useStore((s) => s.installments);
  const ious = useStore((s) => s.ious);
  const { t } = useT();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const activeBillsCount = recurring.filter(
    (r) => (r.status ?? "active") === "active",
  ).length;
  const activeInstallmentsCount = installments.filter(
    (p) => p.status === "active",
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
      shortLabel: t("nav.bills"),
      longLabel: t("tab.bills"),
      icon: CalendarClock,
      count: activeBillsCount,
      activeClass:
        "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-600/30 border-blue-400/25",
      idleBadge: "bg-white/[0.08] text-white/60",
    },
    {
      id: "installments",
      shortLabel: t("nav.installments"),
      longLabel: t("tab.installments"),
      icon: Layers,
      count: activeInstallmentsCount,
      activeClass:
        "bg-gradient-to-r from-violet-600 to-purple-600 shadow-md shadow-violet-600/30 border-violet-400/25",
      idleBadge: "bg-violet-500/20 text-violet-300",
    },
    {
      id: "ious",
      shortLabel: t("nav.ious"),
      longLabel: t("tab.ious"),
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
        aria-label="Bills, Installments, and IOUs"
        className="grid grid-cols-3 sm:inline-grid sm:grid-cols-[auto_auto_auto] p-1 gap-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/20 w-full sm:w-auto"
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
                "flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 min-h-[42px] rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 min-w-0",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                isActive
                  ? cn("text-white", tab.activeClass)
                  : "border-transparent text-white/50 hover:text-white hover:bg-white/[0.04]",
              )}
            >
              <Icon size={14} className="flex-shrink-0 hidden xs:block" aria-hidden="true" />
              <span className="sm:hidden truncate">{tab.shortLabel}</span>
              <span className="hidden sm:inline whitespace-nowrap">
                {tab.longLabel}
              </span>
              {tab.count > 0 && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] leading-none font-mono font-bold flex-shrink-0",
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
        {activeTab === "subscriptions" ? (
          <SubscriptionsPanel />
        ) : activeTab === "installments" ? (
          <InstallmentsPanel />
        ) : (
          <IousPanel />
        )}
      </div>
    </div>
  );
}
