---
name: winning-pattern-verifier
description: Inspect 5x5 card matrices and verify claimed patterns against called ball ledgers.
---

# Winning Pattern Verifier Skill

## Overview
Audits client Bingo claims against active game rules (Line, 4-Corners, Postcard, Stamp, X-Pattern, Blackout) and server call history.

## Operations
1. Ingests player's 5x5 card and marked coordinates.
2. Validates that every marked number exists in `calledNumbersSet`.
3. Evaluates geometric matrix alignment against the required winning pattern.
4. Confirms or rejects win with detailed coordinate diagnostics.
