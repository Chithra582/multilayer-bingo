# Multiplayer Bingo — AI Game Master & Real-Time Referee

![HiDevs GitAgent Passport](https://img.shields.io/badge/HiDevs-GitAgent%20Passport-blueviolet?style=flat-square)
![OpenGAP](https://img.shields.io/badge/OpenGAP-v0.1.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Agent](https://img.shields.io/badge/agent-multiplayer--bingo--agent-orange?style=flat-square)

An autonomous **AI Game Master and Real-Time Referee Agent** for multiplayer Bingo built with Node.js, Express, WebSockets (`ws`), React, TypeScript, and Vite.

Features live synchronized ball calling, provably fair 1–75 draws, automatic card generation, multi-pattern win verification (Line, 4-Corners, Postcard, Stamp, X-Pattern, Blackout), anti-cheat validation, and AI game commentary.

---

## Key Capabilities

| Capability | Purpose |
|---|---|
| **Provably Fair Ball Calling** | Cryptographic random selection across 1–75 B-I-N-G-O partitions with zero duplicates. |
| **Winning Pattern Verification** | Inspects 5x5 card matrices and verifies all marked coordinates against the server's call ledger. |
| **Room State Coordination** | Synchronizes real-time room states, player rosters, and auto-call timers (2s–8s) over WebSockets. |
| **Game Commentary & Proximity** | Calculates '1 to go' near-win proximity and synthesizes live commentary. |

---

## Tech Stack

- **AI Model**: Google Gemini (`gemini-2.0-flash`) via `@google/genai`
- **Real-Time Engine**: WebSockets (`ws`) with room code multiplexing
- **Backend**: Node.js & Express (`server.ts`)
- **Frontend**: React, TypeScript, Vite, Lucide Icons, Canvas-Confetti
- **Protocol**: OpenGAP Specification v0.1.0

---

## Repository Structure

```text
multilayer-bingo/
├── agent.yaml                 # OpenGAP spec 0.1.0 root definition
├── SOUL.md                    # Core persona, provable fairness, and referee philosophy
├── EXPLAINABILITY.md          # 5-section transparency report satisfying Checkpoint 2
├── RULES.md                   # Immutable boundaries (MUST ALWAYS / MUST NEVER)
├── DUTIES.md                  # Segregation of duties (Maker, Executor, Checker, Auditor)
├── README.md                  # Detailed documentation with GitAgent Passport badges
├── package.json               # Full-stack dependencies
├── server.ts                  # Express backend, WebSocket server & game loop
├── src/                       # React frontend source code & Bingo utility functions
├── skills/
│   ├── bingo-ball-caller/SKILL.md
│   ├── winning-pattern-verifier/SKILL.md
│   ├── room-state-coordinator/SKILL.md
│   └── game-commentary-engine/SKILL.md
└── tools/
    ├── ball-dispenser.yaml
    ├── pattern-checker.yaml
    ├── room-coordinator.yaml
    └── commentary-generator.yaml
```

---

## Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure API Key**:
   Copy `.env.example` to `.env` and set your `GEMINI_API_KEY`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. **Start Game Server**:
   ```bash
   npm run dev
   ```

---

## HiDevs GitAgent Passport Submission

- **Portal**: [HiDevs GitAgent Passport](https://app.hidevs.xyz/passport/submit)
- **Repository**: `Chithra582/multilayer-bingo`
- **Category**: **Developer tools**
