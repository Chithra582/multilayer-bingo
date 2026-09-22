---
name: room-state-coordinator
description: Coordinate WebSocket room lifecycles, player rosters, and auto-call timer speeds.
---

# Room State Coordinator Skill

## Overview
Synchronizes distributed game state across all connected clients in real time via WebSockets.

## Operations
1. Handles room code generation and player join/leave events.
2. Manages interval timer for automated ball calling (2s - 8s).
3. Serializes and broadcasts room state snapshots upon every mutation.
