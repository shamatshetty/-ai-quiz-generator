# ⚡ QuizPop! - Real-Time Multiplayer Classroom Quiz

A high-performance, real-time multiplayer quiz web application designed specifically for classroom environments and live workshops. A teacher/host creates or launches a quiz, students join from their smartphones or laptops using a unique 6-character room PIN or QR code, questions feature server-authoritative countdown timers with Kahoot-style speed-based scoring, live leaderboards update after every question, hosts can trigger celebratory mid-quiz "Prize Moments", and an end-of-game 3D winners podium crowns the top 3 champions with CSV export.

---

## 🚀 Key Features

### 1. Host / Teacher Experience
- **Pre-Seeded Quizzes**: Includes a pre-populated 10-question Science & Digital Tech quiz ready to play out of the box.
- **Custom Quiz Builder**: Add questions manually with 4 options, customizable time limits (10s–45s), and post-question explanations.
- **Bulk CSV / JSON Import**: Easily upload questions in bulk via CSV or JSON format.
- **Projector-Optimized Lobby**: High-resolution 6-character room code, shareable join link, dynamic QR code, and real-time joining roster.
- **1-Click 100+ Student Simulator**: Built-in test buttons (`+5`, `+20`, `+50` bots) in the lobby to simulate a full classroom responding with realistic random delays.
- **Live Host Control Panel**: Pause, resume, or skip questions; view live answer submission counters; reveal answers with real-time response distribution bar charts; show leaderboards; and end the quiz.
- **Mid-Quiz "Prize Moments"**: Freeze the quiz at any time to award prizes to the **Current Leader**, **Most Improved / Hot Streak**, or a **Lucky Draw** drawn from students who answered correctly.
- **Winners Podium & CSV Export**: Olympic 3D podium (1st, 2nd, 3rd) with celebratory confetti bursts and a one-click button to download detailed class performance data as a `.csv` file.

### 2. Student / Player Experience
- **Zero Friction Join**: No sign-up or login required. Join with a 6-character PIN or by scanning the teacher's QR code.
- **Persistent Sessions**: Reconnection handling via `sessionToken` stored in `localStorage`. If a student refreshes their browser mid-quiz, their score, streak, and room state are automatically restored.
- **Server-Authoritative Timer**: Visual countdown ring synchronized to the server clock every second, preventing client-side timer tampering.
- **Anti-Cheat Question Delivery**: The server withholds the correct answer from student sockets during the question countdown, preventing DevTools inspection.
- **Instant Speed-Based Scoring**: Kahoot-style scoring algorithm awarding up to 1000 base points based on response speed, plus consecutive streak bonuses.
- **Gamified Sound FX**: Built-in Web Audio API sound synthesizer for tick-tocks, answer chimes, prize fanfares, and podium celebrations (no external MP3 dependencies, with an instant mute toggle).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons, Canvas-Confetti, QRCode.react, Socket.IO Client.
- **Backend**: Node.js, Express, Socket.IO (WebSockets with HTTP polling fallback).
- **Database**: SQLite (via Prisma ORM) for zero-configuration local development, seamlessly upgradeable to PostgreSQL for cloud deployment.
- **Concurrency & Concurrency Tools**: Built-in virtual student generator and standalone Node.js simulation script.

---

## 📂 Project Structure

```
├── .env.example                # Root environment template
├── package.json                # Root orchestration scripts
├── README.md                   # Full documentation & guide
├── server/                     # Node.js + Express + Socket.IO Backend
│   ├── .env                    # Server environment variables
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma ORM schema (SQLite / PostgreSQL)
│   │   ├── seed.js             # 10-Question Science & Tech sample quiz
│   │   └── dev.db              # SQLite local database
│   ├── scripts/
│   │   └── simulateStudents.js # Headless Socket.IO load-testing script
│   └── src/
│       ├── prisma.js           # Prisma client singleton
│       ├── roomManager.js      # In-memory room state, timers, scoring & persistence
│       ├── socketHandlers.js   # Real-time WebSocket protocol handlers
│       ├── routes/quizRoutes.js# REST endpoints for quizzes, questions & CSV export
│       └── server.js           # Express app & HTTP/Socket server entry
└── client/                     # React + Vite Frontend
    ├── .env                    # Client environment variables
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.jsx             # Top-level view coordinator (Host vs Student)
        ├── main.jsx            # React root with SocketProvider
        ├── context/SocketContext.jsx # WebSocket connection & session management
        ├── utils/
        │   ├── sound.js        # Web Audio synthesizer for ticks, fanfares & chimes
        │   └── avatars.js      # Avatar choices & Kahoot color definitions
        ├── components/
        │   ├── Navbar.jsx      # Sticky navbar with PIN, audio toggle & status
        │   └── TimerRing.jsx   # SVG animated countdown ring
        └── views/
            ├── Host/           # Host Dashboard, Lobby, and Live Control Panel
            ├── Student/        # Student Join, Waiting Room, Question, and Feedback
            └── Shared/         # Leaderboard, Prize Moment, and Winners Podium
```

---

## ⚡ Getting Started (Local Setup)

### Prerequisites
- Node.js 18+ (tested on Node v20/v22/v26)
- npm 9+

### 1. Install All Dependencies
From the project root:
```bash
# Windows PowerShell (or bash):
npm run setup
```
*(This installs dependencies in root, server, and client, and generates the Prisma client).*

### 2. Seed the Database
Populate the 10-question Science & Digital Tech quiz:
```bash
npm run seed
```

### 3. Start Both Server & Client Concurrently
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API & WebSockets**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 🧪 How to Simulate 100+ Concurrent Students

We provide two convenient ways to simulate realistic classroom load:

