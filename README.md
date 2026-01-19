# TypeFast - Typing Speed Test

A fast and clean typing speed test application with real-time multiplayer racing mode.

## Features

### Solo Mode
- **Time Mode**: Type as many words as possible within a time limit (15s, 30s, 60s, 120s)
- **Words Mode**: Type a specific number of words (10, 25, 50, 100)
- Real-time WPM and accuracy tracking
- Visual feedback for correct/incorrect characters
- Dark/Light theme toggle
- Keyboard shortcuts for quick restart

### Race Mode (Multiplayer)
- **Create or Join Races**: Create a race and share the 6-digit code with friends
- **Real-time Competition**: See all participants' progress live
- **Live Progress Tracking**: Visual progress bars show everyone's position
- **Race Results**: See final standings with WPM for each participant
- Up to 8 players per race

## Getting Started

### Development

The app requires two servers: the Next.js frontend and the WebSocket race server.

To run both together:

```bash
npm install
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Next.js frontend
npm run dev:next

# Terminal 2: WebSocket server for race mode
npm run dev:ws
```

Open [http://localhost:3000](http://localhost:3000) for solo mode.

Open [http://localhost:3000/race](http://localhost:3000/race) for race mode.

### Production

```bash
npm run build
npm run start
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js WebSocket server (ws package)
- **UI Components**: Radix UI primitives

## Project Structure

```
├── server/
│   └── raceServer.ts      # WebSocket server for multiplayer races
├── src/
│   ├── app/
│   │   ├── page.tsx       # Solo typing test
│   │   └── race/
│   │       └── page.tsx   # Race mode
│   ├── components/
│   │   ├── TypingTest.tsx     # Main solo test component
│   │   ├── RaceMode.tsx       # Race mode container
│   │   ├── RaceLobby.tsx      # Create/join race UI
│   │   ├── RaceProgress.tsx   # Live progress display
│   │   ├── RaceCountdown.tsx  # Pre-race countdown
│   │   └── RaceResults.tsx    # Final results display
│   ├── hooks/
│   │   ├── useTypingTest.ts   # Solo typing logic
│   │   └── useRace.ts         # Race WebSocket connection
│   └── lib/
│       ├── words.ts           # Word list
│       └── raceTypes.ts       # Shared types for race mode
```

## Environment Variables

- `WS_PORT`: WebSocket server port (default: 3001)

## Keyboard Shortcuts

- `Tab` + `Enter` or `Escape`: Restart test (solo mode)
- Standard typing keys for input
- Backspace for corrections
