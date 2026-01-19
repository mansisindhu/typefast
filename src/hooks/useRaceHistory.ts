"use client";

import { useState, useEffect, useCallback } from 'react';
import { RaceHistoryEntry, RaceParticipant, RaceConfig, MAX_RACE_HISTORY } from '@/lib/raceTypes';

const STORAGE_KEY = 'typefast_race_history';

export function useRaceHistory() {
  const [history, setHistory] = useState<RaceHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load race history:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error('Failed to save race history:', error);
      }
    }
  }, [history, isLoaded]);

  // Add a new race to history
  const addRace = useCallback((
    participants: RaceParticipant[],
    myParticipantId: string,
    config: RaceConfig
  ) => {
    const myResult = participants.find(p => p.id === myParticipantId);
    if (!myResult) return;

    const entry: RaceHistoryEntry = {
      id: `race_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
      config,
      participants: participants.map(p => ({
        id: p.id,
        name: p.name,
        progress: p.progress,
        wpm: p.wpm,
        finished: p.finished,
        finishTime: p.finishTime,
        position: p.position,
      })),
      myParticipantId,
      myPosition: myResult.position || 0,
      myWpm: myResult.wpm,
      myFinishTime: myResult.finishTime || 0,
    };

    setHistory(prev => {
      const newHistory = [entry, ...prev].slice(0, MAX_RACE_HISTORY);
      return newHistory;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Get stats from history
  const getStats = useCallback(() => {
    if (history.length === 0) {
      return {
        totalRaces: 0,
        wins: 0,
        podiums: 0,
        avgWpm: 0,
        bestWpm: 0,
        winRate: 0,
      };
    }

    const wins = history.filter(r => r.myPosition === 1).length;
    const podiums = history.filter(r => r.myPosition <= 3).length;
    const totalWpm = history.reduce((sum, r) => sum + r.myWpm, 0);
    const bestWpm = Math.max(...history.map(r => r.myWpm));

    return {
      totalRaces: history.length,
      wins,
      podiums,
      avgWpm: Math.round(totalWpm / history.length),
      bestWpm,
      winRate: Math.round((wins / history.length) * 100),
    };
  }, [history]);

  return {
    history,
    isLoaded,
    addRace,
    clearHistory,
    getStats,
  };
}
