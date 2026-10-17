import { useState } from "react";
import { CalendarClock, Users2 } from "lucide-react";
import { SubscriptionsPanel } from "../subscriptions/SubscriptionsPanel";
import { IousPanel } from "../ious/IousPanel";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";

interface Props {
  initialTab?: "subscriptions" | "ious";
}

export function CommitmentsPanel({ initialTab = "subscriptions" }: Props) {
  const [activeTab, setActiveTab] = useState<"subscriptions" | "ious">(initialTab);
  const { recurring, ious } = useStore();

  const activeBillsCount = recurring.filter((r) => (r.status ?? "active") === "active").length;
  const pendingIousCount = ious.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Top Segmented Control Switcher */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl shadow-lg shadow-black/20">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={cn(
              "flex items-center gap-2.5 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 relative",
              activeTab === "subscriptions"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/25"
                : "text-white/50 hover:text-white hover:bg-white/[0.04]",
            )}
          >
            <CalendarClock size={16} />
            <span>Subscriptions & Recurring Bills</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                activeTab === "subscriptions"
                  ? "bg-black/30 text-white"
                  : "bg-white/[0.08] text-white/60",
              )}
            >
              {activeBillsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ious")}
            className={cn(
              "flex items-center gap-2.5 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 relative",
              activeTab === "ious"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/25"
                : "text-white/50 hover:text-white hover:bg-white/[0.04]",
            )}
          >
            <Users2 size={16} />
            <span>IOUs (Lent / Borrowed)</span>
            {pendingIousCount > 0 && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                  activeTab === "ious"
                    ? "bg-black/30 text-white"
                    : "bg-indigo-500/20 text-indigo-300",
                )}
              >
                {pendingIousCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="animate-fade-in">
        {activeTab === "subscriptions" ? <SubscriptionsPanel /> : <IousPanel />}
      </div>
    </div>
  );
}
