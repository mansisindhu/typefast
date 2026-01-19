"use client";

import { useState } from 'react';
import { RaceHistoryEntry } from '@/lib/raceTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPlayerColor } from './RaceLobby';

interface RaceHistoryProps {
  history: RaceHistoryEntry[];
  stats: {
    totalRaces: number;
    wins: number;
    podiums: number;
    avgWpm: number;
    bestWpm: number;
    winRate: number;
  };
  onClearHistory: () => void;
  onClose: () => void;
}

export function RaceHistory({ history, stats, onClearHistory, onClose }: RaceHistoryProps) {
  const [expandedRace, setExpandedRace] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPositionBadge = (position: number) => {
    switch (position) {
      case 1:
        return <span className="text-lg">🥇</span>;
      case 2:
        return <span className="text-lg">🥈</span>;
      case 3:
        return <span className="text-lg">🥉</span>;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 max-w-lg mx-auto">
      <CardContent className="pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Race History</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </Button>
        </div>

        {/* Stats Summary */}
        {stats.totalRaces > 0 && (
          <div className="grid grid-cols-3 gap-3 p-4 bg-secondary/30 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalRaces}</div>
              <div className="text-xs text-muted-foreground">Races</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.wins}</div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{stats.winRate}%</div>
              <div className="text-xs text-muted-foreground">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.avgWpm}</div>
              <div className="text-xs text-muted-foreground">Avg WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{stats.bestWpm}</div>
              <div className="text-xs text-muted-foreground">Best WPM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">{stats.podiums}</div>
              <div className="text-xs text-muted-foreground">Podiums</div>
            </div>
          </div>
        )}

        {/* Race List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🏁</div>
              <p>No races yet</p>
              <p className="text-sm">Complete a race to see your history</p>
            </div>
          ) : (
            history.map((race) => {
              const isExpanded = expandedRace === race.id;
              const modeText = race.config.mode === 'words' 
                ? `${race.config.wordCount} words` 
                : `${race.config.timeLimit}s`;
              
              return (
                <div key={race.id} className="rounded-lg border border-border/50 overflow-hidden">
                  {/* Race Summary Row */}
                  <button
                    onClick={() => setExpandedRace(isExpanded ? null : race.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-left transition-colors",
                      "hover:bg-secondary/50",
                      race.myPosition === 1 && "bg-yellow-500/5",
                      race.myPosition === 2 && "bg-gray-500/5",
                      race.myPosition === 3 && "bg-amber-500/5"
                    )}
                  >
                    {/* Position */}
                    <div className="w-8 flex justify-center">
                      {getPositionBadge(race.myPosition)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {race.myPosition === 1 ? 'Victory!' : `#${race.myPosition} of ${race.participants.length}`}
                        </span>
                        <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-secondary rounded">
                          {modeText}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(race.date)}
                      </div>
                    </div>

                    {/* WPM */}
                    <div className="text-right">
                      <div className="font-bold">{race.myWpm}</div>
                      <div className="text-xs text-muted-foreground">WPM</div>
                    </div>

                    {/* Expand indicator */}
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className={cn(
                        "text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    >
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {/* Expanded Leaderboard */}
                  {isExpanded && (
                    <div className="border-t border-border/50 bg-secondary/20 p-3 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Leaderboard
                      </div>
                      {[...race.participants]
                        .sort((a, b) => (a.position || 999) - (b.position || 999))
                        .map((participant, idx) => {
                          const isMe = participant.id === race.myParticipantId;
                          const color = getPlayerColor(idx);
                          
                          return (
                            <div 
                              key={participant.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded",
                                isMe && "bg-primary/10"
                              )}
                            >
                              <div className="w-6 text-center">
                                {participant.position && participant.position <= 3 
                                  ? getPositionBadge(participant.position)
                                  : <span className="text-xs text-muted-foreground">#{participant.position}</span>
                                }
                              </div>
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: color }}
                              >
                                {participant.name.charAt(0).toUpperCase()}
                              </div>
                              <div className={cn("flex-1 text-sm truncate", isMe && "font-medium")}>
                                {participant.name}
                                {isMe && <span className="text-muted-foreground ml-1">(you)</span>}
                              </div>
                              <div className="text-sm font-medium tabular-nums">
                                {participant.wpm} <span className="text-xs text-muted-foreground">WPM</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Clear History */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex-1">Clear all history?</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => {
                    onClearHistory();
                    setShowClearConfirm(false);
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground"
                onClick={() => setShowClearConfirm(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                Clear History
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
