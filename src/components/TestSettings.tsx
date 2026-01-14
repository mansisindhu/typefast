"use client";

import { cn } from "@/lib/utils";
import { TestMode } from "@/hooks/useTypingTest";

interface TestSettingsProps {
  mode: TestMode;
  timeLimit: number;
  wordCount: number;
  onModeChange: (mode: TestMode) => void;
  onTimeLimitChange: (time: number) => void;
  onWordCountChange: (count: number) => void;
  disabled?: boolean;
}

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

export function TestSettings({
  mode,
  timeLimit,
  wordCount,
  onModeChange,
  onTimeLimitChange,
  onWordCountChange,
  disabled = false,
}: TestSettingsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 md:gap-4 text-sm transition-opacity",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      {/* Mode selection */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
        <button
          onClick={() => onModeChange("time")}
          className={cn(
            "px-3 py-1.5 rounded-md transition-colors",
            mode === "time"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          tabIndex={-1}
        >
          time
        </button>
        <button
          onClick={() => onModeChange("words")}
          className={cn(
            "px-3 py-1.5 rounded-md transition-colors",
            mode === "words"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          tabIndex={-1}
        >
          words
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border hidden md:block" />

      {/* Time/Word options */}
      <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
        {mode === "time"
          ? TIME_OPTIONS.map((time) => (
              <button
                key={time}
                onClick={() => onTimeLimitChange(time)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-colors min-w-[40px]",
                  timeLimit === time
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                tabIndex={-1}
              >
                {time}
              </button>
            ))
          : WORD_OPTIONS.map((count) => (
              <button
                key={count}
                onClick={() => onWordCountChange(count)}
                className={cn(
                  "px-3 py-1.5 rounded-md transition-colors min-w-[40px]",
                  wordCount === count
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                tabIndex={-1}
              >
                {count}
              </button>
            ))}
      </div>
    </div>
  );
}
