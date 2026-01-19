"use client";

import { useEffect, useState } from 'react';
import { RaceParticipant } from '@/lib/raceTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getPlayerColor } from './RaceLobby';

interface RaceResultsProps {
  participants: RaceParticipant[];
  myParticipantId: string | null;
  onPlayAgain: () => void;
  onLeave: () => void;
}

// Confetti particle component
function Confetti() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    color: string;
    delay: number;
    duration: number;
    isCircle: boolean;
  }>>([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      isCircle: Math.random() > 0.5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 opacity-0"
          style={{
            left: `${particle.x}%`,
            top: '-20px',
            backgroundColor: particle.color,
            borderRadius: particle.isCircle ? '50%' : '0',
            animation: `confetti-fall ${particle.duration}s ease-out ${particle.delay}s forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}

// Podium component for top 3
function Podium({ 
  participants, 
  myParticipantId 
}: { 
  participants: RaceParticipant[]; 
  myParticipantId: string | null;
}) {
  const first = participants.find(p => p.position === 1);
  const second = participants.find(p => p.position === 2);
  const third = participants.find(p => p.position === 3);

  const PodiumPlace = ({ 
    participant, 
    place, 
    height 
  }: { 
    participant?: RaceParticipant; 
    place: number; 
    height: string;
  }) => {
    if (!participant) return <div className="w-24" />;
    
    const originalIndex = participants.findIndex(p => p.id === participant.id);
    const color = getPlayerColor(originalIndex);
    const isMe = participant.id === myParticipantId;
    const medal = place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
    
    return (
      <div className={cn(
        "flex flex-col items-center",
        place === 1 && "order-2",
        place === 2 && "order-1",
        place === 3 && "order-3"
      )}>
        {/* Player info */}
        <div className={cn(
          "text-center mb-2 animate-in fade-in slide-in-from-bottom-4",
          place === 1 && "delay-300",
          place === 2 && "delay-150",
          place === 3 && "delay-500"
        )} style={{ animationFillMode: 'backwards' }}>
          <div 
            className={cn(
              "w-14 h-14 mx-auto rounded-full flex items-center justify-center text-lg font-bold text-white mb-1 ring-2",
              isMe ? "ring-primary ring-offset-2 ring-offset-background" : "ring-transparent"
            )}
            style={{ backgroundColor: color }}
          >
            {participant.name.charAt(0).toUpperCase()}
          </div>
          <div className={cn("text-sm font-medium truncate max-w-[80px]", isMe && "text-primary")}>
            {participant.name}
          </div>
          <div className="text-lg font-bold">{participant.wpm} <span className="text-xs text-muted-foreground">WPM</span></div>
        </div>
        
        {/* Podium block */}
        <div 
          className={cn(
            "w-20 rounded-t-lg flex flex-col items-center justify-start pt-2 animate-in slide-in-from-bottom",
            place === 1 && "bg-gradient-to-b from-yellow-400 to-yellow-600 delay-300",
            place === 2 && "bg-gradient-to-b from-gray-300 to-gray-500 delay-150",
            place === 3 && "bg-gradient-to-b from-amber-600 to-amber-800 delay-500"
          )}
          style={{ height, animationFillMode: 'backwards' }}
        >
          <span className="text-2xl">{medal}</span>
          <span className="text-white font-bold text-xl">{place}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-end justify-center gap-2 mb-6">
      <PodiumPlace participant={second} place={2} height="80px" />
      <PodiumPlace participant={first} place={1} height="100px" />
      <PodiumPlace participant={third} place={3} height="60px" />
    </div>
  );
}

export function RaceResults({ 
  participants, 
  myParticipantId,
  onPlayAgain,
  onLeave 
}: RaceResultsProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Sort by position
  const sortedParticipants = [...participants].sort(
    (a, b) => (a.position || 999) - (b.position || 999)
  );

  const myResult = participants.find(p => p.id === myParticipantId);
  const iWon = myResult?.position === 1;
  const isTopThree = myResult && myResult.position && myResult.position <= 3;

  // Show confetti for winner
  useEffect(() => {
    if (iWon) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [iWon]);

  // Get encouragement message based on position
  const getMessage = () => {
    if (!myResult) return '';
    switch (myResult.position) {
      case 1: return '🎉 Champion! You dominated!';
      case 2: return '🔥 So close! Amazing race!';
      case 3: return '💪 Great job! On the podium!';
      default: return `👏 Nice effort! Keep practicing!`;
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Confetti for winner */}
      {showConfetti && <Confetti />}

      {/* Winner announcement for top finishers */}
      {myResult && (
        <div className={cn(
          "text-center py-6 rounded-2xl animate-in zoom-in duration-500",
          iWon && "bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 border border-yellow-500/30",
          myResult.position === 2 && "bg-gradient-to-r from-gray-400/20 via-gray-300/30 to-gray-400/20 border border-gray-400/30",
          myResult.position === 3 && "bg-gradient-to-r from-amber-600/20 via-amber-500/30 to-amber-600/20 border border-amber-600/30",
          !isTopThree && "bg-secondary/30 border border-border/50"
        )}>
          <div className={cn(
            "text-5xl mb-3",
            iWon && "animate-bounce"
          )}>
            {myResult.position === 1 ? '🏆' : myResult.position === 2 ? '🥈' : myResult.position === 3 ? '🥉' : '🏁'}
          </div>
          
          <h2 className={cn(
            "text-3xl font-bold mb-2",
            iWon && "text-yellow-500 dark:text-yellow-400"
          )}>
            {myResult.position === 1 
              ? 'VICTORY!' 
              : myResult.position === 2 
                ? 'Runner Up!'
                : myResult.position === 3 
                  ? 'Third Place!'
                  : `#${myResult.position} Finish`}
          </h2>
          
          <p className="text-muted-foreground mb-4">{getMessage()}</p>
          
          {/* Stats */}
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className={cn(
                "text-4xl font-bold",
                iWon ? "text-yellow-500 dark:text-yellow-400" : "text-primary"
              )}>
                {myResult.wpm}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">WPM</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">
                {((myResult.finishTime || 0) / 1000).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Seconds</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">
                #{myResult.position}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Place</div>
            </div>
          </div>
        </div>
      )}

      {/* Podium for top 3 */}
      {participants.length >= 2 && (
        <Podium participants={participants} myParticipantId={myParticipantId} />
      )}

      {/* Full Leaderboard */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="pt-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 text-center">
            Final Standings
          </h3>
          
          <div className="space-y-2">
            {sortedParticipants.map((participant, index) => {
              const originalIndex = participants.findIndex(p => p.id === participant.id);
              const color = getPlayerColor(originalIndex);
              const isMe = participant.id === myParticipantId;
              const isTopThreePos = participant.position && participant.position <= 3;

              return (
                <div
                  key={participant.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all animate-in slide-in-from-left",
                    isMe && "bg-primary/10 ring-2 ring-primary/30",
                    !isMe && "hover:bg-secondary/50"
                  )}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  {/* Position with medal */}
                  <div className="w-10 text-center">
                    {isTopThreePos ? (
                      <span className="text-xl">
                        {participant.position === 1 ? '🥇' : participant.position === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-lg font-bold text-muted-foreground">
                        #{participant.position}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0",
                      isMe && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {participant.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name & Time */}
                  <div className="flex-1 min-w-0">
                    <div className={cn("font-medium truncate", isMe && "font-bold text-primary")}>
                      {participant.name}
                      {isMe && <span className="text-primary/60 font-normal ml-1">(you)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((participant.finishTime || 0) / 1000).toFixed(1)}s
                    </div>
                  </div>

                  {/* WPM with bar */}
                  <div className="text-right flex items-center gap-2">
                    <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden hidden sm:block">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min(100, (participant.wpm / Math.max(...participants.map(p => p.wpm))) * 100)}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                    <div>
                      <div className="text-xl font-bold tabular-nums">{participant.wpm}</div>
                      <div className="text-xs text-muted-foreground">WPM</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onLeave} className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
              Leave
            </Button>
            <Button onClick={onPlayAgain} className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              Race Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
