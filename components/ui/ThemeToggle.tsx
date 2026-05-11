"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/cn";

interface Props {
  className?: string;
}

export function ThemeToggle({ className }: Props) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? resolvedTheme ?? theme ?? "light" : "light";
  const isDark = current === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-current/30 px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors",
        "hover:border-current/60",
        className,
      )}
    >
      <span aria-hidden className="text-base leading-none">
        {mounted ? (isDark ? "◐" : "◑") : "◯"}
      </span>
      <span className="hidden sm:inline">{mounted ? (isDark ? "Dark" : "Light") : "Theme"}</span>
    </button>
  );
}
