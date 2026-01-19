"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RaceState, 
  RaceParticipant, 
  RaceStatus,
  RaceConfig,
  ClientMessage, 
  ServerMessage,
  DEFAULT_RACE_CONFIG
} from '@/lib/raceTypes';

interface UseRaceOptions {
  wsUrl?: string;
}

interface UseRaceReturn {
  // Connection state
  connected: boolean;
  connecting: boolean;
  error: string | null;
  
  // Race state
  raceId: string | null;
  raceStatus: RaceStatus | null;
  participants: RaceParticipant[];
  raceText: string[];
  countdown: number;
  myParticipantId: string | null;
  isHost: boolean;
  config: RaceConfig;
  timeRemaining: number | null;
  
  // Actions
  createRace: (name: string, config?: RaceConfig) => void;
  joinRace: (raceId: string, name: string) => void;
  updateConfig: (config: RaceConfig) => void;
  startRace: () => void;
  updateProgress: (progress: number, wpm: number) => void;
  finishRace: (wpm: number) => void;
  leaveRace: () => void;
  clearError: () => void;
}

export function useRace({ wsUrl }: UseRaceOptions = {}): UseRaceReturn {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [raceState, setRaceState] = useState<RaceState | null>(null);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine WebSocket URL
  const getWsUrl = useCallback(() => {
    if (wsUrl) return wsUrl;
    if (typeof window === 'undefined') return 'ws://localhost:3001';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:3001`;
  }, [wsUrl]);
  
  // Handle server messages
  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'race_created':
        // Race created, waiting for race_joined message
        break;
        
      case 'race_joined':
        setRaceState(message.raceState);
        setMyParticipantId(message.participantId);
        break;
        
      case 'participant_joined':
        setRaceState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: [...prev.participants, message.participant]
          };
        });
        break;
        
      case 'participant_left':
        setRaceState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.filter(p => p.id !== message.participantId)
          };
        });
        break;
        
      case 'config_updated':
        setRaceState(prev => prev ? { ...prev, config: message.config } : prev);
        break;
        
      case 'countdown_start':
        setCountdown(message.countdownSeconds);
        setRaceState(prev => prev ? { ...prev, status: 'countdown' } : prev);
        
        // Start countdown timer
        let remaining = message.countdownSeconds;
        const interval = setInterval(() => {
          remaining--;
          setCountdown(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
          }
        }, 1000);
        break;
        
      case 'race_start':
        setRaceState(prev => {
          if (!prev) return prev;
          return { 
            ...prev, 
            status: 'racing',
            startTime: message.startTime,
            text: message.text
          };
        });
        setCountdown(0);
        // Set initial time remaining for time-based races
        setTimeRemaining(prev => {
          const state = raceState;
          if (state?.config.mode === 'time') {
            return state.config.timeLimit;
          }
          return null;
        });
        break;
        
      case 'time_update':
        setTimeRemaining(message.timeRemaining);
        break;
        
      case 'progress_broadcast':
        setRaceState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.map(p =>
              p.id === message.participantId
                ? { ...p, progress: message.progress, wpm: message.wpm }
                : p
            )
          };
        });
        break;
        
      case 'participant_finished':
        setRaceState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.map(p =>
              p.id === message.participantId
                ? { 
                    ...p, 
                    finished: true, 
                    progress: 100,
                    position: message.position,
                    finishTime: message.finishTime,
                    wpm: message.wpm
                  }
                : p
            )
          };
        });
        break;
        
      case 'race_finished':
        setRaceState(prev => prev ? { 
          ...prev, 
          status: 'finished',
          participants: message.results
        } : prev);
        break;
        
      case 'error':
        setError(message.message);
        break;
    }
  }, []);
  
  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnecting(true);
    setError(null);
    
    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;
      
      ws.onopen = () => {
        setConnected(true);
        setConnecting(false);
        console.log('Connected to race server');
      };
      
      ws.onclose = () => {
        setConnected(false);
        setConnecting(false);
        wsRef.current = null;
      };
      
      ws.onerror = () => {
        setError('Failed to connect to race server');
        setConnecting(false);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          handleServerMessage(message);
        } catch (parseError) {
          console.error('Failed to parse server message:', parseError);
        }
      };
    } catch {
      setError('Failed to connect to race server');
      setConnecting(false);
    }
  }, [getWsUrl, handleServerMessage]);
  
  // Send message to server
  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      setError('Not connected to race server');
    }
  }, []);
  
  // Actions
  const createRace = useCallback((name: string, config?: RaceConfig) => {
    const raceConfig = config || DEFAULT_RACE_CONFIG;
    if (!connected) {
      connect();
      // Wait for connection then create race
      const checkConnection = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(checkConnection);
          send({ type: 'create_race', name, config: raceConfig });
        }
      }, 100);
      setTimeout(() => clearInterval(checkConnection), 5000);
    } else {
      send({ type: 'create_race', name, config: raceConfig });
    }
  }, [connected, connect, send]);
  
  const joinRace = useCallback((raceId: string, name: string) => {
    if (!connected) {
      connect();
      const checkConnection = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          clearInterval(checkConnection);
          send({ type: 'join_race', raceId: raceId.toUpperCase(), name });
        }
      }, 100);
      setTimeout(() => clearInterval(checkConnection), 5000);
    } else {
      send({ type: 'join_race', raceId: raceId.toUpperCase(), name });
    }
  }, [connected, connect, send]);
  
  const updateConfig = useCallback((config: RaceConfig) => {
    send({ type: 'update_config', config });
  }, [send]);
  
  const startRace = useCallback(() => {
    send({ type: 'start_race' });
  }, [send]);
  
  const updateProgress = useCallback((progress: number, wpm: number) => {
    send({ type: 'progress_update', progress, wpm });
  }, [send]);
  
  const finishRace = useCallback((wpm: number) => {
    send({ type: 'finish_race', wpm });
  }, [send]);
  
  const leaveRace = useCallback(() => {
    send({ type: 'leave_race' });
    setRaceState(null);
    setMyParticipantId(null);
    setCountdown(0);
    setTimeRemaining(null);
  }, [send]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    const ws = wsRef.current;
    const reconnectTimeout = reconnectTimeoutRef.current;
    
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);
  
  // Computed values
  const isHost = raceState?.hostId === myParticipantId;
  const config = raceState?.config || DEFAULT_RACE_CONFIG;
  
  return {
    connected,
    connecting,
    error,
    raceId: raceState?.raceId || null,
    raceStatus: raceState?.status || null,
    participants: raceState?.participants || [],
    raceText: raceState?.text || [],
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
    clearError
  };
}
