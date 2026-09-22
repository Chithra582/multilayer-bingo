---
name: bingo-ball-caller
description: Execute random, non-repeating ball draws across standard 1-75 B-I-N-G-O partitions.
---

# Bingo Ball Caller Skill

## Overview
Manages the mechanical pool of 75 numbered balls, drawing uncalled numbers uniformly and assigning standard letter classifications.

## Operations
1. Checks remaining balls pool for availability.
2. Draws an integer uniformly from uncalled numbers.
3. Assigns letter prefix (B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75).
4. Appends to `calledBalls` ledger and updates `calledNumbersSet`.
