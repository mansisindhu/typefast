"use client";

import { useRef, useEffect, useState, useLayoutEffect } from "react";
import { WordState, TestStatus } from "@/hooks/useTypingTest";
import { cn } from "@/lib/utils";

interface TypingDisplayProps {
  words: WordState[];
  currentWordIndex: number;
  currentCharIndex: number;
  status: TestStatus;
}

// Number of visible lines to display
const VISIBLE_LINES = 3;

export function TypingDisplay({
  words,
  currentWordIndex,
  currentCharIndex,
  status,
}: TypingDisplayProps) {
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const [lineHeight, setLineHeight] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Measure line height on mount and when container changes
  useLayoutEffect(() => {
    if (wordsContainerRef.current) {
      const computedStyle = window.getComputedStyle(wordsContainerRef.current);
      const lineHeightValue = parseFloat(computedStyle.lineHeight);
      if (lineHeightValue > 0 && lineHeightValue !== lineHeight) {
        setLineHeight(lineHeightValue);
      }
    }
  }, [words.length, lineHeight]);

  // Calculate scroll offset based on current word position
  useLayoutEffect(() => {
    if (!wordsContainerRef.current || !lineHeight) return;

    // Find the active word element using data attribute
    const activeWord = wordsContainerRef.current.querySelector(
      `[data-word-index="${currentWordIndex}"]`,
    ) as HTMLElement | null;

    if (!activeWord) return;

    // Use offsetTop which is relative to the container and unaffected by transforms
    const wordOffsetTop = activeWord.offsetTop;

    // Calculate which line the word is on (0-indexed)
    const currentLine = Math.floor(wordOffsetTop / lineHeight);

    // Calculate new scroll offset - scroll content up when moving to new lines
    const newScrollOffset = currentLine * lineHeight;

    if (newScrollOffset !== scrollOffset) {
      setScrollOffset(newScrollOffset);
    }
  }, [currentWordIndex, lineHeight, scrollOffset]);

  // Reset scroll on restart
  useEffect(() => {
    if (currentWordIndex === 0) {
      setScrollOffset(0);
    }
  }, [currentWordIndex]);

  const isFinished = status === "finished";
  const hasScrolled = scrollOffset > 0;

  return (
    <div
      className="relative overflow-hidden font-mono text-2xl md:text-3xl select-none"
      style={{
        height: lineHeight > 0 ? `${lineHeight * VISIBLE_LINES}px` : "120px",
      }}
    >
      <div
        ref={wordsContainerRef}
        className="flex flex-wrap gap-x-3 leading-relaxed transition-transform duration-150 ease-out"
        style={{ transform: `translateY(${-scrollOffset}px)` }}
      >
        {words.map((word, wordIdx) => {
          const isCurrentWord = wordIdx === currentWordIndex;
          const isPastWord = wordIdx < currentWordIndex;

          // Check if word has errors
          const hasError =
            isPastWord &&
            word.characters.some(
              (c) => c.status === "incorrect" || c.status === "extra",
            );

          // Check if word was incomplete
          const isIncomplete =
            isPastWord && word.characters.some((c) => c.status === "pending");

          // Check if cursor should be at end of word (for extra characters)
          const showEndCursor =
            isCurrentWord &&
            currentCharIndex >= word.original.length &&
            currentCharIndex === word.characters.length &&
            !isFinished;

          return (
            <span
              key={wordIdx}
              data-word-index={wordIdx}
              className={cn(
                "relative inline-block",
                isPastWord && !hasError && !isIncomplete && "opacity-60",
                (hasError || isIncomplete) &&
                  "underline decoration-red-500/50 decoration-2 underline-offset-4",
              )}
            >
              {word.characters.map((charState, charIdx) => {
                const isCurrentChar =
                  isCurrentWord && charIdx === currentCharIndex;
                const isLastChar = charIdx === word.characters.length - 1;

                return (
                  <span
                    key={charIdx}
                    className={cn(
                      "relative inline-block",
                      charState.status === "pending" &&
                        "text-muted-foreground/50",
                      charState.status === "correct" &&
                        "text-green-500 dark:text-green-400",
                      charState.status === "incorrect" &&
                        "text-red-500 dark:text-red-400 bg-red-500/10",
                      charState.status === "extra" &&
                        "text-red-400 dark:text-red-300 bg-red-500/20",
                      isCurrentChar &&
                        !isFinished &&
                        "border-l-2 border-yellow-500 dark:border-yellow-400",
                      // Show cursor at end of last character when at end of word
                      isLastChar &&
                        showEndCursor &&
                        "border-r-2 border-yellow-500 dark:border-yellow-400",
                    )}
                  >
                    {charState.char}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>

      {/* Fade overlay at top for scrolled content */}
      {hasScrolled && (
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background to-transparent pointer-events-none" />
      )}

      {/* Fade overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}
