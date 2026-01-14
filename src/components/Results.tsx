"use client";

import { TestResults } from "@/hooks/useTypingTest";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ResultsProps {
  results: TestResults;
  onRestart: () => void;
}

export function Results({ results, onRestart }: ResultsProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {/* WPM */}
            <div className="text-center col-span-2 md:col-span-1">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-1">
                {results.wpm}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                wpm
              </div>
            </div>

            {/* Accuracy */}
            <div className="text-center col-span-2 md:col-span-1">
              <div className="text-5xl md:text-6xl font-bold text-primary mb-1">
                {results.accuracy}%
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                accuracy
              </div>
            </div>

            {/* Characters */}
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-semibold mb-1">
                <span className="text-green-500">{results.correctChars}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-red-500">{results.incorrectChars}</span>
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                characters
              </div>
            </div>

            {/* Mistakes */}
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-semibold text-orange-500 mb-1">
                {results.totalMistakes}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">
                mistakes
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="text-center mt-6 pt-6 border-t border-border/50">
            <span className="text-muted-foreground">
              Time: {results.time.toFixed(1)}s
            </span>
          </div>

          {/* Restart button */}
          <div className="flex justify-center mt-6">
            <Button
              onClick={onRestart}
              size="lg"
              className="gap-2"
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
              Restart Test
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Press <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Tab</kbd> + <kbd className="px-1.5 py-0.5 bg-secondary rounded text-xs">Enter</kbd> to restart
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
