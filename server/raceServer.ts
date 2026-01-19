import { WebSocketServer, WebSocket } from 'ws';
import { 
  RaceState, 
  RaceParticipant, 
  RaceConfig,
  ClientMessage, 
  ServerMessage,
  generateRaceCode,
  DEFAULT_RACE_CONFIG
} from '../src/lib/raceTypes';

// In-memory storage for races
const races = new Map<string, RaceState>();
const clientToRace = new Map<WebSocket, { raceId: string; participantId: string }>();
const raceClients = new Map<string, Map<string, WebSocket>>();

// Word list for generating race text
const wordList = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
];

function generateRaceText(wordCount: number = 30): string[] {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    words.push(wordList[randomIndex]);
  }
  return words;
}

function generateParticipantId(): string {
  return 'p_' + Math.random().toString(36).substring(2, 9);
}

function broadcast(raceId: string, message: ServerMessage, excludeClient?: WebSocket) {
  const clients = raceClients.get(raceId);
  if (!clients) return;
  
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

function sendToClient(client: WebSocket, message: ServerMessage) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

function handleCreateRace(client: WebSocket, name: string, config?: RaceConfig) {
  // Validate name
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    sendToClient(client, { type: 'error', message: 'Please enter a username' });
    return;
  }
  if (trimmedName.length < 2) {
    sendToClient(client, { type: 'error', message: 'Username must be at least 2 characters' });
    return;
  }
  if (trimmedName.length > 20) {
    sendToClient(client, { type: 'error', message: 'Username must be 20 characters or less' });
    return;
  }
  
  const raceId = generateRaceCode();
  const participantId = generateParticipantId();
  const raceConfig = config || DEFAULT_RACE_CONFIG;
  
  const participant: RaceParticipant = {
    id: participantId,
    name: trimmedName,
    progress: 0,
    wpm: 0,
    finished: false
  };
  
  // Generate text based on config
  const wordCount = raceConfig.mode === 'words' 
    ? raceConfig.wordCount 
    : Math.max(100, raceConfig.timeLimit * 3); // For time mode, generate enough words
  
  const raceState: RaceState = {
    raceId,
    status: 'waiting',
    participants: [participant],
    text: generateRaceText(wordCount),
    countdownSeconds: 3,
    hostId: participantId,
    config: raceConfig
  };
  
  races.set(raceId, raceState);
  clientToRace.set(client, { raceId, participantId });
  
  const clientsMap = new Map<string, WebSocket>();
  clientsMap.set(participantId, client);
  raceClients.set(raceId, clientsMap);
  
  sendToClient(client, { type: 'race_created', raceId, participant });
  sendToClient(client, { type: 'race_joined', raceState, participantId });
  
  console.log(`Race ${raceId} created by ${name}`);
}

function handleJoinRace(client: WebSocket, raceId: string, name: string) {
  // Validate name first
  const trimmedName = (name || '').trim();
  if (!trimmedName) {
    sendToClient(client, { type: 'error', message: 'Please enter a username' });
    return;
  }
  if (trimmedName.length < 2) {
    sendToClient(client, { type: 'error', message: 'Username must be at least 2 characters' });
    return;
  }
  if (trimmedName.length > 20) {
    sendToClient(client, { type: 'error', message: 'Username must be 20 characters or less' });
    return;
  }
  
  const race = races.get(raceId.toUpperCase());
  
  if (!race) {
    sendToClient(client, { type: 'error', message: 'Race not found' });
    return;
  }
  
  if (race.status !== 'waiting') {
    sendToClient(client, { type: 'error', message: 'Race has already started' });
    return;
  }
  
  if (race.participants.length >= 8) {
    sendToClient(client, { type: 'error', message: 'Race is full (max 8 players)' });
    return;
  }
  
  // Check for duplicate username (case-insensitive)
  const normalizedName = trimmedName.toLowerCase();
  const existingNames = race.participants.map(p => p.name.toLowerCase());
  if (existingNames.includes(normalizedName)) {
    sendToClient(client, { type: 'error', message: 'Username already taken in this race' });
    return;
  }
  
  const participantId = generateParticipantId();
  const participant: RaceParticipant = {
    id: participantId,
    name: trimmedName,
    progress: 0,
    wpm: 0,
    finished: false
  };
  
  race.participants.push(participant);
  clientToRace.set(client, { raceId: race.raceId, participantId });
  
  const clients = raceClients.get(race.raceId);
  if (clients) {
    clients.set(participantId, client);
  }
  
  // Send race state to the new participant
  sendToClient(client, { type: 'race_joined', raceState: race, participantId });
  
  // Notify others about the new participant
  broadcast(race.raceId, { type: 'participant_joined', participant }, client);
  
  console.log(`${name} joined race ${race.raceId}`);
}

