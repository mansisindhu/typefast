// Shared types for race mode

export type RaceStatus = 'waiting' | 'countdown' | 'racing' | 'finished';
export type RaceMode = 'words' | 'time';

export interface RaceConfig {
  mode: RaceMode;
  wordCount: number;  // Number of words (for words mode)
  timeLimit: number;  // Time limit in seconds (for time mode)
}

export const DEFAULT_RACE_CONFIG: RaceConfig = {
  mode: 'words',
  wordCount: 30,
  timeLimit: 60,
};

export interface RaceParticipant {
  id: string;
  name: string;
  progress: number; // 0-100 percentage
  wpm: number;
  finished: boolean;
  finishTime?: number;
  position?: number;
}

export interface RaceState {
  raceId: string;
  status: RaceStatus;
  participants: RaceParticipant[];
  text: string[]; // Array of words
  countdownSeconds: number;
  startTime?: number;
  hostId: string;
  config: RaceConfig;
  timeRemaining?: number; // For time-based races
}

// WebSocket message types
export type ClientMessage =
  | { type: 'create_race'; name: string; config?: RaceConfig }
  | { type: 'join_race'; raceId: string; name: string }
  | { type: 'update_config'; config: RaceConfig }
  | { type: 'start_race' }
  | { type: 'progress_update'; progress: number; wpm: number }
  | { type: 'finish_race'; wpm: number }
  | { type: 'leave_race' };

export type ServerMessage =
  | { type: 'race_created'; raceId: string; participant: RaceParticipant }
  | { type: 'race_joined'; raceState: RaceState; participantId: string }
  | { type: 'participant_joined'; participant: RaceParticipant }
  | { type: 'participant_left'; participantId: string }
  | { type: 'config_updated'; config: RaceConfig }
  | { type: 'countdown_start'; countdownSeconds: number }
  | { type: 'race_start'; startTime: number; text: string[] }
  | { type: 'time_update'; timeRemaining: number }
  | { type: 'progress_broadcast'; participantId: string; progress: number; wpm: number }
  | { type: 'participant_finished'; participantId: string; position: number; finishTime: number; wpm: number }
  | { type: 'race_finished'; results: RaceParticipant[] }
  | { type: 'error'; message: string };

// Generate a short race code
export function generateRaceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Race history types
export interface RaceHistoryEntry {
  id: string;
  date: string;
  config: RaceConfig;
  participants: RaceParticipant[];
  myParticipantId: string;
  myPosition: number;
  myWpm: number;
  myFinishTime: number;
}

export const MAX_RACE_HISTORY = 10;
