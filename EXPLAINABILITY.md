# EXPLAINABILITY — Multiplayer Bingo Agent

> **Admissibility & Transparency Report for OpenGAP / Agent Passport**  
> *Agent Name:* Multiplayer Bingo Agent (`multiplayer-bingo-agent`)  
> *Specification:* OpenGAP v0.1.0  
> *Domain:* Developer tools / Real-Time Multiplayer Gaming & Distributed State Systems  

---

## 1. Overview & Operational Purpose

Multiplayer Bingo Agent is an autonomous game master intelligence and real-time state coordinator built for multiplayer browser-based Bingo. The underlying system utilizes Node.js, Express, WebSocket (`ws`), and React/TypeScript to synchronize concurrent player rooms, stream live ball calls, and validate complex card patterns.

The agent's primary purpose is to eliminate human referee overhead and cheating risks in digital gaming. By executing server-side ball generation, validating client marks against immutable call logs, and computing remaining-to-win distance metrics, the agent guarantees fair play, zero-latency state sync, and high-energy live commentary via Google Gemini (`gemini-2.0-flash`).

---

## 2. How the Agent Decides (Decision-Making Logic)

Multiplayer Bingo Agent operates through a deterministic four-stage gaming pipeline:

```
[Host Config & Room Init] ──> [Cryptographic Ball Selection] ──> [Atomic WebSocket Broadcast]
                                                                             │
                                                                             ▼
[Winner Celebration & Room Reset] <── [Deterministic Pattern Audit] <── [Client Win Claim Ingestion]
```

### 2.1 Ball Calling & Random Number Selection
- **Decision:** Selects the next active ball from the uncalled pool (numbers 1 to 75).
- **Rules:**
  - Standard partition: **B** (1–15), **I** (16–30), **N** (31–45), **G** (46–60), **O** (61–75).
  - Maintains `calledNumbersSet` and a dynamic remaining pool.
  - Generates selections using uniform random distribution, guaranteeing zero repeated calls within a single round.

### 2.2 5x5 Card Matrix Generation
- **Decision:** Constructs distinct, balanced 5x5 Bingo cards for joining players.
- **Rules:**
  - Col 0 (B): 5 unique random integers from [1..15].
  - Col 1 (I): 5 unique random integers from [16..30].
  - Col 2 (N): 4 unique random integers from [31..45], with center cell (2,2) designated as permanent `FREE`.
  - Col 3 (G): 5 unique random integers from [46..60].
  - Col 4 (O): 5 unique random integers from [61..75].

### 2.3 Winning Pattern Verification & Anti-Cheat Engine
- **Decision:** Evaluates incoming `claim_bingo` WebSocket payloads against the server's authoritative call ledger.
- **Pattern Definitions:**
  - **Standard Line**: Any complete horizontal row (5), vertical column (5), or diagonal (2).
  - **Four Corners**: (0,0), (0,4), (4,0), (4,4).
  - **Postcard**: Any 2x2 cluster of 4 marked cells.
  - **Stamp**: 2x2 square in any of the four outer corners.
  - **X-Pattern**: Both main diagonals intersecting through center FREE.
  - **Blackout / Full House**: All 25 cells marked.
- **Verification Gate:**
  - Checks that every marked coordinate corresponds to a ball present in `calledNumbersSet`.
  - Rejects premature or manipulated client marks and logs the invalid attempt.

### 2.4 Live Commentary & Proximity Tracking
- **Decision:** Calculates remaining marks needed for each player to win and synthesizes contextual announcements.
- **Rules:**
  - Identifies players who are "Waiting on 1" and triggers tension-building commentary.
  - Upon verified win, halts auto-calling timer and broadcasts winner fanfare to all room participants.

---

## 3. Data Sources & Inputs Used

| Data Input | Source | Purpose | Data Handling & Privacy |
|---|---|---|---|
| **Room Configuration** | Host player selection (winning pattern, call speed, auto-call toggle) | Parameterizes round mechanics and ball interval timer | Stored in volatile server memory; discarded on room closure |
| **Player Session State** | WebSocket connection (player name, avatar ID, assigned card matrix) | Room roster and individual card verification | In-memory only; unique socket IDs mapped ephemerally |
| **Called Ball Ledger** | Server-side RNG pool | Canonical historical record of drawn numbers in current round | Maintained in memory array and Set; reset between rounds |
| **Client Win Claims** | Client WebSocket packet (`claim_bingo`) | Triggers server-side pattern verification against called balls | Evaluated synchronously in memory |

Multiplayer Bingo Agent complies with privacy-by-design standards:
- **No PII Required:** Players join using nicknames and optional avatars; no real names, emails, or phone numbers are requested.
- **Zero Data Mining:** Chat reactions, game durations, and win histories are not stored in persistent databases or used for model training.
- **Stateless Room Lifecycle:** Rooms inactive for 60 minutes are automatically garbage collected.

---

## 4. Known Limitations & Failure Modes

Reviewers and players should note the following system boundaries:

1. **Client Network Latency & Disconnects:**
   - *Limitation:* Players on high-latency mobile networks may receive ball broadcasts milliseconds behind other participants.
   - *Mitigation:* The server ledger timestamp governs win claim evaluation; if two players claim simultaneously, the first packet reaching the server is awarded primary victory, with dual-winner recognition if timestamps match.

2. **Accidental Premature Win Claims:**
   - *Limitation:* A player may mistakenly shout/claim Bingo when one mark is missing or uncalled.
   - *Mitigation:* The server silently rejects invalid claims, notifies the claimant with the specific missing coordinates, and keeps the round active without disrupting other players.

3. **Browser Timer Throttling:**
   - *Limitation:* Background browser tabs may throttle JavaScript intervals, causing visual animations to lag.
   - *Mitigation:* The authoritative auto-call timer runs exclusively on the Node.js backend; when the client tab refocuses, the full room state is re-synchronized immediately.

4. **Non-Gambling Scope:**
   - *Limitation:* The agent does not support real-money wagering, payout processing, or currency conversion.
   - *Mitigation:* Enforces recreational and educational gameplay strictly with zero monetary transaction hooks.

---

## 5. Verification, Safety & Human Oversight

- **Server-Side Authoritative Architecture:** Clients cannot forge balls or alter card marks; only the server generates numbers and validates victory.
- **Host Room Controls:** Room creators have full authority to pause auto-calling, adjust speed (2s to 8s), change winning patterns, and reset rounds.
- **Structured Audit Logging:** Every ball draw, player join/leave, and win verification is logged in structured format for dispute resolution.
- **Kill Switch:** Game rooms and WebSocket listeners can be terminated cleanly on command.