function handleUpdateConfig(client: WebSocket, config: RaceConfig) {
  const clientInfo = clientToRace.get(client);
  if (!clientInfo) return;
  
  const race = races.get(clientInfo.raceId);
  if (!race) return;
  
  // Only host can update config
  if (race.hostId !== clientInfo.participantId) {
    sendToClient(client, { type: 'error', message: 'Only the host can change settings' });
    return;
  }
  
  if (race.status !== 'waiting') {
    sendToClient(client, { type: 'error', message: 'Cannot change settings after race has started' });
    return;
  }
  
  // Update config
  race.config = config;
  
  // Regenerate text based on new config
  const wordCount = config.mode === 'words' 
    ? config.wordCount 
    : Math.max(100, config.timeLimit * 3);
  race.text = generateRaceText(wordCount);
  
  // Broadcast config update to all participants
  broadcast(race.raceId, { type: 'config_updated', config });
  sendToClient(client, { type: 'config_updated', config });
  
  console.log(`Race ${race.raceId} config updated: ${config.mode} - ${config.mode === 'words' ? config.wordCount + ' words' : config.timeLimit + 's'}`);
}

function handleStartRace(client: WebSocket) {
  const clientInfo = clientToRace.get(client);
  if (!clientInfo) return;
  
  const race = races.get(clientInfo.raceId);
  if (!race) return;
  
  // Only host can start the race
  if (race.hostId !== clientInfo.participantId) {
    sendToClient(client, { type: 'error', message: 'Only the host can start the race' });
    return;
  }
  
  if (race.status !== 'waiting') {
    sendToClient(client, { type: 'error', message: 'Race has already started' });
    return;
  }
  
  // Start countdown
  race.status = 'countdown';
  let countdown = race.countdownSeconds;
  
  broadcast(race.raceId, { type: 'countdown_start', countdownSeconds: countdown });
  sendToClient(client, { type: 'countdown_start', countdownSeconds: countdown });
  
  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      race.status = 'racing';
      race.startTime = Date.now();
      race.timeRemaining = race.config.mode === 'time' ? race.config.timeLimit : undefined;
      
      const startMessage: ServerMessage = { type: 'race_start', startTime: race.startTime, text: race.text };
      broadcast(race.raceId, startMessage);
      sendToClient(client, startMessage);
      
      console.log(`Race ${race.raceId} started (${race.config.mode} mode)`);
      
      // For time-based races, set up a timer
      if (race.config.mode === 'time') {
        const timeInterval = setInterval(() => {
          if (!race.timeRemaining || race.status !== 'racing') {
            clearInterval(timeInterval);
            return;
          }
          
          race.timeRemaining--;
          
          // Broadcast time update every second
          const timeMessage: ServerMessage = { type: 'time_update', timeRemaining: race.timeRemaining };
          broadcast(race.raceId, timeMessage);
          
          // Time's up!
          if (race.timeRemaining <= 0) {
            clearInterval(timeInterval);
            
            // For time-based races, rank ALL participants by WPM (highest first)
            // Sort by WPM descending, then by progress descending as tiebreaker
            const sortedByWpm = [...race.participants].sort((a, b) => {
              if (b.wpm !== a.wpm) {
                return b.wpm - a.wpm; // Higher WPM wins
              }
              return b.progress - a.progress; // Higher progress as tiebreaker
            });
            
            // Assign positions based on WPM ranking
            sortedByWpm.forEach((p, index) => {
              p.finished = true;
              p.position = index + 1;
              p.finishTime = race.config.timeLimit * 1000;
            });
            
            race.status = 'finished';
            const results = sortedByWpm;
            const finishMessage: ServerMessage = { type: 'race_finished', results };
            broadcast(race.raceId, finishMessage);
            
            console.log(`Race ${race.raceId} finished (time limit reached)`);
          }
        }, 1000);
      }
    }
  }, 1000);
}

function handleProgressUpdate(client: WebSocket, progress: number, wpm: number) {
  const clientInfo = clientToRace.get(client);
  if (!clientInfo) return;
  
  const race = races.get(clientInfo.raceId);
  if (!race || race.status !== 'racing') return;
  
  const participant = race.participants.find(p => p.id === clientInfo.participantId);
  if (!participant || participant.finished) return;
  
  participant.progress = progress;
  participant.wpm = wpm;
  
  broadcast(race.raceId, {
    type: 'progress_broadcast',
    participantId: clientInfo.participantId,
    progress,
    wpm
  });
}

