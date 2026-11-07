/**
 * NSL S2 - Firebase Real-time Cloud Sync Module
 * Enables live match broadcasting across multiple devices for spectators & scorers
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { Store } from './state.js';

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCBsKqu-4WWbKo-qN7lRo5-nak-anFwiC8",
  authDomain: "nsl-s2.firebaseapp.com",
  projectId: "nsl-s2",
  storageBucket: "nsl-s2.firebasestorage.app",
  messagingSenderId: "751866095822",
  appId: "1:751866095822:web:4fab1aeb6dc0419800089f"
};

class CloudSyncService {
  constructor() {
    this.db = null;
    this.unsubscribe = null;
    this.isOnline = false;
    this.docPath = { collection: "nsl_tournament", doc: "s2_state" };
  }

  init() {
    try {
      const app = initializeApp(FIREBASE_CONFIG);
      this.db = getFirestore(app);
      this.isOnline = true;
      this.updateStatusBadge(true, "Cloud Live");
      this.listenToRemoteUpdates();
    } catch (err) {
      console.warn("Firebase sync init error (running in local mode):", err);
      this.isOnline = false;
      this.updateStatusBadge(false, "Local Only");
    }
  }

  // Real-time listener: Spectators instantly receive live balls & score updates
  listenToRemoteUpdates() {
    if (!this.db) return;
    try {
      const docRef = doc(this.db, this.docPath.collection, this.docPath.doc);
      if (this.unsubscribe) this.unsubscribe();

      this.unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = snapshot.data();
          // Update local state if remote is newer and this client isn't actively scoring
          const localUpdatedAt = Store.state.updatedAt || 0;
          if (remoteData.updatedAt && remoteData.updatedAt > localUpdatedAt) {
            // Keep local admin session auth intact
            const wasAdmin = Store.state.admin.isAuthenticated;
            Store.state = Object.assign(Store.state, remoteData);
            Store.state.admin.isAuthenticated = wasAdmin;
            Store.save();
            Store.notify();
          }
        }
      }, (error) => {
        console.warn("Firestore snapshot listener notice:", error);
        this.updateStatusBadge(false, "Offline");
      });
    } catch (e) {
      console.warn("Snapshot setup failed:", e);
      this.updateStatusBadge(false, "Local Mode");
    }
  }

  // Scorer pushes live ball/match update to Cloud
  async pushState(state) {
    if (!this.db || !this.isOnline) return;
    try {
      const docRef = doc(this.db, this.docPath.collection, this.docPath.doc);
      // Clean non-serializable objects
      const sanitized = JSON.parse(JSON.stringify(state));
      await setDoc(docRef, sanitized);
      this.updateStatusBadge(true, "Cloud Live");
    } catch (err) {
      console.warn("Firestore cloud write error:", err);
      this.updateStatusBadge(false, "Sync Error");
    }
  }

  updateStatusBadge(online, text) {
    const dot = document.getElementById('syncDot');
    const label = document.getElementById('syncText');
    if (dot && label) {
      if (online) {
        dot.className = "w-2 h-2 rounded-full bg-emerald-400 animate-pulse";
        label.innerText = text || "Cloud Live";
      } else {
        dot.className = "w-2 h-2 rounded-full bg-slate-500";
        label.innerText = text || "Local Only";
      }
    }
  }
}

export const CloudSync = new CloudSyncService();
