"use client";

import { RaceConfig } from '@/lib/raceTypes';

interface RaceCountdownProps {
  countdown: number;
  config: RaceConfig;
}

export function RaceCountdown({ countdown, config }: RaceCountdownProps) {
  const modeDescription = config.mode === 'words' 
    ? `${config.wordCount} words` 
    : `${config.timeLimit} seconds`;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center animate-in zoom-in duration-200">
        <div className="text-8xl md:text-9xl font-bold text-primary tabular-nums">
          {countdown > 0 ? countdown : 'GO!'}
        </div>
        <p className="text-xl text-muted-foreground mt-4">
          {countdown > 0 ? 'Get ready...' : 'Start typing!'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {modeDescription}
        </p>
      </div>
    </div>
  );
}
