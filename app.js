/**
 * NSL S2 - Main Application Controller & Event Coordinator
 */

import { TOURNAMENT_CONFIG } from './config.js';
import { Store } from './state.js';
import { CricketEngine } from './engine.js';
import { UIRenderer } from './ui.js';
import { CloudSync } from './sync.js';

class ApplicationController {
  constructor() {
    this.currentView = 'home';
    this.tossState = {
      fixtureId: null,
      tossWinner: null,
      decision: 'BAT',
      isFlipping: false
    };
  }

  init() {
    Store.load();
    Store.subscribe(() => this.render());

    // Initialize Firebase Live Cloud Sync
    CloudSync.init();

    // Navigation and initial view
    this.navigate('home');
    this.updateHeaderAndTicker();
  }

  navigate(viewName) {
    this.currentView = viewName;
    this.render();
    this.updateBottomNavUI(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render() {
    const container = document.getElementById('appContent');
    if (!container) return;

    switch (this.currentView) {
      case 'home':
        container.innerHTML = UIRenderer.renderHome();
        break;
      case 'live':
        container.innerHTML = UIRenderer.renderLiveScorer();
        break;
      case 'fixtures':
        container.innerHTML = UIRenderer.renderFixtures();
        break;
      case 'standings':
        container.innerHTML = UIRenderer.renderStandings();
        break;
      case 'awards':
        container.innerHTML = UIRenderer.renderAwards();
        break;
      case 'teams':
        container.innerHTML = UIRenderer.renderTeams();
        break;
      case 'settings':
        container.innerHTML = UIRenderer.renderSettings();
        break;
      default:
        container.innerHTML = UIRenderer.renderHome();
    }

    this.updateHeaderAndTicker();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  updateHeaderAndTicker() {
    const activeMatch = Store.state.activeMatch;
    const ticker = document.getElementById('globalLiveTicker');
    const tickerScore = document.getElementById('tickerScoreSummary');
    const tickerTitle = document.getElementById('tickerMatchTitle');

    if (ticker && tickerScore && tickerTitle) {
      if (activeMatch && !activeMatch.isComplete) {
        const inn = CricketEngine.getActiveInnings();
        ticker.classList.remove('hidden');
        tickerTitle.innerText = `MATCH #${activeMatch.matchNumber}: ${inn.battingTeam} VS ${inn.bowlingTeam}`;
        tickerScore.innerText = `${inn.totalRuns}/${inn.wickets} (${CricketEngine.ballsToOvers(inn.legalBalls)} ov)`;
      } else {
        ticker.classList.add('hidden');
      }
    }

    // Scorer / Spectator Badge in header
    const adminBtn = document.getElementById('adminToggleBtn');
    const adminText = document.getElementById('adminModeText');
    const isAdmin = Store.state.admin.isAuthenticated;

    if (adminBtn && adminText) {
      if (isAdmin) {
        adminBtn.className = "flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
        adminText.innerText = "Scorer";
      } else {
        adminBtn.className = "flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all bg-slate-800 border-slate-700 text-slate-400";
        adminText.innerText = "Spectator";
      }
    }
  }

  updateBottomNavUI(activeView) {
    const navItems = ['home', 'live', 'fixtures', 'standings', 'awards', 'teams', 'settings'];
    navItems.forEach(item => {
      const el = document.getElementById(`nav-${item}`);
      if (el) {
        if (item === activeView) {
          el.className = "flex flex-col items-center justify-center py-1.5 rounded-xl text-emerald-400 font-bold transition-all bg-emerald-500/10";
        } else {
          el.className = "flex flex-col items-center justify-center py-1.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all";
        }
      }
    });

    // Dot on Live nav button if match is running
    const dot = document.getElementById('navLiveDot');
    if (dot) {
      if (Store.state.activeMatch && !Store.state.activeMatch.isComplete) {
        dot.classList.remove('hidden');
      } else {
        dot.classList.add('hidden');
      }
    }
  }

  /* -------------------------------------------------------------
   * SCORING ACTIONS
   * ------------------------------------------------------------- */
  recordRun(runs) {
    if (!Store.state.admin.isAuthenticated) {
      this.showToast("Spectator Mode: Unlock Scorer Mode to score.", "error");
      return;
    }
    CricketEngine.processBall({ type: 'RUNS', runs });
    if (runs === 4) {
      this.showToast("🔥 FOUR! 4 Runs!", "success");
    } else if (runs === 6) {
      this.showToast("🚀 SIX! MAXIMUM 6 RUNS!", "success");
      this.fireConfetti();
    }
  }

  recordWide() {
    if (!Store.state.admin.isAuthenticated) return;
    CricketEngine.processBall({ type: 'WIDE', additionalRuns: 0 });
    this.showToast("Wide Ball (+1 run)", "info");
  }

  recordNoBall() {
    if (!Store.state.admin.isAuthenticated) return;
    CricketEngine.processBall({ type: 'NO_BALL', batRuns: 0 });
    this.showToast("No Ball (+1 run) - FREE HIT NEXT!", "warning");
  }

  recordByePrompt() {
    if (!Store.state.admin.isAuthenticated) return;
    const runs = prompt("Enter Bye/Leg-Bye runs taken:", "1");
    if (runs !== null) {
      const parsed = parseInt(runs, 10) || 1;
      CricketEngine.processBall({ type: 'BYE', runs: parsed });
      this.showToast(`Bye recorded (+${parsed} runs)`, "info");
    }
  }

  undoLastBall() {
    if (!Store.state.admin.isAuthenticated) return;
    const success = Store.undoLastBall();
    if (success) {
      this.showToast("Last ball undone successfully ↩️", "info");
    } else {
      this.showToast("Nothing to undo", "warning");
    }
  }

  rotateStrikeManual() {
    if (!Store.state.admin.isAuthenticated) return;
    const inn = CricketEngine.getActiveInnings();
    if (!inn) return;
    Store.recordUndoSnapshot();
    const temp = inn.striker;
    inn.striker = inn.nonStriker;
    inn.nonStriker = temp;
    Store.save();
    Store.notify();
    this.showToast(`Strike swapped: ${inn.striker} is now on strike`, "info");
  }

  /* -------------------------------------------------------------
   * MODALS & DIALOGS
   * ------------------------------------------------------------- */
  openModal(htmlContent) {
    const container = document.getElementById('modalContainer');
    if (!container) return;
    container.innerHTML = htmlContent;
    container.classList.remove('hidden');
    container.classList.add('flex');
    if (window.lucide) window.lucide.createIcons();
  }

  closeModal() {
    const container = document.getElementById('modalContainer');
    if (!container) return;
    container.classList.add('hidden');
    container.classList.remove('flex');
    container.innerHTML = '';
  }

  // Wicket Dialog
  openWicketModal() {
    if (!Store.state.admin.isAuthenticated) return;
    const inn = CricketEngine.getActiveInnings();
    if (!inn) return;

    const availableBatters = Object.values(inn.batsmen).filter(b => b.status === 'dnb');
    const fielders = Store.state.teams[inn.bowlingTeam].squad;

    const modalHtml = `
      <div class="glass-panel-elevated p-5 max-w-sm w-full space-y-4 border border-rose-500/40">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 class="text-lg font-display font-black text-rose-400 tracking-wide">RECORD DISMISSAL / WICKET</h3>
          <button onclick="window.App.closeModal()" class="text-slate-400 hover:text-white">&times;</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Batter Dismissed:</label>
            <select id="wicketOutPlayer" class="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium">
              <option value="${inn.striker}">${inn.striker} (Striker)</option>
              <option value="${inn.nonStriker}">${inn.nonStriker} (Non-Striker)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Dismissal Type:</label>
            <select id="wicketTypeSelect" onchange="window.App.handleWicketTypeChange(this.value)" class="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium">
              <option value="BOWLED">Bowled</option>
              <option value="CAUGHT">Caught</option>
              <option value="RUN_OUT">Run Out</option>
              <option value="STUMPED">Stumped</option>
              <option value="LBW">LBW</option>
              <option value="HIT_WICKET">Hit Wicket</option>
            </select>
          </div>

          <div id="fielderSelectionContainer" class="hidden">
            <label class="block font-bold text-slate-300 mb-1">Fielder Involved:</label>
            <select id="wicketFielderSelect" class="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium">
              <option value="">None / Unassisted</option>
              ${fielders.map(f => `<option value="${f.name}">${f.name}</option>`).join('')}
            </select>
          </div>

          ${availableBatters.length > 0 ? `
            <div>
              <label class="block font-bold text-slate-300 mb-1">Next Batter In:</label>
              <select id="wicketNewBatter" class="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium">
                ${availableBatters.map(b => `<option value="${b.name}">${b.name} (${b.role || 'Batter'})</option>`).join('')}
              </select>
            </div>
          ` : `
            <p class="text-rose-400 font-bold">All Out! Last wicket fallen.</p>
          `}
        </div>

        <div class="flex gap-2 pt-2 border-t border-slate-800">
          <button onclick="window.App.closeModal()" class="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
            Cancel
          </button>
          <button onclick="window.App.confirmWicket()" class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider">
            Confirm Out
          </button>
        </div>
      </div>
    `;

    this.openModal(modalHtml);
  }

  handleWicketTypeChange(val) {
    const container = document.getElementById('fielderSelectionContainer');
    if (container) {
      if (val === 'CAUGHT' || val === 'RUN_OUT' || val === 'STUMPED') {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
      }
    }
  }

  confirmWicket() {
    const outPlayer = document.getElementById('wicketOutPlayer')?.value;
    const wicketType = document.getElementById('wicketTypeSelect')?.value;
    const fielder = document.getElementById('wicketFielderSelect')?.value || null;
    const newBatter = document.getElementById('wicketNewBatter')?.value || null;

    CricketEngine.processBall({
      type: 'WICKET',
      outPlayer,
      wicketType,
      fielder,
      newBatter
    });

    this.closeModal();
    this.showToast(`WICKET! ${outPlayer} is OUT!`, "error");
  }

  // Bowler Selection Dialog
  openBowlerModal() {
    const inn = CricketEngine.getActiveInnings();
    if (!inn) return;

    const maxBalls = (Store.state.activeMatch.maxOverPerBowler || 2) * 6;
    const allBowlers = Object.values(inn.bowlers);

    const modalHtml = `
      <div class="glass-panel-elevated p-5 max-w-sm w-full space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 class="text-base font-display font-bold text-white tracking-wide">SELECT NEXT BOWLER</h3>
          <button onclick="window.App.closeModal()" class="text-slate-400 hover:text-white">&times;</button>
        </div>

        <p class="text-xs text-slate-400">Tape-ball quota: Max ${Store.state.activeMatch.maxOverPerBowler} overs per bowler. Cannot bowl back-to-back overs.</p>

        <div class="space-y-2 max-h-60 overflow-y-auto">
          ${allBowlers.map(b => {
            const isLast = b.name === inn.lastBowler;
            const isExhausted = b.legalBalls >= maxBalls;
            const isCurrent = b.name === inn.currentBowler;
            const disabled = isLast || isExhausted;

            return `
              <button 
                onclick="window.App.setBowler('${b.name}')" 
                ${disabled ? 'disabled' : ''} 
                class="w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors ${
                  isCurrent ? 'bg-emerald-500/20 border-emerald-500 text-white' : 
                  disabled ? 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed' : 
                  'bg-slate-900 border-slate-700 hover:border-slate-500 text-white'
                }">
                <div>
                  <span class="text-xs font-bold">${b.name}</span>
                  ${isLast ? '<span class="text-[9px] text-amber-500 ml-1 font-bold">(Last Bowler)</span>' : ''}
                  ${isExhausted ? '<span class="text-[9px] text-rose-500 ml-1 font-bold">(Quota Finished)</span>' : ''}
                </div>
                <span class="text-xs font-mono text-slate-400">
                  ${CricketEngine.ballsToOvers(b.legalBalls)} ov &bull; ${b.wickets} wkt &bull; ${b.runsConceded} r
                </span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.openModal(modalHtml);
  }

  setBowler(bowlerName) {
    const inn = CricketEngine.getActiveInnings();
    if (!inn) return;
    inn.currentBowler = bowlerName;
    Store.save();
    Store.notify();
    this.closeModal();
    this.showToast(`Bowler set: ${bowlerName}`, "info");
  }

  // 3D Coin Toss Modal
  openTossModal(fixtureId) {
    const fixture = Store.state.fixtures.find(f => f.id === fixtureId);
    if (!fixture || !fixture.teamA || !fixture.teamB) {
      this.showToast("Fixture teams not yet set.", "error");
      return;
    }

    this.tossState = {
      fixtureId,
      tossWinner: fixture.teamA,
      decision: 'BAT',
      isFlipping: false
    };

    const teamA = Store.state.teams[fixture.teamA];
    const teamB = Store.state.teams[fixture.teamB];

    const modalHtml = `
      <div class="glass-panel-elevated p-5 max-w-sm w-full space-y-4 text-center">
        <h3 class="text-xl font-display font-black text-amber-400 tracking-wide">OFFICIAL MATCH COIN TOSS</h3>
        <p class="text-xs text-slate-400">Match #${fixture.matchNumber}: ${teamA.shortName} vs ${teamB.shortName}</p>

        <!-- 3D Coin Display -->
        <div class="coin-perspective my-6 flex justify-center">
          <div id="coinElement" class="coin-3d" onclick="window.App.flipCoin('${fixture.teamA}', '${fixture.teamB}')">
            <div class="coin-face coin-front">
              <span class="text-2xl font-black">${teamA.shortName}</span>
              <span class="text-[10px] uppercase font-bold tracking-wider mt-1">HEADS</span>
            </div>
            <div class="coin-face coin-back">
              <span class="text-2xl font-black">${teamB.shortName}</span>
              <span class="text-[10px] uppercase font-bold tracking-wider mt-1">TAILS</span>
            </div>
          </div>
        </div>

        <button id="flipBtn" onclick="window.App.flipCoin('${fixture.teamA}', '${fixture.teamB}')" class="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20">
          🪙 Flip The Coin
        </button>

        <div id="tossResultSection" class="space-y-3 pt-3 border-t border-slate-800 text-left">
          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Toss Winner Team:</label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" id="tossWinA" onclick="window.App.selectTossWinner('${fixture.teamA}')" class="py-2 rounded-xl border text-xs font-bold bg-emerald-500/20 border-emerald-500 text-emerald-300">
                ${teamA.shortName}
              </button>
              <button type="button" id="tossWinB" onclick="window.App.selectTossWinner('${fixture.teamB}')" class="py-2 rounded-xl border text-xs font-bold bg-slate-900 border-slate-700 text-slate-400">
                ${teamB.shortName}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 mb-1">Elected to:</label>
            <div class="grid grid-cols-2 gap-2">
              <button type="button" id="tossDecBat" onclick="window.App.selectTossDecision('BAT')" class="py-2 rounded-xl border text-xs font-bold bg-emerald-500/20 border-emerald-500 text-emerald-300">
                🏏 BAT FIRST
              </button>
              <button type="button" id="tossDecBowl" onclick="window.App.selectTossDecision('BOWL')" class="py-2 rounded-xl border text-xs font-bold bg-slate-900 border-slate-700 text-slate-400">
                🎯 BOWL FIRST
              </button>
            </div>
          </div>

          <button onclick="window.App.startMatchFromToss()" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30">
            Confirm & Start Match 🚀
          </button>
        </div>
      </div>
    `;

    this.openModal(modalHtml);
  }

  flipCoin(teamA, teamB) {
    if (this.tossState.isFlipping) return;
    this.tossState.isFlipping = true;

    const coin = document.getElementById('coinElement');
    const isTeamA = Math.random() < 0.5;
    const spins = 5 + Math.floor(Math.random() * 3);
    const finalAngle = (spins * 360) + (isTeamA ? 0 : 180);

    if (coin) {
      coin.style.transform = `rotateY(${finalAngle}deg)`;
    }

    setTimeout(() => {
      this.tossState.isFlipping = false;
      const winner = isTeamA ? teamA : teamB;
      this.selectTossWinner(winner);
      this.showToast(`Coin landed on ${winner}!`, "success");
    }, 3500);
  }

  selectTossWinner(teamId) {
    this.tossState.tossWinner = teamId;
    const btnA = document.getElementById('tossWinA');
    const btnB = document.getElementById('tossWinB');
    const fix = Store.state.fixtures.find(f => f.id === this.tossState.fixtureId);
    if (btnA && btnB && fix) {
      if (teamId === fix.teamA) {
        btnA.className = "py-2 rounded-xl border text-xs font-bold bg-emerald-500/20 border-emerald-500 text-emerald-300";
        btnB.className = "py-2 rounded-xl border text-xs font-bold bg-slate-900 border-slate-700 text-slate-400";
      } else {
        btnB.className = "py-2 rounded-xl border text-xs font-bold bg-emerald-500/20 border-emerald-500 text-emerald-300";
        btnA.className = "py-2 rounded-xl border text-xs font-bold bg-slate-900 border-slate-700 text-slate-400";
      }
    }
  }

  selectTossDecision(decision) {
    this.tossState.decision = decision;
    const btnBat = document.getElementById('tossDecBat');
    const btnBowl = document.getElementById('tossDecBowl');
    if (btnBat && btnBowl) {
      if (decision === 'BAT') {
        btnBat.className = "py-2 rounded-xl border text-xs font-bold bg-emerald-500/20 border-emerald-500 text-emerald-300";
        btnBowl.className = "py-2 rounded-xl border text-xs font-bold bg-slate-900 border-slate-700 text-slate-400";
      } else {
        btnBowl.className = "py-2 rounded-xl border text-xs font-bold bg-emerald-500/20 border-emerald-500 text-emerald-300";
        btnBat.className = "py-2 rounded-xl border text-xs font-bold bg-slate-900 border-slate-700 text-slate-400";
      }
    }
  }

  startMatchFromToss() {
    try {
      CricketEngine.initializeMatch(
        this.tossState.fixtureId,
        this.tossState.tossWinner,
        this.tossState.decision,
        TOURNAMENT_CONFIG.defaultOvers
      );
      this.closeModal();
      this.navigate('live');
      this.showToast("Match has commenced! Live scoring enabled.", "success");
    } catch (e) {
      this.showToast(e.message, "error");
    }
  }

  // Completed Match Scorecard Modal
  openScorecardModal(fixtureId) {
    const fixture = Store.state.fixtures.find(f => f.id === fixtureId);
    if (!fixture || !fixture.scorecard) return;

    const sc = fixture.scorecard;
    const team1 = Store.state.teams[sc.innings1.team];
    const team2 = Store.state.teams[sc.innings2.team];

    const modalHtml = `
      <div class="glass-panel-elevated p-5 max-w-md w-full space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 class="text-base font-display font-bold text-white tracking-wide">MATCH #${fixture.matchNumber} SCORECARD</h3>
            <span class="text-[10px] text-slate-400">${fixture.stage}</span>
          </div>
          <button onclick="window.App.closeModal()" class="text-slate-400 hover:text-white">&times;</button>
        </div>

        <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <span class="text-xs font-bold text-amber-400">🏆 ${fixture.result}</span>
        </div>

        <!-- Innings 1 Summary -->
        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">${team1.name} (1st Innings)</span>
            <span class="font-display text-lg font-bold text-white">${sc.innings1.score}/${sc.innings1.wickets} <span class="text-xs text-slate-400 font-mono">(${sc.innings1.overs} ov)</span></span>
          </div>
        </div>

        <!-- Innings 2 Summary -->
        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">${team2.name} (2nd Innings)</span>
            <span class="font-display text-lg font-bold text-white">${sc.innings2.score}/${sc.innings2.wickets} <span class="text-xs text-slate-400 font-mono">(${sc.innings2.overs} ov)</span></span>
          </div>
          ${sc.innings2.target ? `<div class="text-[10px] text-slate-400">Target was: ${sc.innings2.target}</div>` : ''}
        </div>

        <button onclick="window.App.closeModal()" class="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase">
          Close Scorecard
        </button>
      </div>
    `;

    this.openModal(modalHtml);
  }

  // Admin PIN Dialog
  handleAdminToggleClick() {
    if (Store.state.admin.isAuthenticated) {
      Store.setSpectatorMode();
      this.showToast("Switched to Spectator Mode (Read-Only)", "info");
    } else {
      this.openAdminPinModal();
    }
  }

  openAdminPinModal() {
    const modalHtml = `
      <div class="glass-panel-elevated p-5 max-w-xs w-full space-y-4">
        <div class="text-center">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-display text-2xl mb-2">
            🔒
          </div>
          <h3 class="text-base font-bold text-white uppercase tracking-wider">Scorer Authorization</h3>
          <p class="text-xs text-slate-400 mt-1">Enter your 4-digit Scorer PIN to unlock match controls.</p>
        </div>

        <div>
          <input type="password" id="adminPinInput" maxlength="6" placeholder="Enter PIN" class="w-full text-center tracking-widest text-lg font-mono py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500" />
        </div>

        <div class="flex gap-2">
          <button onclick="window.App.closeModal()" class="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
            Cancel
          </button>
          <button onclick="window.App.submitAdminPin()" class="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase">
            Unlock
          </button>
        </div>
      </div>
    `;

    this.openModal(modalHtml);
  }

  async submitAdminPin() {
    const input = document.getElementById('adminPinInput');
    if (!input) return;

    const success = await Store.verifyPin(input.value);
    if (success) {
      this.closeModal();
      this.showToast("Scorer Mode Unlocked! Full match controls enabled.", "success");
    } else {
      this.showToast("Incorrect PIN. Please try again.", "error");
      input.value = "";
      input.focus();
    }
  }

  // Backup & Reset Actions
  exportBackup() {
    const jsonStr = Store.exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSL_S2_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("Tournament JSON backup downloaded", "success");
  }

  triggerImportBackup() {
    document.getElementById('importJsonFileInput')?.click();
  }

  handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        Store.importDataJson(e.target.result);
        this.showToast("Tournament data imported successfully!", "success");
      } catch (err) {
        this.showToast(err.message, "error");
      }
    };
    reader.readAsText(file);
  }

  confirmResetAll() {
    if (confirm("Are you ABSOLUTELY sure you want to reset all fixtures, standings, and tournament data? This cannot be undone.")) {
      Store.resetAllData();
      this.showToast("Tournament reset to original state.", "warning");
    }
  }

  // Toasts & Celebrations
  showToast(message, type = "info") {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    let bg = "bg-slate-900 border-slate-700 text-white";
    if (type === "success") bg = "bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-emerald-950/50";
    if (type === "error") bg = "bg-rose-950/90 border-rose-500 text-rose-200 shadow-rose-950/50";
    if (type === "warning") bg = "bg-amber-950/90 border-amber-500 text-amber-200 shadow-amber-950/50";

    toast.className = `toast fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-bold flex items-center space-x-2 backdrop-blur-md ${bg}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  fireConfetti() {
    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
}

window.App = new ApplicationController();
document.addEventListener('DOMContentLoaded', () => window.App.init());
