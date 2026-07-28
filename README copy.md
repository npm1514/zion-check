# 🃏 Zion's Check

A family multiplayer card game built on **Next.js + TypeScript + Supabase Realtime**.
Based on Shanghai Rummy with custom rules.

---

## Setup

### 1. Supabase

1. Go to your Supabase project → **SQL Editor**
2. Paste and run the contents of `supabase/migrations/001_zions_check.sql`
3. This creates the `rooms` table and enables Realtime on it

### 2. Environment variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install `nanoid`

```bash
npm install nanoid
```

### 4. Drop in the files

Copy the folders from this package into your existing project:

```
src/types/game.ts
src/lib/game/deck.ts
src/lib/game/contracts.ts
src/lib/game/meldValidator.ts
src/lib/game/gameEngine.ts
src/lib/supabase/gameService.ts
src/hooks/useGame.ts
src/components/zions-check/   (all components)
src/app/game/page.tsx
src/app/game/[code]/page.tsx
```

> **Alias:** The code uses `@/` path aliases (e.g. `@/types/game`).
> Make sure your `tsconfig.json` has `"paths": { "@/*": ["./src/*"] }`.

### 5. Run

```bash
npm run dev
```

Navigate to `/game` to create or join a room.

---

## How to play

1. **Create** a game at `/game` — you'll get a 4-letter room code
2. **Share the code** with family — they go to `/game`, enter the code, and click Join
3. **Host clicks "Start Game"** once everyone has joined (2–8 players)
4. Each player takes turns on their own device from anywhere in the US

---

## Game Rules — Zion's Check

### Dealing
| Round | Cards Dealt |
|-------|-------------|
| 1 | 6 |
| 2 | 7 |
| 3 | 8 |
| 4 | 9 |
| 5 | 10 |
| 6 | 11 |
| 7 | 12 |
| 8 | 13 |
| 9 | 14 |
| 10 | 15 |

### Round contracts (standard Shanghai Rummy)
| Round | Contract |
|-------|----------|
| 1 | 2 Sets of 3 |
| 2 | 1 Set of 3 + 1 Run of 4 |
| 3 | 2 Runs of 4 |
| 4 | 3 Sets of 3 |
| 5 | 2 Sets of 3 + 1 Run of 4 |
| 6 | 1 Set of 3 + 2 Runs of 4 |
| 7 | 3 Runs of 4 |
| 8 | 3 Sets of 3 + 1 Run of 4 |
| 9 | 2 Sets of 3 + 2 Runs of 4 |
| 10 | 3 Runs of 4 |

### Buying
- On another player's turn, you can **buy** the top discard card
- You receive the discard card **plus one penalty card** from the deck
- The active player then draws from the deck as normal
- **Round 10:** each player may only buy **once**

### Scoring (cards left in hand)
| Cards | Points |
|-------|--------|
| 2 – 9 | 5 pts each |
| 10, J, Q, K | 10 pts each |
| Ace | 15 pts |
| Joker | 50 pts |

Lowest total score after 10 rounds **wins**.

### Special rules
- **Cannot discard a Joker**
- **Cannot discard a card that can replace a Joker** on the table
  *(if a Joker in a laid meld is substituting for a specific card you hold, you must use it to replace the Joker instead of discarding)*

---

## File overview

```
src/
  types/game.ts           — All TypeScript types
  lib/
    game/
      deck.ts             — Deck creation & shuffling
      contracts.ts        — Per-round objectives
      meldValidator.ts    — Set/run validation, joker rules
      gameEngine.ts       — Pure state reducer (draw, buy, meld, discard)
    supabase/
      gameService.ts      — Supabase CRUD + realtime
  hooks/
    useGame.ts            — React hook (join room, realtime sync, actions)
  components/
    zions-check/
      CardTile.tsx        — Single card visual
      Hand.tsx            — Player's hand + contract/discard UI
      MeldDisplay.tsx     — Meld group on the table
      BuyPanel.tsx        — Buy-window countdown + buy button
      Scoreboard.tsx      — Live per-round scores
      Lobby.tsx           — Pre-game waiting room
      GameTable.tsx       — Main game layout
  app/
    game/
      page.tsx            — Create or join a game
      [code]/page.tsx     — Live game room
supabase/
  migrations/
    001_zions_check.sql   — Database schema
```
