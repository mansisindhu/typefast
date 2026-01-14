"use client";

import { TestMode, TestStatus } from "@/hooks/useTypingTest";

interface TimerProps {
  mode: TestMode;
  timeLeft: number;
  elapsedTime: number;
  wordCount: number;
  currentWordIndex: number;
  status: TestStatus;
}

export function Timer({
  mode,
  timeLeft,
  elapsedTime,
  wordCount,
  currentWordIndex,
  status,
}: TimerProps) {
  if (status === "idle") {
    return (
      <div className="text-4xl md:text-5xl font-mono font-bold text-primary/80 tabular-nums">
        {mode === "time" ? Math.ceil(timeLeft) : `0/${wordCount}`}
      </div>
    );
  }

  if (mode === "time") {
    return (
      <div className="text-4xl md:text-5xl font-mono font-bold text-primary tabular-nums">
        {Math.ceil(timeLeft)}
      </div>
    );
  }

  // Words mode
  return (
    <div className="text-4xl md:text-5xl font-mono font-bold text-primary tabular-nums">
      {Math.min(currentWordIndex + 1, wordCount)}/{wordCount}
    </div>
  );
}
