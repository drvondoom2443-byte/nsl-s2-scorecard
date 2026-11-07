/**
 * NSL S2 - State Management & Persistence Store
 * Includes Undo Snapshot Stack, SHA-256 PIN Verification, Reactive Pub/Sub
 */

import { TOURNAMENT_CONFIG, TEAMS_DATA, INITIAL_FIXTURES } from './config.js';
import { CloudSync } from './sync.js';

class TournamentStore {
  constructor() {
    this.subscribers = [];
    this.undoStack = [];
    this.maxUndoSteps = 25;
    this.state = this.getInitialState();
  }

  getInitialState() {
    return {
      version: "2.1",
      teams: JSON.parse(JSON.stringify(TEAMS_DATA)),
      fixtures: JSON.parse(JSON.stringify(INITIAL_FIXTURES)),
      playerStats: this.buildInitialPlayerStats(),
      activeMatch: null, // Holds live scoring match object
      admin: {
        isAuthenticated: false,
        pinHash: TOURNAMENT_CONFIG.defaultPinHash
      },
      firebase: {
        enabled: false,
        lastSync: null
      },
      updatedAt: Date.now()
    };
  }

  buildInitialPlayerStats() {
    const stats = {};
    Object.values(TEAMS_DATA).forEach(team => {
      team.squad.forEach(player => {
        stats[player.name] = {
          name: player.name,
          team: team.id,
          role: player.role,
          matches: 0,
          innings: 0,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          highestScore: 0,
          notOuts: 0,
          oversBowled: 0,
          legalBallsBowled: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          bestWickets: 0,
          bestRuns: 999,
          catches: 0,
          runOuts: 0
        };
      });
    });
    return stats;
  }

  async hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin.trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyPin(enteredPin) {
    if (!enteredPin) return false;
    const computedHash = await this.hashPin(enteredPin);
    const valid = computedHash === this.state.admin.pinHash;
    if (valid) {
      this.state.admin.isAuthenticated = true;
      this.notify();
    }
    return valid;
  }

  setSpectatorMode() {
    this.state.admin.isAuthenticated = false;
    this.notify();
  }

  async updateAdminPin(newPin) {
    if (!newPin || newPin.length < 4) throw new Error("PIN must be at least 4 digits");
    this.state.admin.pinHash = await this.hashPin(newPin);
    this.save();
    this.notify();
  }

  load() {
    try {
      const stored = localStorage.getItem(TOURNAMENT_CONFIG.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.state = Object.assign(this.getInitialState(), parsed);
        // Clean session auth
        this.state.admin.isAuthenticated = false;
      } else {
        this.save();
      }
    } catch (e) {
      console.warn("Storage load error, initialized fresh state:", e);
      this.state = this.getInitialState();
    }
    this.notify();
  }

  save(syncToCloud = true) {
    try {
      this.state.updatedAt = Date.now();
      localStorage.setItem(TOURNAMENT_CONFIG.storageKey, JSON.stringify(this.state));
      if (syncToCloud && this.state.admin.isAuthenticated) {
        CloudSync.pushState(this.state);
      }
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
    }
  }

  // Push snapshot before scoring state change for seamless Undo
  recordUndoSnapshot() {
    if (!this.state.activeMatch) return;
    const snapshot = JSON.stringify({
      activeMatch: this.state.activeMatch,
      playerStats: this.state.playerStats
    });
    this.undoStack.push(snapshot);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
  }

  undoLastBall() {
    if (this.undoStack.length === 0) return false;
    const lastSnapshot = this.undoStack.pop();
    const restored = JSON.parse(lastSnapshot);
    this.state.activeMatch = restored.activeMatch;
    this.state.playerStats = restored.playerStats;
    this.save();
    this.notify();
    return true;
  }

  resetAllData() {
    this.state = this.getInitialState();
    this.undoStack = [];
    this.save();
    this.notify();
  }

  exportDataJson() {
    return JSON.stringify(this.state, null, 2);
  }

  importDataJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.fixtures || !parsed.teams) {
        throw new Error("Invalid NSL tournament JSON schema.");
      }
      this.state = parsed;
      this.state.admin.isAuthenticated = false;
      this.save();
      this.notify();
      return true;
    } catch (err) {
      throw new Error("Import failed: " + err.message);
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.state);
      } catch (err) {
        console.error("State subscriber listener error:", err);
      }
    });
  }
}

export const Store = new TournamentStore();
