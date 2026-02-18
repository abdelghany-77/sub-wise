import React from "react";
import { cn } from "../../lib/utils";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glass?: boolean;
  hover?: boolean;
  glow?: "violet" | "income" | "expense" | false;
  padding?: "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  glass = true,
  hover = false,
  glow = false,
  padding = "md",
  ...props
}: Props) {
  return (
    <div
      className={cn(
        glass ? "glass-card" : "",
        hover ? "glass-card-hover cursor-pointer" : "",
        glow === "violet" && "shadow-glow",
        glow === "income" && "shadow-glow-income",
        glow === "expense" && "shadow-glow-expense",
        padding === "sm" && "p-3 sm:p-4",
        padding === "md" && "p-4 sm:p-6",
        padding === "lg" && "p-5 sm:p-8",
        "animate-fade-in",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
