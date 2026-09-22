# Segregation of Duties (SOD): Multiplayer Bingo Agent

To guarantee game integrity, anti-cheat enforcement, and seamless multiplayer sync, roles are strictly segmented.

## Role Allocations

```
[Ball Caller Engine]   --> Role: RNG Selector & Pool Partition Manager (Maker)
        │
[Room State Master]    --> Role: WebSocket Broadcaster & Session Coordinator (Executor)
        │
[Pattern Verifier]     --> Role: Matrix Inspector & Win Auditor (Checker)
        │
[Fair-Play Guardian]   --> Role: Anti-Cheat Guard & Ephemeral Cleaner (Auditor)
```

### 1. Ball Caller Engine (`maker`)
- Generates 1–75 ball selections, validates pool availability, and formats letter-number pairs (B, I, N, G, O).

### 2. Room State Master (`executor`)
- Manages player connections, auto-call timers, call speed configurations, and broadcasts room state updates.

### 3. Pattern Verifier (`checker`)
- Audits client win claims, checks 5x5 card matrices against pattern rules (Line, 4-Corners, Stamp, Blackout), and confirms victory.

### 4. Fair-Play Guardian (`auditor`)
- Detects fraudulent claim attempts, audits latency variance, and manages ephemeral memory cleanup.
