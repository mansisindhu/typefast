"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RaceParticipant, RaceConfig, RaceMode, DEFAULT_RACE_CONFIG } from '@/lib/raceTypes';
import { cn } from '@/lib/utils';

const WORD_OPTIONS = [15, 25, 50, 100];
const TIME_OPTIONS = [30, 60, 90, 120];

interface RaceStats {
  totalRaces: number;
  wins: number;
  avgWpm: number;
  bestWpm: number;
}

interface RaceLobbyProps {
  raceId: string | null;
  participants: RaceParticipant[];
  isHost: boolean;
  myParticipantId: string | null;
  config: RaceConfig;
  onCreateRace: (name: string, config: RaceConfig) => void;
  onJoinRace: (raceId: string, name: string) => void;
  onUpdateConfig: (config: RaceConfig) => void;
  onStartRace: () => void;
  onLeaveRace: () => void;
  connecting: boolean;
  error: string | null;
  onClearError: () => void;
  initialCode?: string;
  stats?: RaceStats;
  onShowHistory?: () => void;
}

export function RaceLobby({
  raceId,
  participants,
  isHost,
  myParticipantId,
  config,
  onCreateRace,
  onJoinRace,
  onUpdateConfig,
  onStartRace,
  onLeaveRace,
  connecting,
  error,
  onClearError,
  initialCode,
  stats,
  onShowHistory,
}: RaceLobbyProps) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState(initialCode || '');
  const [viewMode, setViewMode] = useState<'menu' | 'create' | 'join'>(initialCode ? 'join' : 'menu');
  const [nameError, setNameError] = useState<string | null>(null);
  
  // Local config state for creating a race
  const [localConfig, setLocalConfig] = useState<RaceConfig>(DEFAULT_RACE_CONFIG);

  // Validate username
  const validateName = (username: string): string | null => {
    const trimmed = username.trim();
    if (!trimmed) {
      return 'Please enter a username';
    }
    if (trimmed.length < 2) {
      return 'Username must be at least 2 characters';
    }
    if (trimmed.length > 20) {
      return 'Username must be 20 characters or less';
    }
    return null;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Clear error when user starts typing
    if (nameError) {
      setNameError(null);
    }
  };

  const handleCreate = () => {
    const error = validateName(name);
    if (error) {
      setNameError(error);
      return;
    }
    onCreateRace(name.trim(), localConfig);
  };

  const handleJoin = () => {
    const error = validateName(name);
    if (error) {
      setNameError(error);
      return;
    }
    if (!joinCode.trim()) {
      return;
    }
    onJoinRace(joinCode.trim(), name.trim());
  };

  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const copyCode = useCallback(() => {
    if (raceId) {
      navigator.clipboard.writeText(raceId);
      setCopied('code');
      setTimeout(() => setCopied(null), 2000);
    }
  }, [raceId]);

  const copyRaceLink = useCallback(() => {
    if (raceId) {
      const link = `${window.location.origin}/race?code=${raceId}`;
      navigator.clipboard.writeText(link);
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    }
  }, [raceId]);

  // In a race lobby - waiting for others
  if (raceId) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Race Lobby</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Share this code with friends to race together
            </p>
            
            {/* Race Code Display */}
            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-center gap-3">
                <code className="bg-background px-4 py-2 rounded-md text-2xl font-mono font-bold tracking-widest">
                  {raceId}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyCode}
                  className="gap-1"
                >
                  {copied === 'code' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-center">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={copyRaceLink}
                  className="text-muted-foreground hover:text-foreground gap-1"
                >
                  {copied === 'link' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      Copy Invite Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Race Configuration - Host Only */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Race Settings
              </h3>
              {!isHost && (
                <span className="text-xs text-muted-foreground">Host can change</span>
              )}
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-3 space-y-3">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">Mode:</span>
                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 flex-1">
                  <button
                    onClick={() => isHost && onUpdateConfig({ ...config, mode: 'words' })}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-md text-sm transition-colors",
                      config.mode === 'words'
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                      !isHost && "cursor-not-allowed opacity-60"
                    )}
                    disabled={!isHost}
                  >
                    Words
                  </button>
                  <button
                    onClick={() => isHost && onUpdateConfig({ ...config, mode: 'time' })}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-md text-sm transition-colors",
                      config.mode === 'time'
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                      !isHost && "cursor-not-allowed opacity-60"
                    )}
                    disabled={!isHost}
                  >
                    Time
                  </button>
                </div>
              </div>

              {/* Word/Time Options */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-16">
                  {config.mode === 'words' ? 'Words:' : 'Time:'}
                </span>
                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 flex-1">
                  {config.mode === 'words'
                    ? WORD_OPTIONS.map((count) => (
                        <button
                          key={count}
                          onClick={() => isHost && onUpdateConfig({ ...config, wordCount: count })}
                          className={cn(
                            "flex-1 px-2 py-1.5 rounded-md text-sm transition-colors",
                            config.wordCount === count
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground",
                            !isHost && "cursor-not-allowed opacity-60"
                          )}
                          disabled={!isHost}
                        >
                          {count}
                        </button>
                      ))
                    : TIME_OPTIONS.map((time) => (
                        <button
                          key={time}
                          onClick={() => isHost && onUpdateConfig({ ...config, timeLimit: time })}
                          className={cn(
                            "flex-1 px-2 py-1.5 rounded-md text-sm transition-colors",
                            config.timeLimit === time
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground",
                            !isHost && "cursor-not-allowed opacity-60"
                          )}
                          disabled={!isHost}
                        >
                          {time}s
                        </button>
                      ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Participants ({participants.length}/8)
            </h3>
            <div className="space-y-2">
              {participants.map((p, index) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg",
                    p.id === myParticipantId ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
                  )}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: getPlayerColor(index) }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium flex-1">{p.name}</span>
                  {p.id === myParticipantId && (
                    <span className="text-xs text-muted-foreground">(you)</span>
                  )}
                  {participants[0]?.id === p.id && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded">
                      host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onLeaveRace}
              className="flex-1"
            >
              Leave
            </Button>
            {isHost && (
              <Button
                onClick={onStartRace}
                className="flex-1"
                disabled={participants.length < 1}
              >
                Start Race
              </Button>
            )}
          </div>

          {!isHost && (
            <p className="text-center text-sm text-muted-foreground">
              Waiting for host to start the race...
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Main menu
  if (viewMode === 'menu') {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Typing Race</h2>
            <p className="text-muted-foreground">
              Compete with others in real-time
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button onClick={onClearError} className="text-destructive hover:opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
          )}

          {/* Quick Stats */}
          {stats && stats.totalRaces > 0 && (
            <button
              onClick={onShowHistory}
              className="w-full p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Stats</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold">{stats.totalRaces}</div>
                  <div className="text-xs text-muted-foreground">Races</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-500">{stats.wins}</div>
                  <div className="text-xs text-muted-foreground">Wins</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{stats.avgWpm}</div>
                  <div className="text-xs text-muted-foreground">Avg WPM</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-500">{stats.bestWpm}</div>
                  <div className="text-xs text-muted-foreground">Best</div>
                </div>
              </div>
            </button>
          )}

          <div className="space-y-3">
            <Button
              onClick={() => { setViewMode('create'); setNameError(null); }}
              className="w-full h-12 text-lg"
              disabled={connecting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M5 12h14"/><path d="M12 5v14"/>
              </svg>
              Create Race
            </Button>
            <Button
              variant="outline"
              onClick={() => { setViewMode('join'); setNameError(null); }}
              className="w-full h-12 text-lg"
              disabled={connecting}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" x2="3" y1="12" y2="12"/>
              </svg>
              Join Race
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create race form
  if (viewMode === 'create') {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Create Race</h2>
            <p className="text-muted-foreground">
              Enter your name to create a new race
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button onClick={onClearError} className="text-destructive hover:opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Enter your name (2-20 characters)"
                maxLength={20}
                className={cn(
                  "w-full h-10 px-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                  nameError ? "border-destructive" : "border-input"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
              />
              {nameError && (
                <p className="text-sm text-destructive mt-1">{nameError}</p>
              )}
            </div>

            {/* Race Mode Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Race Mode</label>
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                <button
                  onClick={() => setLocalConfig(prev => ({ ...prev, mode: 'words' }))}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-md text-sm transition-colors",
                    localConfig.mode === 'words'
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Words
                </button>
                <button
                  onClick={() => setLocalConfig(prev => ({ ...prev, mode: 'time' }))}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-md text-sm transition-colors",
                    localConfig.mode === 'time'
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Time
                </button>
              </div>
            </div>

            {/* Word Count / Time Limit */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {localConfig.mode === 'words' ? 'Number of Words' : 'Time Limit'}
              </label>
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
                {localConfig.mode === 'words'
                  ? WORD_OPTIONS.map((count) => (
                      <button
                        key={count}
                        onClick={() => setLocalConfig(prev => ({ ...prev, wordCount: count }))}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-md text-sm transition-colors",
                          localConfig.wordCount === count
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {count}
                      </button>
                    ))
                  : TIME_OPTIONS.map((time) => (
                      <button
                        key={time}
                        onClick={() => setLocalConfig(prev => ({ ...prev, timeLimit: time }))}
                        className={cn(
                          "flex-1 px-3 py-2 rounded-md text-sm transition-colors",
                          localConfig.timeLimit === time
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {time}s
                      </button>
                    ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setViewMode('menu'); setNameError(null); }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleCreate}
              className="flex-1"
              disabled={!name.trim() || connecting}
            >
              {connecting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Join race form
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 max-w-md mx-auto">
      <CardContent className="pt-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Join Race</h2>
          <p className="text-muted-foreground">
            Enter the race code to join
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={onClearError} className="text-destructive hover:opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter your name (2-20 characters)"
              maxLength={20}
              className={cn(
                "w-full h-10 px-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                nameError ? "border-destructive" : "border-input"
              )}
            />
            {nameError && (
              <p className="text-sm text-destructive mt-1">{nameError}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Race Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono text-center text-lg tracking-widest uppercase"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin();
              }}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { setViewMode('menu'); setNameError(null); }}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            onClick={handleJoin}
            className="flex-1"
            disabled={!name.trim() || !joinCode.trim() || connecting}
          >
            {connecting ? 'Joining...' : 'Join'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Generate consistent colors for players
function getPlayerColor(index: number): string {
  const colors = [
    '#EF4444', // red
    '#3B82F6', // blue
    '#22C55E', // green
    '#F59E0B', // amber
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#F97316', // orange
  ];
  return colors[index % colors.length];
}

export { getPlayerColor };
