"use client";

import { RaceParticipant } from '@/lib/raceTypes';
import { cn } from '@/lib/utils';
import { getPlayerColor } from './RaceLobby';

interface RaceProgressProps {
  participants: RaceParticipant[];
  myParticipantId: string | null;
}

export function RaceProgress({ participants, myParticipantId }: RaceProgressProps) {
  // Sort participants by progress (highest first), then by finish position
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.position || 999) - (b.position || 999);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });

  return (
    <div className="space-y-2 mb-6">
      {sortedParticipants.map((participant) => {
        const originalIndex = participants.findIndex(p => p.id === participant.id);
        const color = getPlayerColor(originalIndex);
        const isMe = participant.id === myParticipantId;

        return (
          <div
            key={participant.id}
            className={cn(
              "relative rounded-lg overflow-hidden transition-all",
              isMe ? "ring-2 ring-primary" : ""
            )}
          >
            {/* Progress track */}
            <div className="h-10 bg-secondary/50 relative">
              {/* Progress fill */}
              <div
                className="absolute inset-y-0 left-0 transition-all duration-200 ease-out"
                style={{
                  width: `${Math.min(100, participant.progress)}%`,
                  backgroundColor: color,
                  opacity: 0.3,
                }}
              />
              
              {/* Race car / avatar indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-200 ease-out flex items-center"
                style={{
                  left: `${Math.min(97, participant.progress)}%`,
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                  style={{ backgroundColor: color }}
                >
                  {participant.name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Player info */}
              <div className="absolute inset-0 flex items-center px-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={cn(
                    "text-sm font-medium truncate",
                    isMe && "font-bold"
                  )}>
                    {participant.name}
                    {isMe && " (you)"}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  {participant.finished ? (
                    <span className="font-bold" style={{ color }}>
                      #{participant.position}
                    </span>
                  ) : (
                    <span className="text-muted-foreground tabular-nums">
                      {Math.round(participant.progress)}%
                    </span>
                  )}
                  <span className="text-muted-foreground tabular-nums min-w-[60px] text-right">
                    {participant.wpm} WPM
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
