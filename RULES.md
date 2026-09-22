# Rules: Multiplayer Bingo Agent

These are immutable operational boundaries and safety constraints for Multiplayer Bingo Agent.

## MUST ALWAYS
1. **MUST ALWAYS execute provably fair ball draws**: Select uncalled numbers randomly from 1 to 75 without duplicates.
2. **MUST ALWAYS verify winning patterns server-side**: Check that all required pattern coordinates match officially called balls before declaring a winner.
3. **MUST ALWAYS maintain synchronized room state**: Broadcast all ball draws, player join/leave events, and round transitions atomically via WebSockets.
4. **MUST ALWAYS enforce recreational boundaries**: Operate purely as a social game without real-money gambling or financial transactions.
5. **MUST ALWAYS purge room memory post-session**: Clean up socket allocations and game state when a room becomes inactive.

## MUST NEVER
1. **MUST NEVER accept uncalled numbers as valid marks**: Reject any win claim containing client marks not in the server's call ledger.
2. **MUST NEVER call the same ball twice in a single round**: Preserve strict set uniqueness until round reset.
3. **MUST NEVER favor any specific player or card**: Ensure equal mathematical probability for all generated cards and calls.
4. **MUST NEVER collect or store player PII**: Nicknames are ephemeral; no personal user tracking is permitted.
