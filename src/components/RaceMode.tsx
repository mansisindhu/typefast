"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRace } from '@/hooks/useRace';
import { useRaceHistory } from '@/hooks/useRaceHistory';
import { useTheme } from '@/hooks/useTheme';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RaceLobby } from '@/components/RaceLobby';
import { RaceProgress } from '@/components/RaceProgress';
import { RaceCountdown } from '@/components/RaceCountdown';
import { RaceResults } from '@/components/RaceResults';
import { RaceHistory } from '@/components/RaceHistory';
import { TypingDisplay } from '@/components/TypingDisplay';
import { WordState } from '@/hooks/useTypingTest';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface RaceModeProps {
  initialCode?: string;
}

export function RaceMode({ initialCode }: RaceModeProps) {
  const {
    connecting,
    error,
    raceId,
    raceStatus,
    participants,
    raceText,
    countdown,
    myParticipantId,
    isHost,
    config,
    timeRemaining,
    createRace,
    joinRace,
    updateConfig,
    startRace,
    updateProgress,
    finishRace,
    leaveRace,
    clearError,
  } = useRace();

  const { theme, toggleTheme, mounted } = useTheme();
  const { history, addRace, clearHistory, getStats } = useRaceHistory();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Typing state
  const [words, setWords] = useState<WordState[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [hasFinished, setHasFinished] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);


  // Refs for callbacks
  const currentWordIndexRef = useRef(0);
  const currentCharIndexRef = useRef(0);
  const wordsRef = useRef<WordState[]>([]);
  const hasFinishedRef = useRef(false);
  const lastRaceStatusRef = useRef<string | null>(null);

  // Keep refs in sync
  useEffect(() => {
    currentWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex]);

  useEffect(() => {
    currentCharIndexRef.current = currentCharIndex;
  }, [currentCharIndex]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  useEffect(() => {
    hasFinishedRef.current = hasFinished;
  }, [hasFinished]);

  // Helper function to create word states
  const createWordStates = useCallback((text: string[]): WordState[] => {
    return text.map(word => ({
      original: word,
      characters: word.split('').map(char => ({
        char,
        status: 'pending' as const
      })),
      typed: ''
    }));
  }, []);

  // Initialize words when race text becomes available
  useEffect(() => {
    if (raceText.length > 0 && words.length === 0) {
      const newWords = createWordStates(raceText);
      setWords(newWords);
      wordsRef.current = newWords;
    }
  }, [raceText, words.length, createWordStates]);

  // Reset when race transitions to 'racing' state
  useEffect(() => {
    if (raceStatus === 'racing' && lastRaceStatusRef.current !== 'racing') {
      // Reset all state for new race
      const newWords = createWordStates(raceText);
      setWords(newWords);
      wordsRef.current = newWords;
      setCurrentWordIndex(0);
      currentWordIndexRef.current = 0;
      setCurrentCharIndex(0);
      currentCharIndexRef.current = 0;
      setStartTime(Date.now());
      setHasFinished(false);
      hasFinishedRef.current = false;
      setElapsedTime(0);
    }
    lastRaceStatusRef.current = raceStatus;
  }, [raceStatus, raceText, createWordStates]);

  // Calculate progress and WPM
  const calculateProgressAndWpm = useCallback(() => {
    const totalChars = raceText.join(' ').length;
    let typedChars = 0;
    let correctChars = 0;
    
    // Count characters in completed words
    for (let i = 0; i < currentWordIndexRef.current && i < wordsRef.current.length; i++) {
      const word = wordsRef.current[i];
      if (!word) continue;
      typedChars += word.original.length + 1; // +1 for space
      
      // Count correct characters for WPM
      for (const charState of word.characters) {
        if (charState.status === 'correct') {
          correctChars++;
        }
      }
      correctChars++; // Add space as correct for completed words
    }
    
    // Add characters from current word
    typedChars += currentCharIndexRef.current;
    
    // Count correct characters in current word for WPM
    const currentWord = wordsRef.current[currentWordIndexRef.current];
    if (currentWord) {
      for (let i = 0; i < currentWord.characters.length && i < currentWord.original.length; i++) {
        if (currentWord.characters[i]?.status === 'correct') {
          correctChars++;
        }
      }
    }

    // Progress is based on typed characters (position in text)
    const progress = totalChars > 0 ? Math.min((typedChars / totalChars) * 100, 100) : 0;
    
    // WPM is based on correct characters only
    let wpm = 0;
    if (startTime) {
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (elapsedMinutes > 0) {
        wpm = Math.round((correctChars / 5) / elapsedMinutes);
      }
    }

    return { progress, wpm };
  }, [raceText, startTime]);

  // Periodic progress updates and elapsed time
  useEffect(() => {
    if (raceStatus !== 'racing' || hasFinished) return;

    const interval = setInterval(() => {
      if (!hasFinishedRef.current) {
        const { progress, wpm } = calculateProgressAndWpm();
        updateProgress(progress, wpm);
      }
      if (startTime) {
        setElapsedTime((Date.now() - startTime) / 1000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [raceStatus, hasFinished, calculateProgressAndWpm, updateProgress, startTime]);

  // Handle key press - matches solo mode behavior exactly
  const handleKeyPress = useCallback((key: string) => {
    if (raceStatus !== 'racing' || hasFinishedRef.current) return;

    const wordIdx = currentWordIndexRef.current;
    const charIdx = currentCharIndexRef.current;
    const currentWords = wordsRef.current;

    if (!currentWords || currentWords.length === 0 || !currentWords[wordIdx]) {
      return;
    }

    // Handle backspace
    if (key === 'Backspace') {
      if (charIdx > 0) {
        // Delete character in current word
        const newCharIdx = charIdx - 1;
        const word = currentWords[wordIdx];
        const newWords = [...currentWords];
        const newWord = { ...word };

        if (newCharIdx >= word.original.length) {
          // Remove extra character
          newWord.characters = word.characters.slice(0, -1);
        } else {
          // Reset character to pending
          newWord.characters = [...word.characters];
          newWord.characters[newCharIdx] = {
            char: word.original[newCharIdx],
            status: 'pending'
          };
        }

        newWord.typed = word.typed.slice(0, -1);
        newWords[wordIdx] = newWord;

        wordsRef.current = newWords;
        currentCharIndexRef.current = newCharIdx;
        setWords(newWords);
        setCurrentCharIndex(newCharIdx);
      } else if (wordIdx > 0) {
        // Go back to previous word
        const prevWordIdx = wordIdx - 1;
        const prevWord = currentWords[prevWordIdx];
        const newCharIdx = prevWord.typed.length;

        currentWordIndexRef.current = prevWordIdx;
        currentCharIndexRef.current = newCharIdx;
        setCurrentWordIndex(prevWordIdx);
        setCurrentCharIndex(newCharIdx);
      }
      return;
    }

    // Handle space - move to next word
    if (key === ' ') {
      if (charIdx === 0) return; // Don't move if nothing typed

      // Check if this is the last word
      if (wordIdx >= raceText.length - 1) {
        // Finished the race!
        hasFinishedRef.current = true;
        setHasFinished(true);
        const { wpm } = calculateProgressAndWpm();
        finishRace(wpm);
        return;
      }

      const newWordIdx = wordIdx + 1;
      currentWordIndexRef.current = newWordIdx;
      currentCharIndexRef.current = 0;
      setCurrentWordIndex(newWordIdx);
      setCurrentCharIndex(0);

      // Update progress
      const { progress, wpm } = calculateProgressAndWpm();
      updateProgress(progress, wpm);
      return;
    }

    // Handle regular character input (ignore non-printable)
    if (key.length !== 1) return;

    const word = currentWords[wordIdx];
    const newWords = [...currentWords];
    const newWord = { ...word };
    newWord.characters = [...word.characters];

    if (charIdx < word.original.length) {
      // Normal character within word
      const expected = word.original[charIdx];
      const isCorrect = key === expected;
      newWord.characters[charIdx] = {
        char: expected,
        status: isCorrect ? 'correct' : 'incorrect'
      };
    } else {
      // Extra character
      newWord.characters.push({
        char: key,
        status: 'extra'
      });
    }

    newWord.typed = word.typed + key;
    newWords[wordIdx] = newWord;

    const newCharIdx = charIdx + 1;

    wordsRef.current = newWords;
    currentCharIndexRef.current = newCharIdx;
    setWords(newWords);
    setCurrentCharIndex(newCharIdx);

    // Update progress periodically
    if (newCharIdx % 5 === 0) {
      const { progress, wpm } = calculateProgressAndWpm();
      updateProgress(progress, wpm);
    }
  }, [raceStatus, raceText, calculateProgressAndWpm, updateProgress, finishRace]);

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (raceStatus !== 'racing') return;

    if (containerRef.current && document.activeElement !== containerRef.current) {
      containerRef.current.focus();
      setIsFocused(true);
    }

    // Prevent paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      return;
    }

    // Ignore ctrl/cmd/alt combinations
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      handleKeyPress('Backspace');
      return;
    }

    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      handleKeyPress(' ');
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      handleKeyPress(e.key);
    }
  }, [raceStatus, handleKeyPress]);

  // Set up keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Check if URL has initial code and try to join
  useEffect(() => {
    if (initialCode && !raceId) {
      // We'll let the user enter their name first
    }
  }, [initialCode, raceId]);

  // Focus management
  useEffect(() => {
    if (raceStatus === 'racing' && containerRef.current) {
      containerRef.current.focus();
    }
  }, [raceStatus]);

  // Focus/blur handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    container.addEventListener('focus', handleFocus);
    container.addEventListener('blur', handleBlur);

    return () => {
      container.removeEventListener('focus', handleFocus);
      container.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Save race to history when finished
  const hasAddedToHistory = useRef(false);
  useEffect(() => {
    if (raceStatus === 'finished' && myParticipantId && !hasAddedToHistory.current) {
      hasAddedToHistory.current = true;
      addRace(participants, myParticipantId, config);
    }
    if (raceStatus !== 'finished') {
      hasAddedToHistory.current = false;
    }
  }, [raceStatus, participants, myParticipantId, config, addRace]);

  // Handle play again
  const handlePlayAgain = () => {
    leaveRace();
    setWords([]);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setStartTime(null);
    setHasFinished(false);
    setElapsedTime(0);
  };

  if (!mounted) {
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
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowHistory(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            title="Race History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M12 7v5l4 2"/>
            </svg>
            <span className="hidden sm:inline">History</span>
          </button>
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Solo Mode
          </Link>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <RaceHistory
            history={history}
            stats={getStats()}
            onClearHistory={clearHistory}
            onClose={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 pb-20">
        <div className="w-full max-w-4xl">
          {/* Show countdown overlay */}
          {raceStatus === 'countdown' && countdown > 0 && (
            <RaceCountdown countdown={countdown} config={config} />
          )}

          {/* Race finished - show results */}
          {raceStatus === 'finished' ? (
            <RaceResults
              participants={participants}
              myParticipantId={myParticipantId}
              onPlayAgain={handlePlayAgain}
              onLeave={handlePlayAgain}
            />
          ) : raceStatus === 'racing' || raceStatus === 'countdown' ? (
            /* Racing view */
            <div className="space-y-6">
              {/* Timer/Progress display */}
              {raceStatus === 'racing' && (
                <div className="flex justify-center">
                  <div className="text-4xl md:text-5xl font-mono font-bold text-primary tabular-nums">
                    {config.mode === 'time' && timeRemaining !== null
                      ? `${timeRemaining}s`
                      : `${elapsedTime.toFixed(1)}s`
                    }
                  </div>
                </div>
              )}

              {/* Progress bars */}
              <RaceProgress
                participants={participants}
                myParticipantId={myParticipantId}
              />

              {/* Typing area */}
              {raceStatus === 'racing' && (
                <div
                  className={cn(
                    "relative transition-opacity duration-200",
                    !isFocused && "opacity-50"
                  )}
                  onClick={() => {
                    containerRef.current?.focus();
                    setIsFocused(true);
                  }}
                >
                  <TypingDisplay
                    words={words}
                    currentWordIndex={currentWordIndex}
                    currentCharIndex={currentCharIndex}
                    status={hasFinished ? 'finished' : 'running'}
                  />

                  {!isFocused && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
                      <p className="text-muted-foreground">
                        Click anywhere to focus
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Lobby view */
            <RaceLobby
              raceId={raceId}
              participants={participants}
              isHost={isHost}
              myParticipantId={myParticipantId}
              config={config}
              onCreateRace={createRace}
              onJoinRace={joinRace}
              onUpdateConfig={updateConfig}
              onStartRace={startRace}
              onLeaveRace={handlePlayAgain}
              connecting={connecting}
              error={error}
              onClearError={clearError}
              initialCode={initialCode}
              stats={getStats()}
              onShowHistory={() => setShowHistory(true)}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        {raceStatus === 'racing' ? (
          <p>Type to race! First to finish wins.</p>
        ) : (
          <p>Create or join a race to compete with others</p>
        )}
      </footer>
    </div>
  );
}
