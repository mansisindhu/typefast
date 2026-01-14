"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTypingTest, TestMode } from "@/hooks/useTypingTest";
import { useTheme } from "@/hooks/useTheme";
import { TypingDisplay } from "@/components/TypingDisplay";
import { TestSettings } from "@/components/TestSettings";
import { Results } from "@/components/Results";
import { Timer } from "@/components/Timer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export function TypingTest() {
  const [mode, setMode] = useState<TestMode>("time");
  const [timeLimit, setTimeLimit] = useState(30);
  const [wordCount, setWordCount] = useState(25);

  const {
    words,
    currentWordIndex,
    currentCharIndex,
    status,
    timeLeft,
    elapsedTime,
    results,
    handleKeyPress,
    restart,
    isReady,
  } = useTypingTest({ mode, timeLimit, wordCount });

  const { theme, toggleTheme, mounted } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(true);
  const tabPressedRef = useRef(false);

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Always ensure focus
      if (
        containerRef.current &&
        document.activeElement !== containerRef.current
      ) {
        containerRef.current.focus();
        setIsFocused(true);
      }

      // Track tab key for restart combo
      if (e.key === "Tab") {
        e.preventDefault();
        tabPressedRef.current = true;
        setTimeout(() => {
          tabPressedRef.current = false;
        }, 500);
        return;
      }

      // Restart with Tab + Enter or just Escape
      if ((e.key === "Enter" && tabPressedRef.current) || e.key === "Escape") {
        e.preventDefault();
        tabPressedRef.current = false;
        restart();
        return;
      }

      // Prevent paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        return;
      }

      // Prevent other ctrl/cmd combinations
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      // Handle backspace
      if (e.key === "Backspace") {
        e.preventDefault();
        handleKeyPress("Backspace");
        return;
      }

      // Handle space
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handleKeyPress(" ");
        return;
      }

      // Handle regular characters (single printable characters)
      if (e.key.length === 1) {
        e.preventDefault();
        handleKeyPress(e.key);
      }
    },
    [handleKeyPress, restart],
  );

  // Set up keyboard listeners
  useEffect(() => {
    // Always set up the window keydown listener
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Set up container focus handling - runs when isReady changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isReady) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    container.addEventListener("focus", handleFocus);
    container.addEventListener("blur", handleBlur);

    // Focus the container when ready
    container.focus();

    return () => {
      container.removeEventListener("focus", handleFocus);
      container.removeEventListener("blur", handleBlur);
    };
  }, [isReady]);

  // Re-focus container when clicking anywhere on the page
  useEffect(() => {
    const handleClick = () => {
      containerRef.current?.focus();
      setIsFocused(true);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Handle settings changes - the hook will auto-reset on settings change
  const handleModeChange = (newMode: TestMode) => {
    setMode(newMode);
  };

  const handleTimeLimitChange = (newTime: number) => {
    setTimeLimit(newTime);
  };

  const handleWordCountChange = (newCount: number) => {
    setWordCount(newCount);
  };

  // Prevent hydration mismatch and wait for words to be ready
  if (!mounted || !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="min-h-screen flex flex-col outline-none bg-background text-foreground"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7h.01" />
            <path d="M12 7h.01" />
            <path d="M17 7h.01" />
            <path d="M7 12h.01" />
            <path d="M12 12h.01" />
            <path d="M17 12h.01" />
            <path d="M7 17h10" />
          </svg>
          <span className="text-xl font-bold">typefast</span>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-20">
        <div className="w-full max-w-4xl space-y-8">
          {/* Settings */}
          <TestSettings
            mode={mode}
            timeLimit={timeLimit}
            wordCount={wordCount}
            onModeChange={handleModeChange}
            onTimeLimitChange={handleTimeLimitChange}
            onWordCountChange={handleWordCountChange}
            disabled={status === "running"}
          />

          {status !== "finished" ? (
            <>
              {/* Timer */}
              <div className="flex justify-center">
                <Timer
                  mode={mode}
                  timeLeft={timeLeft}
                  elapsedTime={elapsedTime}
                  wordCount={wordCount}
                  currentWordIndex={currentWordIndex}
                  status={status}
                />
              </div>

              {/* Typing area */}
              <div
                className={cn(
                  "relative transition-opacity duration-200",
                  !isFocused && status !== "running" && "opacity-50",
                )}
              >
                <TypingDisplay
                  words={words}
                  currentWordIndex={currentWordIndex}
                  currentCharIndex={currentCharIndex}
                  status={status}
                />

                {/* Click to focus overlay */}
                {!isFocused && status !== "running" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                    <p className="text-muted-foreground">
                      Click anywhere or press any key to focus
                    </p>
                  </div>
                )}
              </div>

              {/* Restart hint */}
              <div className="flex justify-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    restart();
                    containerRef.current?.focus();
                  }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg"
                  tabIndex={-1}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                  <span className="text-sm">restart</span>
                </button>
              </div>
            </>
          ) : (
            /* Results */
            results && <Results results={results} onRestart={restart} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">tab</kbd>
          {" + "}
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">
            enter
          </kbd>
          {" or "}
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">esc</kbd>
          {" - restart test"}
        </p>
      </footer>
    </div>
  );
}
