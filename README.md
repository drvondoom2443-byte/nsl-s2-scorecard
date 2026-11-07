# NSL S2 - Nawab Super League Season 2
### Tape-Ball Championship Scorecard & Tournament Operations Engine

A mobile-first, broadcast-grade cricket tournament scoring application built with a modern, modular architecture.

---

## 🎨 New Visual Identity: "Championship Velocity"
- **Canvas / Background**: Deep Space Obsidian (`#060A12`) with subtle cyber grid mesh.
- **Primary Brand Color**: **Cyber Emerald & Electric Mint** (`#00F5A0`, `#10B981`) for pitch vitality and high-contrast sunlight visibility.
- **Trophy & Boundary Accent**: **Solar Amber & Gold** (`#FFB800`, `#F59E0B`) for 4s, 6s, and championship milestones.
- **High-Alert Color**: **Neon Crimson** (`#FF2A6D`) for wickets, live ticker pulse, and free hits.
- **Broadcaster Typography**: Condensed **Teko** sports font for high-impact scores paired with crisp **Inter** for player statistics.

---

## 🚀 Key Improvements & Fixes Over the Previous Version

1. **Modular Architecture (No Monolith)**:
   - `index.html`: Clean, semantic HTML5 shell.
   - `css/styles.css`: Custom design tokens, glassmorphism, responsive scorecard layouts, and 3D coin toss animations.
   - `js/config.js`: Official team rosters (KTG, ASK, NKG, ALW), sequential schedule, and tournament rules.
   - `js/state.js`: LocalStorage state management with reactive Pub/Sub, SHA-256 PIN authorization, and an **instant Undo stack**.
   - `js/engine.js`: Comprehensive tape-ball cricket rules engine (wides, no-balls with free hits, strike rotation on odd runs/over ends, bowler quotas, NRR computation, and automated playoff unlocking).
   - `js/ui.js`: High-contrast, mobile-optimized component renderers.
   - `js/app.js`: Main event orchestrator, modal controllers, and confetti celebrations.

2. **Security & PIN Verification**:
   - The default Scorer PIN (`2443`) is **never stored in plaintext** in the code; it is verified client-side using `crypto.subtle` (SHA-256).
   - Spectator mode is strictly read-only, preventing accidental or unauthorized score tampering.

3. **Thumb-Friendly Ergonomic Bottom Navigation**:
   - Replaced the cramped 8-column bottom bar with **5 dedicated action zones** (*Home, Live, Fixtures, Standings, Caps*), meeting standard minimum touch target requirements for mobile devices.

4. **Scoring Undo Stack**:
   - Tape-ball games move fast! If a scorer records a 4 instead of a 1, clicking **"Undo Ball"** instantly restores the exact previous ball state, including player stats and over calculations.

5. **Realistic 3D Coin Toss**:
   - Interactive 3D coin flip physics with team initials and Heads/Tails rendering.

6. **Automated Tournament Progression & Net Run Rate (NRR)**:
   - Matches 1 to 6 represent the Group Stage.
   - As matches complete, the Points Table and NRR update in real time.
   - Match 7 (Knockout Playoff) automatically locks in 2nd vs 3rd place.
   - Match 8 (Grand Final) automatically pairs 1st place with the winner of Match 7.

---

## 📱 How to Run & Score
1. Open `index.html` in any modern web browser (Chrome, Edge, Safari, Firefox) or serve via any static file server (e.g. `npx serve .` or Live Server).
2. Tap the **Spectator** button in the top right to switch to **Scorer Mode**.
3. Enter the default PIN: `2443`.
4. Tap **Start Next Match** on the Home tab to conduct the 3D coin toss and start scoring!