function handleFinishRace(client: WebSocket, wpm: number) {
  const clientInfo = clientToRace.get(client);
  if (!clientInfo) return;
  
  const race = races.get(clientInfo.raceId);
  if (!race || race.status !== 'racing') return;
  
  const participant = race.participants.find(p => p.id === clientInfo.participantId);
  if (!participant || participant.finished) return;
  
  const finishTime = Date.now() - (race.startTime || Date.now());
  
  participant.finished = true;
  participant.progress = 100;
  participant.wpm = wpm;
  participant.finishTime = finishTime;
  
  // For words mode: position is based on finish order (first to finish wins)
  // For time mode: position will be recalculated at the end based on WPM
  if (race.config.mode === 'words') {
    const finishedCount = race.participants.filter(p => p.finished).length;
    participant.position = finishedCount; // They are the nth person to finish
    
    broadcast(race.raceId, {
      type: 'participant_finished',
      participantId: clientInfo.participantId,
      position: participant.position,
      finishTime,
      wpm
    });
    sendToClient(client, {
      type: 'participant_finished',
      participantId: clientInfo.participantId,
      position: participant.position,
      finishTime,
      wpm
    });
    
    console.log(`${participant.name} finished race ${race.raceId} in position ${participant.position}`);
  } else {
    // Time mode: just mark as finished, position will be determined at end
    // Send update without final position
    broadcast(race.raceId, {
      type: 'participant_finished',
      participantId: clientInfo.participantId,
      position: 0, // Temporary, will be recalculated
      finishTime,
      wpm
    });
    sendToClient(client, {
      type: 'participant_finished',
      participantId: clientInfo.participantId,
      position: 0,
      finishTime,
      wpm
    });
    
    console.log(`${participant.name} completed all words in time race ${race.raceId} with ${wpm} WPM`);
  }
  
  // Check if all participants have finished
  const allFinished = race.participants.every(p => p.finished);
  if (allFinished) {
    race.status = 'finished';
    
    let results: RaceParticipant[];
    if (race.config.mode === 'words') {
      // Words mode: sort by position (finish order)
      results = [...race.participants].sort((a, b) => (a.position || 999) - (b.position || 999));
    } else {
      // Time mode: sort by WPM (highest first)
      results = [...race.participants].sort((a, b) => {
        if (b.wpm !== a.wpm) return b.wpm - a.wpm;
        return (a.finishTime || 0) - (b.finishTime || 0); // Faster finish time as tiebreaker
      });
      // Reassign positions based on WPM ranking
      results.forEach((p, index) => {
        p.position = index + 1;
      });
    }
    
    const finishMessage: ServerMessage = { type: 'race_finished', results };
    broadcast(race.raceId, finishMessage);
    sendToClient(client, finishMessage);
    
    // Clean up race after a delay
    setTimeout(() => {
      races.delete(race.raceId);
      raceClients.delete(race.raceId);
      console.log(`Race ${race.raceId} cleaned up`);
    }, 60000); // Keep race data for 1 minute after finishing
  }
}

function handleLeaveRace(client: WebSocket) {
  const clientInfo = clientToRace.get(client);
  if (!clientInfo) return;
  
  const race = races.get(clientInfo.raceId);
  if (!race) return;
  
  // Remove participant from race
  race.participants = race.participants.filter(p => p.id !== clientInfo.participantId);
  
  // Remove from clients map
  const clients = raceClients.get(clientInfo.raceId);
  if (clients) {
    clients.delete(clientInfo.participantId);
  }
  
  clientToRace.delete(client);
  
  // Notify others
  broadcast(race.raceId, { type: 'participant_left', participantId: clientInfo.participantId });
  
  // If race is empty or host left during waiting, clean up
  if (race.participants.length === 0 || 
      (race.status === 'waiting' && race.hostId === clientInfo.participantId)) {
    races.delete(race.raceId);
    raceClients.delete(race.raceId);
    console.log(`Race ${race.raceId} closed`);
  } else if (race.hostId === clientInfo.participantId && race.participants.length > 0) {
    // Transfer host to next participant
    race.hostId = race.participants[0].id;
  }
  
  console.log(`Participant left race ${race.raceId}`);
}

function handleClientDisconnect(client: WebSocket) {
  handleLeaveRace(client);
}

// Start WebSocket server
const PORT = parseInt(process.env.WS_PORT || '3001', 10);
const wss = new WebSocketServer({ port: PORT });

console.log(`Race WebSocket server running on port ${PORT}`);

wss.on('connection', (client: WebSocket) => {
  console.log('Client connected');
  
  client.on('message', (data: Buffer) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'create_race':
          handleCreateRace(client, message.name, message.config);
          break;
        case 'join_race':
          handleJoinRace(client, message.raceId, message.name);
          break;
        case 'update_config':
          handleUpdateConfig(client, message.config);
          break;
        case 'start_race':
          handleStartRace(client);
          break;
        case 'progress_update':
          handleProgressUpdate(client, message.progress, message.wpm);
          break;
        case 'finish_race':
          handleFinishRace(client, message.wpm);
          break;
        case 'leave_race':
          handleLeaveRace(client);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  client.on('close', () => {
    console.log('Client disconnected');
    handleClientDisconnect(client);
  });
  
  client.on('error', (error) => {
    console.error('WebSocket error:', error);
    handleClientDisconnect(client);
  });
});
