import { useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CalendarCheck,
  UserCheck,
  Target,
  ShieldAlert,
  Crosshair,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import type { Insight, InsightSeverity } from "../../hooks/useDashboardInsights";
import { cn } from "../../lib/utils";
import type { Page } from "../layout/Sidebar";

interface Props {
  insights: Insight[];
  onNavigate: (page: Page) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CalendarCheck,
  UserCheck,
  Target,
  ShieldAlert,
  Crosshair,
  // PiggyBank doesn't exist in lucide-react so we alias:
  PiggyBank: TrendingUp,
};

const SEVERITY_STYLES: Record<
  InsightSeverity,
  { border: string; bg: string; iconBg: string; iconColor: string; dot: string }
> = {
  bad: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/[0.06]",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-400",
    dot: "bg-rose-400",
  },
  warn: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/[0.06]",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    dot: "bg-amber-400",
  },
  good: {
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/[0.06]",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  info: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/[0.04]",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    dot: "bg-blue-400",
  },
};

export function InsightsStrip({ insights, onNavigate }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (insights.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 px-4 py-3.5">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={17} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">All Clear</p>
          <p className="text-[11px] text-white/40 leading-snug">
            No actionable insights right now — your finances are on track!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-400" />
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Smart Insights
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/[0.06] text-white/50 border border-white/[0.08]">
            {insights.length}
          </span>
        </div>
        <button
          onClick={() => onNavigate("reports")}
          className="flex items-center gap-1 text-[11px] font-semibold text-white/40 hover:text-white/70 transition-colors"
        >
          Full Reports
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Mobile: horizontal snap scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {insights.map((insight) => {
          const style = SEVERITY_STYLES[insight.severity];
          const IconComp = ICON_MAP[insight.icon] ?? AlertCircle;
          return (
            <div
              key={insight.id}
              className={cn(
                "snap-start flex-shrink-0 w-[280px] md:w-auto rounded-xl border p-3 flex items-start gap-3 transition-colors",
                style.border,
                style.bg,
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  style.iconBg,
                  style.iconColor,
                )}
              >
                <IconComp size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)}
                  />
                  <p className="text-xs font-semibold text-white truncate">
                    {insight.title}
                  </p>
                </div>
                <p className="text-[11px] text-white/45 leading-snug mt-0.5 line-clamp-2">
                  {insight.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