### Method A: 1-Click In-App Simulator (Recommended)
1. Open [http://localhost:5173](http://localhost:5173) in your browser and click **"Host / Teacher Portal"**.
2. Click **"Launch Live Room"** on the sample quiz.
3. In the Host Lobby, look at the right card titled **"Test 100+ Students Simulation"**.
4. Click **`+20 Bots`** or **`+50 Bots`**. You can click it multiple times to reach 100+ students!
5. Notice all simulated students immediately populate the lobby grid with unique avatars.
6. Click **"Start Quiz Now"**. The bots will answer each question with randomized delays between 1.5s and the time limit, and with realistic accuracy.

### Method B: Headless CLI Script
You can also launch simulated students from a separate terminal window:
```bash
node server/scripts/simulateStudents.js --room <ROOM_PIN> --count 50 --server http://localhost:4000
```
*(Replace `<ROOM_PIN>` with the active 6-character room code shown on the host screen).*

---

## 📡 Real-Time Socket.IO Event Reference

| Event Name | Direction | Payload | Purpose |
|---|---|---|---|
| `host:create-room` | Host &rarr; Server | `{ quizId, customQuiz }` | Creates room, joins host rooms |
| `student:join-room` | Student &rarr; Server | `{ roomCode, name, avatar, sessionToken }` | Enters room; sets persistent token |
| `room:player-list-update`| Server &rarr; Room | `{ playerCount, players }` | Broadcasts joined student roster |
| `host:start-quiz` | Host &rarr; Server | `{ roomCode }` | Begins quiz flow |
| `question:next` | Server &rarr; Room | `{ questionIndex, question, timeLimit }` | Delivers question (**correct option hidden from students**) |
| `question:timer-tick` | Server &rarr; Room | `{ remainingSeconds, totalSeconds }` | 1/sec authoritative countdown tick |
| `student:submit-answer`| Student &rarr; Server | `{ roomCode, questionIndex, selectedOptionIndex }` | Locks answer & calculates speed score |
| `host:reveal-answer` | Host &rarr; Server | `{ roomCode }` | Manually cuts countdown to reveal answer |
| `question:reveal-answer`| Server &rarr; Room | `{ correctOptionIndex, stats }` | Reveals answer + option distribution |
| `student:answer-result`| Server &rarr; Student | `{ isCorrect, pointsEarned, totalScore, streak, currentRank }` | Private student score update |
| `leaderboard:update` | Server &rarr; Room | `{ topPlayers, totalPlayers }` | Ranked top 10 standings with diff badges |
| `host:trigger-prize-moment`| Host &rarr; Server | `{ roomCode, prizeType }` | Freezes game to award mid-quiz prize |
| `prize:announcement` | Server &rarr; Room | `{ prizeType, winner }` | Broadcasts winner spotlight + confetti |
| `quiz:end` | Server &rarr; Room | `{ podium, fullLeaderboard }` | End of quiz; renders 3D podium |

---

## 🎯 Kahoot-Style Scoring Engine

The scoring engine rewards both accuracy and speed:
- **Base Score**: 1000 points.
- **Speed Penalty**:
  $$\text{SpeedPoints} = \text{round}\left(1000 \times \left(1 - \frac{\text{responseTimeMs}}{\text{timeLimitMs} \times 2}\right)\right)$$
  - Instant answer ($\approx 0\text{s}$): $\approx 1000$ points.
  - Mid-timer answer: $\approx 750$ points.
  - Answering near 0s buzzer: $\approx 500$ points.
- **Streak Bonus**:
  $$\text{StreakBonus} = \min(500, (\text{streak} - 1) \times 100)$$
  *(Applies on consecutive correct answers $\ge 2$).*

---

## 📊 CSV Export Format

When the quiz concludes, the host can click **"Export Class Results (CSV)"** on the podium screen. The generated file includes:
- Student Rank & Name
- Final Score & Maximum Streak
- Accuracy Percentage
- Average Response Time (seconds)
- Per-question breakdown: Correct (`YES`/`NO`), Response Time, and Points Awarded.

---

## 🌐 Production Deployment Guide

### Deploying the Backend (Render / Railway / Fly.io)
1. Push this repository to GitHub.
2. Create a new Web Service on Render or Railway, pointing the root to `/server`.
3. Set Build Command: `npm install && npx prisma generate && npx prisma db push && node prisma/seed.js`.
4. Set Start Command: `node src/server.js`.
5. Set Environment Variables:
   - `PORT=4000` (or leave default assigned by host)
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-frontend.vercel.app`
   - For PostgreSQL: update `DATABASE_URL` in `.env` and change `provider = "postgresql"` in `prisma/schema.prisma`.

### Deploying the Frontend (Vercel / Netlify)
1. Point your Vercel or Netlify project to the `/client` directory.
2. Set Build Command: `npm run build`.
3. Set Output Directory: `dist`.
4. Add Environment Variable:
   - `VITE_SERVER_URL=https://your-backend-service.onrender.com`

---

## ⚖️ Horizontal Scaling Note (>500 Concurrent Users)
For large-scale deployments spanning multiple server instances:
1. Replace the in-memory `RoomManager` Map with Redis Hashes (`ioredis`).
2. Attach `@socket.io/redis-adapter` to the Socket.IO server:
   ```javascript
   import { createAdapter } from '@socket.io/redis-adapter';
   import { createClient } from 'redis';
   const pubClient = createClient({ url: process.env.REDIS_URL });
   const subClient = pubClient.duplicate();
   await Promise.all([pubClient.connect(), subClient.connect()]);
   io.adapter(createAdapter(pubClient, subClient));
   ```
3. Use Redis Pub/Sub for cross-instance timer broadcasts and prize moment triggers.
