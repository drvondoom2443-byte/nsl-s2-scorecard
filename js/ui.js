/**
 * NSL S2 - Dynamic UI View Renderer & Component Builder
 * High-performance mobile UI with high contrast, touch targets, and broadcast aesthetics
 */

import { TOURNAMENT_CONFIG, TEAMS_DATA } from './config.js';
import { Store } from './state.js';
import { CricketEngine } from './engine.js';

export class UIRenderer {
  static getTeam(teamId) {
    return Store.state.teams[teamId] || {
      id: '?',
      name: 'Unknown',
      shortName: '???',
      primaryColor: '#64748B',
      secondaryColor: '#475569',
      accentGlow: 'rgba(100, 116, 139, 0.2)',
      logoBadgeText: '?'
    };
  }

  static renderTeamBadge(teamId, size = "w-10 h-10", textSize = "text-xs") {
    const t = this.getTeam(teamId);
    return `
      <div class="${size} rounded-xl p-0.5 shrink-0 shadow-lg flex items-center justify-center" 
           style="background: linear-gradient(135deg, ${t.primaryColor}, ${t.secondaryColor}); box-shadow: 0 4px 12px ${t.accentGlow};">
        <div class="w-full h-full bg-[#0E1728] rounded-[10px] flex items-center justify-center font-display font-black tracking-wider ${textSize}"
             style="color: ${t.primaryColor};">
          ${t.logoBadgeText}
        </div>
      </div>
    `;
  }

  /* -------------------------------------------------------------
   * HOME VIEW
   * ------------------------------------------------------------- */
  static renderHome() {
    const activeMatch = Store.state.activeMatch;
    const standings = CricketEngine.calculateStandings();
    const nextFixture = Store.state.fixtures.find(f => f.status === 'unlocked' && !f.result);
    const lastCompleted = [...Store.state.fixtures].reverse().find(f => f.status === 'completed');

    return `
      <div class="space-y-4">
        <!-- Tournament Hero Card -->
        <div class="relative overflow-hidden rounded-2xl p-5 border border-emerald-500/30 shadow-2xl" 
             style="background: linear-gradient(135deg, rgba(14,23,40,0.95), rgba(6,10,18,0.98)), radial-gradient(circle at 100% 0%, rgba(0,245,160,0.15), transparent 60%);">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  SEASON 2 CHAMPIONSHIP
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  8 OVERS TAPE-BALL
                </span>
              </div>
              <h1 class="text-3xl font-display font-bold mt-2 text-white tracking-wide">
                NAWAB SUPER LEAGUE
              </h1>
              <p class="text-xs text-slate-400 font-medium mt-0.5">Official Live Tournament Scoring & Match Center</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-300 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div class="w-full h-full bg-[#0A101D] rounded-[14px] flex items-center justify-center font-display text-emerald-400 font-black text-xl">
                NSL
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div class="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
            ${activeMatch ? `
              <button onclick="window.App.navigate('live')" class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25">
                <span class="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                Resume Active Match
              </button>
            ` : nextFixture ? `
              <button onclick="window.App.openTossModal(${nextFixture.id})" class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25">
                Start Next: Match ${nextFixture.matchNumber} (${nextFixture.teamA} vs ${nextFixture.teamB})
              </button>
            ` : `
              <button onclick="window.App.navigate('fixtures')" class="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5">
                View Tournament Fixtures
              </button>
            `}
            <button onclick="window.App.navigate('teams')" class="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1">
              👥 Squads
            </button>
          </div>
        </div>

        <!-- Live Match Banner (If Active) -->
        ${activeMatch ? this.renderHomeLiveMatchBanner(activeMatch) : ''}

        <!-- Quick Standings Leaderboard Snapshot -->
        <div class="glass-panel p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-white flex items-center gap-2">
              <span class="text-emerald-400 font-display text-lg">STANDINGS</span> 
              <span class="text-[10px] text-slate-400 font-normal">Top 3 Qualify</span>
            </h2>
            <button onclick="window.App.navigate('standings')" class="text-xs text-emerald-400 font-bold hover:underline">
              Full Table &rarr;
            </button>
          </div>
          
          <div class="space-y-2">
            ${standings.slice(0, 3).map((team, idx) => `
              <div class="flex items-center justify-between p-2.5 rounded-xl bg-[#080E1A] border border-slate-800/80">
                <div class="flex items-center space-x-2.5">
                  <span class="font-display text-sm font-bold w-4 text-center ${idx === 0 ? 'text-amber-400' : 'text-slate-400'}">${idx + 1}</span>
                  ${this.renderTeamBadge(team.teamId, "w-8 h-8", "text-[10px]")}
                  <div>
                    <h4 class="text-xs font-bold text-white">${team.name}</h4>
                    <span class="text-[10px] text-slate-400">P: ${team.played} | W: ${team.won} | L: ${team.lost}</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-display font-bold text-emerald-400">${team.points} PTS</div>
                  <div class="text-[9px] text-slate-400 font-mono">NRR ${team.nrr > 0 ? '+' : ''}${team.nrr}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Latest Completed Result -->
        ${lastCompleted ? `
          <div class="glass-panel p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Latest Completed Match</span>
              <span class="text-[10px] text-emerald-400 font-bold">Match #${lastCompleted.matchNumber}</span>
            </div>
            <div class="p-3 rounded-xl bg-[#080E1A] border border-slate-800">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  ${this.renderTeamBadge(lastCompleted.scorecard.innings1.team, "w-7 h-7", "text-[9px]")}
                  <span class="text-xs font-bold text-white">${lastCompleted.scorecard.innings1.team}</span>
                  <span class="text-xs font-mono text-slate-300">${lastCompleted.scorecard.innings1.score}/${lastCompleted.scorecard.innings1.wickets}</span>
                </div>
                <span class="text-[10px] font-bold text-slate-500">VS</span>
                <div class="flex items-center space-x-2">
                  <span class="text-xs font-mono text-slate-300">${lastCompleted.scorecard.innings2.score}/${lastCompleted.scorecard.innings2.wickets}</span>
                  <span class="text-xs font-bold text-white">${lastCompleted.scorecard.innings2.team}</span>
                  ${this.renderTeamBadge(lastCompleted.scorecard.innings2.team, "w-7 h-7", "text-[9px]")}
                </div>
              </div>
              <p class="text-center text-xs font-bold text-amber-400 mt-2 border-t border-slate-800/80 pt-1.5">
                🏆 ${lastCompleted.result}
              </p>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  static renderHomeLiveMatchBanner(match) {
    const inn = CricketEngine.getActiveInnings();
    const batTeam = this.getTeam(inn.battingTeam);
    const bowlTeam = this.getTeam(inn.bowlingTeam);

    return `
      <div onclick="window.App.navigate('live')" class="cursor-pointer glass-panel p-4 border border-rose-500/40 relative overflow-hidden group hover:border-rose-400 transition-all shadow-xl">
        <div class="absolute top-0 right-0 px-3 py-1 bg-rose-600 text-white font-display text-xs tracking-wider font-bold rounded-bl-xl flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
          LIVE INNINGS ${match.currentInningsIndex}
        </div>

        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Match #${match.matchNumber} &bull; ${match.stage}</span>
        
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center space-x-3">
            ${this.renderTeamBadge(inn.battingTeam, "w-12 h-12", "text-sm")}
            <div>
              <h3 class="text-base font-bold text-white flex items-center gap-1.5">
                ${batTeam.name}
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">Batting</span>
              </h3>
              <div class="flex items-baseline space-x-2 mt-0.5">
                <span class="font-display text-3xl font-bold text-white tracking-wide">${inn.totalRuns}/${inn.wickets}</span>
                <span class="text-xs font-mono text-slate-400 font-bold">(${CricketEngine.ballsToOvers(inn.legalBalls)} / ${match.oversLimit} ov)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
          <div class="text-slate-300">
            <span class="text-slate-500">Striker:</span> <strong class="text-emerald-400">${inn.striker}</strong>
          </div>
          <div class="text-emerald-400 font-bold text-[11px] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Open Scorer Console &rarr;
          </div>
        </div>
      </div>
    `;
  }

  /* -------------------------------------------------------------
   * LIVE MATCH & SCORER VIEW
   * ------------------------------------------------------------- */
  static renderLiveScorer() {
    const match = Store.state.activeMatch;
    const isAdmin = Store.state.admin.isAuthenticated;

    if (!match) {
      const nextFixture = Store.state.fixtures.find(f => f.status === 'unlocked' && !f.result);
      return `
        <div class="glass-panel p-6 text-center space-y-4">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center font-display text-3xl">
            ⚡
          </div>
          <div>
            <h2 class="text-xl font-display font-bold text-white tracking-wide">NO ACTIVE LIVE MATCH</h2>
            <p class="text-xs text-slate-400 mt-1">Select an unlocked fixture to conduct the toss and start live scoring.</p>
          </div>

          ${nextFixture ? `
            <div class="p-4 rounded-xl bg-[#080E1A] border border-slate-800 text-left space-y-3">
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span class="font-bold text-emerald-400 uppercase">Next Scheduled Match</span>
                <span>Match #${nextFixture.matchNumber}</span>
              </div>
              <div class="flex items-center justify-around py-2">
                <div class="text-center">
                  ${this.renderTeamBadge(nextFixture.teamA, "w-12 h-12 mx-auto", "text-sm")}
                  <p class="text-xs font-bold text-white mt-1">${nextFixture.teamA}</p>
                </div>
                <span class="text-sm font-display text-slate-500 font-bold">VS</span>
                <div class="text-center">
                  ${this.renderTeamBadge(nextFixture.teamB, "w-12 h-12 mx-auto", "text-sm")}
                  <p class="text-xs font-bold text-white mt-1">${nextFixture.teamB}</p>
                </div>
              </div>
              <button onclick="window.App.openTossModal(${nextFixture.id})" class="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                Conduct Toss & Start Match
              </button>
            </div>
          ` : `
            <button onclick="window.App.navigate('fixtures')" class="py-2.5 px-5 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase">
              Browse Fixtures
            </button>
          `}
        </div>
      `;
    }

    const inn = CricketEngine.getActiveInnings();
    const batTeam = this.getTeam(inn.battingTeam);
    const bowlTeam = this.getTeam(inn.bowlingTeam);
    const striker = inn.batsmen[inn.striker] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const nonStriker = inn.batsmen[inn.nonStriker] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const bowler = inn.bowlers[inn.currentBowler] || { legalBalls: 0, maidens: 0, runsConceded: 0, wickets: 0 };

    const crr = inn.legalBalls > 0 ? ((inn.totalRuns / (inn.legalBalls / 6))).toFixed(2) : "0.00";
    let rrr = null;
    let runsNeeded = null;
    let ballsRemaining = null;

    if (match.currentInningsIndex === 2 && inn.target) {
      runsNeeded = inn.target - inn.totalRuns;
      ballsRemaining = (match.oversLimit * 6) - inn.legalBalls;
      rrr = ballsRemaining > 0 ? ((runsNeeded / (ballsRemaining / 6))).toFixed(2) : "0.00";
    }

    return `
      <div class="space-y-3">
        <!-- Live Match Header & Target Tracker -->
        <div class="glass-panel p-4 relative overflow-hidden">
          <div class="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
            <span class="font-bold text-emerald-400 uppercase tracking-wider">Match #${match.matchNumber} &bull; ${match.stage}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${match.currentInningsIndex === 1 ? 'bg-amber-500/10 text-amber-400' : 'bg-cyan-500/10 text-cyan-400'}">
              Innings ${match.currentInningsIndex} of 2
            </span>
          </div>

          <!-- Main Live Scoreboard Display -->
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center space-x-3">
              ${this.renderTeamBadge(inn.battingTeam, "w-14 h-14", "text-base")}
              <div>
                <h2 class="text-base font-bold text-white flex items-center gap-1.5">
                  ${batTeam.name}
                  <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold">BATTING</span>
                </h2>
                <div class="flex items-baseline space-x-2 mt-0.5">
                  <span class="font-display text-4xl font-black text-white tracking-wide glow-emerald">${inn.totalRuns}/${inn.wickets}</span>
                  <span class="text-sm font-mono text-slate-400 font-bold">(${CricketEngine.ballsToOvers(inn.legalBalls)}/${match.oversLimit} ov)</span>
                </div>
              </div>
            </div>

            <div class="text-right">
              <div class="text-xs text-slate-400 font-medium">CRR</div>
              <div class="text-lg font-mono font-bold text-emerald-400">${crr}</div>
              ${match.isFreeHit ? `
                <span class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black bg-purple-600 text-white animate-bounce">
                  FREE HIT!
                </span>
              ` : ''}
            </div>
          </div>

          <!-- Chasing Target Math Bar (Innings 2) -->
          ${match.currentInningsIndex === 2 && inn.target ? `
            <div class="mt-3 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs">
              <div class="text-cyan-200">
                Need <strong class="text-white font-mono text-sm">${runsNeeded}</strong> runs in <strong class="text-white font-mono text-sm">${ballsRemaining}</strong> balls
              </div>
              <div class="text-right">
                <span class="text-[10px] text-cyan-400 font-bold">RRR: </span>
                <strong class="font-mono text-white text-sm">${rrr}</strong>
              </div>
            </div>
          ` : `
            <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Toss: ${this.getTeam(match.toss.winner).shortName} opted to ${match.toss.decision}</span>
              <span>Extras: ${inn.extras.total} (Wd ${inn.extras.wides}, Nb ${inn.extras.noBalls})</span>
            </div>
          `}
        </div>

        <!-- Current Batters & Bowler Detailed Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <!-- Batters Box -->
          <div class="glass-panel p-3 space-y-2">
            <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              <span>Batters</span>
              <span class="flex gap-4"><span>R(B)</span><span>4s</span><span>6s</span><span>SR</span></span>
            </div>

            <!-- Striker Row -->
            <div class="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div class="flex items-center space-x-1.5 font-bold text-emerald-400">
                <span class="text-emerald-400 text-xs">🏏</span>
                <span class="truncate max-w-[120px]">${striker.name || inn.striker} *</span>
              </div>
              <div class="flex items-center gap-4 font-mono font-bold text-right text-xs">
                <span class="text-white">${striker.runs}(${striker.balls})</span>
                <span class="text-slate-400">${striker.fours}</span>
                <span class="text-purple-400">${striker.sixes}</span>
                <span class="text-emerald-400 text-[11px]">${striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(0) : '0'}</span>
              </div>
            </div>

            <!-- Non-Striker Row -->
            <div class="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div class="flex items-center space-x-1.5 font-medium text-slate-300">
                <span class="truncate max-w-[120px] pl-4">${nonStriker.name || inn.nonStriker}</span>
              </div>
              <div class="flex items-center gap-4 font-mono text-right text-xs">
                <span class="text-slate-300">${nonStriker.runs}(${nonStriker.balls})</span>
                <span class="text-slate-500">${nonStriker.fours}</span>
                <span class="text-purple-400/80">${nonStriker.sixes}</span>
                <span class="text-slate-400 text-[11px]">${nonStriker.balls > 0 ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(0) : '0'}</span>
              </div>
            </div>
          </div>

          <!-- Current Bowler Box -->
          <div class="glass-panel p-3 space-y-2">
            <div class="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
              <span>Bowler</span>
              <span class="flex gap-4"><span>O</span><span>M</span><span>R</span><span>W</span><span>ECON</span></span>
            </div>
            <div class="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div class="font-bold text-white truncate max-w-[120px]">
                🎯 ${bowler.name || inn.currentBowler}
              </div>
              <div class="flex items-center gap-4 font-mono font-bold text-right text-xs">
                <span class="text-white">${CricketEngine.ballsToOvers(bowler.legalBalls)}</span>
                <span class="text-slate-400">${bowler.maidens}</span>
                <span class="text-slate-300">${bowler.runsConceded}</span>
                <span class="text-rose-400 font-extrabold">${bowler.wickets}</span>
                <span class="text-emerald-400 text-[11px]">${bowler.legalBalls > 0 ? ((bowler.runsConceded / (bowler.legalBalls / 6))).toFixed(1) : '0.0'}</span>
              </div>
            </div>

            <!-- Over Bowler Change Button -->
            ${isAdmin ? `
              <div class="flex justify-end pt-1">
                <button onclick="window.App.openBowlerModal()" class="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  Change Bowler &rarr;
                </button>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- This Over Timeline Ball-by-Ball -->
        <div class="glass-panel p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Over Balls</span>
            <span class="text-[10px] text-slate-400 font-mono">${inn.currentOverBalls.length} balls bowled</span>
          </div>
          <div class="flex items-center space-x-2 overflow-x-auto py-1">
            ${inn.currentOverBalls.length === 0 ? `
              <span class="text-xs text-slate-500 italic">No balls bowled in this over yet</span>
            ` : inn.currentOverBalls.map(ball => this.renderBallPill(ball)).join('')}
          </div>
        </div>

        <!-- Scorer Control Pad (Only available in Scorer Mode) -->
        ${isAdmin ? this.renderScorerKeypad(inn) : `
          <div class="glass-panel p-4 text-center border border-slate-800">
            <p class="text-xs text-slate-400">You are currently in <strong>Spectator Mode (Read-Only)</strong>.</p>
            <button onclick="window.App.handleAdminToggleClick()" class="mt-2 py-1.5 px-4 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
              Unlock Scorer Mode
            </button>
          </div>
        `}
      </div>
    `;
  }

  static renderBallPill(ball) {
    let classes = "ball-pill ";
    if (ball.type === 'WICKET') classes += "ball-wicket";
    else if (ball.type === 'WIDE' || ball.type === 'NO_BALL') classes += "ball-extra";
    else if (ball.runs === 4) classes += "ball-four";
    else if (ball.runs === 6) classes += "ball-six";
    else if (ball.runs === 0) classes += "ball-dot";
    else classes += "ball-run";

    return `<div class="${classes}">${ball.label}</div>`;
  }

  static renderScorerKeypad(inn) {
    return `
      <div class="glass-panel p-3.5 space-y-2.5 border-t-2 border-emerald-500">
        <div class="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
          <span class="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Scorer Keypad
          </span>
          <div class="flex items-center space-x-2">
            <button onclick="window.App.rotateStrikeManual()" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300">
              🔄 Swap Strike
            </button>
            <button onclick="window.App.undoLastBall()" class="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
              ↩️ Undo Ball
            </button>
          </div>
        </div>

        <!-- Row 1: Singles & Runs -->
        <div class="grid grid-cols-4 gap-2">
          <button onclick="window.App.recordRun(0)" class="scorer-btn py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-display text-2xl font-bold">0</button>
          <button onclick="window.App.recordRun(1)" class="scorer-btn py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-display text-2xl font-bold">1</button>
          <button onclick="window.App.recordRun(2)" class="scorer-btn py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-display text-2xl font-bold">2</button>
          <button onclick="window.App.recordRun(3)" class="scorer-btn py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-display text-2xl font-bold">3</button>
        </div>

        <!-- Row 2: Boundaries (High Contrast!) -->
        <div class="grid grid-cols-2 gap-2">
          <button onclick="window.App.recordRun(4)" class="scorer-btn py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-display text-3xl font-black shadow-lg shadow-emerald-500/20">
            FOUR 4
          </button>
          <button onclick="window.App.recordRun(6)" class="scorer-btn py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-display text-3xl font-black shadow-lg shadow-purple-500/20">
            SIX 6
          </button>
        </div>

        <!-- Row 3: Extras & Wicket -->
        <div class="grid grid-cols-4 gap-2">
          <button onclick="window.App.recordWide()" class="scorer-btn py-3 rounded-xl bg-amber-600/30 border border-amber-500/50 text-amber-300 font-display text-lg font-bold">
            WD (+1)
          </button>
          <button onclick="window.App.recordNoBall()" class="scorer-btn py-3 rounded-xl bg-amber-600/30 border border-amber-500/50 text-amber-300 font-display text-lg font-bold">
            NB (+1)
          </button>
          <button onclick="window.App.recordByePrompt()" class="scorer-btn py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-display text-lg font-bold">
            BYE
          </button>
          <button onclick="window.App.openWicketModal()" class="scorer-btn py-3 rounded-xl bg-rose-600 border border-rose-500 text-white font-display text-lg font-black shadow-lg shadow-rose-600/30">
            OUT (W)
          </button>
        </div>
      </div>
    `;
  }

  /* -------------------------------------------------------------
   * FIXTURES & RESULTS VIEW
   * ------------------------------------------------------------- */
  static renderFixtures() {
    const fixtures = Store.state.fixtures;

    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-display font-bold text-white tracking-wide">TOURNAMENT FIXTURES</h2>
          <span class="text-xs text-slate-400 font-medium">8 Matches Total</span>
        </div>

        <div class="space-y-3">
          ${fixtures.map(f => this.renderFixtureCard(f)).join('')}
        </div>
      </div>
    `;
  }

  static renderFixtureCard(f) {
    const isCompleted = f.status === 'completed';
    const isLive = f.status === 'live';
    const isLocked = f.status === 'locked';

    let badgeClass = "bg-slate-800 text-slate-400 border-slate-700";
    let badgeText = "UPCOMING";

    if (isCompleted) {
      badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      badgeText = "COMPLETED";
    } else if (isLive) {
      badgeClass = "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse";
      badgeText = "LIVE NOW";
    } else if (isLocked) {
      badgeClass = "bg-slate-900 text-slate-500 border-slate-800";
      badgeText = "LOCKED";
    }

    return `
      <div class="glass-panel p-4 space-y-3 ${isLive ? 'border-rose-500/50 shadow-lg shadow-rose-950/30' : ''}">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-white uppercase tracking-wider">${f.stage} &bull; Match #${f.matchNumber}</span>
            ${f.subtitle ? `<span class="text-[10px] text-slate-400">(${f.subtitle})</span>` : ''}
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-black border ${badgeClass}">
            ${badgeText}
          </span>
        </div>

        <!-- Teams Matchup -->
        <div class="flex items-center justify-between py-1">
          <div class="flex items-center space-x-2.5">
            ${this.renderTeamBadge(f.teamA, "w-10 h-10", "text-xs")}
            <div>
              <h4 class="text-xs font-bold text-white">${f.teamA ? this.getTeam(f.teamA).name : 'TBD'}</h4>
              ${isCompleted && f.scorecard ? `
                <span class="text-xs font-mono font-bold text-slate-300">
                  ${f.scorecard.innings1.team === f.teamA ? `${f.scorecard.innings1.score}/${f.scorecard.innings1.wickets}` : `${f.scorecard.innings2.score}/${f.scorecard.innings2.wickets}`}
                </span>
              ` : ''}
            </div>
          </div>

          <span class="text-xs font-display font-bold text-slate-500">VS</span>

          <div class="flex items-center space-x-2.5 text-right flex-row-reverse">
            ${this.renderTeamBadge(f.teamB, "w-10 h-10", "text-xs")}
            <div class="mr-2.5">
              <h4 class="text-xs font-bold text-white">${f.teamB ? this.getTeam(f.teamB).name : 'TBD'}</h4>
              ${isCompleted && f.scorecard ? `
                <span class="text-xs font-mono font-bold text-slate-300">
                  ${f.scorecard.innings1.team === f.teamB ? `${f.scorecard.innings1.score}/${f.scorecard.innings1.wickets}` : `${f.scorecard.innings2.score}/${f.scorecard.innings2.wickets}`}
                </span>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Result / Action Bar -->
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          ${isCompleted ? `
            <span class="text-amber-400 font-bold text-[11px]">🏆 ${f.result}</span>
            <button onclick="window.App.openScorecardModal(${f.id})" class="text-emerald-400 font-bold text-[11px] hover:underline">
              View Scorecard &rarr;
            </button>
          ` : isLive ? `
            <span class="text-rose-400 font-bold text-[11px]">Scoring in progress</span>
            <button onclick="window.App.navigate('live')" class="px-3 py-1 rounded bg-rose-600 text-white font-bold text-[11px]">
              Open Match &rarr;
            </button>
          ` : !isLocked && f.teamA && f.teamB ? `
            <span class="text-slate-400 text-[11px]">Ready for coin toss</span>
            <button onclick="window.App.openTossModal(${f.id})" class="px-3 py-1 rounded bg-emerald-500 text-slate-950 font-black text-[11px]">
              Start Match
            </button>
          ` : `
            <span class="text-slate-500 text-[11px] italic">Awaiting tournament progression</span>
          `}
        </div>
      </div>
    `;
  }

  /* -------------------------------------------------------------
   * POINTS TABLE & STANDINGS VIEW
   * ------------------------------------------------------------- */
  static renderStandings() {
    const standings = CricketEngine.calculateStandings();

    return `
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-display font-bold text-white tracking-wide">POINTS TABLE</h2>
          <p class="text-xs text-slate-400">Top 3 advance: #1 directly to Final, #2 & #3 play the Knockout Playoff.</p>
        </div>

        <div class="glass-panel overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th class="py-3 px-3">#</th>
                  <th class="py-3 px-3">Team</th>
                  <th class="py-3 px-2 text-center">P</th>
                  <th class="py-3 px-2 text-center">W</th>
                  <th class="py-3 px-2 text-center">L</th>
                  <th class="py-3 px-2 text-center">T</th>
                  <th class="py-3 px-3 text-right">NRR</th>
                  <th class="py-3 px-3 text-right text-emerald-400">PTS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                ${standings.map((row, idx) => {
                  const isDirectFinal = idx === 0;
                  const isPlayoff = idx === 1 || idx === 2;
                  return `
                    <tr class="hover:bg-slate-800/40 transition-colors ${isDirectFinal ? 'bg-amber-500/5' : isPlayoff ? 'bg-emerald-500/5' : ''}">
                      <td class="py-3 px-3 font-display text-sm font-bold ${isDirectFinal ? 'text-amber-400' : isPlayoff ? 'text-emerald-400' : 'text-slate-400'}">
                        ${idx + 1}
                      </td>
                      <td class="py-3 px-3">
                        <div class="flex items-center space-x-2">
                          ${this.renderTeamBadge(row.teamId, "w-6 h-6", "text-[8px]")}
                          <div>
                            <span class="font-bold text-white">${row.name}</span>
                            ${isDirectFinal ? '<span class="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">FINAL</span>' : ''}
                            ${isPlayoff ? '<span class="ml-1 text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">PLAYOFF</span>' : ''}
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-2 text-center font-mono font-medium">${row.played}</td>
                      <td class="py-3 px-2 text-center font-mono font-bold text-emerald-400">${row.won}</td>
                      <td class="py-3 px-2 text-center font-mono text-slate-400">${row.lost}</td>
                      <td class="py-3 px-2 text-center font-mono text-slate-400">${row.tied}</td>
                      <td class="py-3 px-3 text-right font-mono text-xs ${row.nrr >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                        ${row.nrr > 0 ? '+' : ''}${row.nrr}
                      </td>
                      <td class="py-3 px-3 text-right font-display text-base font-black text-emerald-400">
                        ${row.points}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p><span class="text-amber-400 font-bold">1st Place:</span> Advances directly into the Grand Final.</p>
          <p><span class="text-emerald-400 font-bold">2nd & 3rd Place:</span> Battle in the Knockout Playoff.</p>
        </div>
      </div>
    `;
  }

  /* -------------------------------------------------------------
   * CAPS & TOURNAMENT AWARDS VIEW
   * ------------------------------------------------------------- */
  static renderAwards() {
    const stats = Object.values(Store.state.playerStats);
    
    // Top Run Scorers (Orange Cap)
    const topBatters = [...stats].sort((a, b) => b.runs - a.runs || (b.runs / (b.ballsFaced || 1)) - (a.runs / (a.ballsFaced || 1))).slice(0, 5);
    // Top Wicket Takers (Purple Cap)
    const topBowlers = [...stats].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded).slice(0, 5);
    // Most Sixes
    const topSixes = [...stats].sort((a, b) => b.sixes - a.sixes).slice(0, 5);

    return `
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-display font-bold text-white tracking-wide">LEADERBOARDS & CAPS</h2>
          <p class="text-xs text-slate-400">Individual performance awards across all tournament matches.</p>
        </div>

        <!-- Orange Cap (Top Run Scorer) -->
        <div class="glass-panel p-4 border border-amber-500/30">
          <div class="flex items-center space-x-2 mb-3">
            <span class="text-xl">🧢</span>
            <div>
              <h3 class="text-base font-display font-bold text-amber-400 tracking-wide">ORANGE CAP - TOP BATSMAN</h3>
              <p class="text-[10px] text-slate-400">Most runs scored in NSL Season 2</p>
            </div>
          </div>
          <div class="space-y-2">
            ${topBatters.map((p, idx) => `
              <div class="flex items-center justify-between p-2 rounded-xl bg-[#080E1A] border border-slate-800/80">
                <div class="flex items-center space-x-2.5">
                  <span class="font-display text-sm font-bold w-4 text-center ${idx === 0 ? 'text-amber-400' : 'text-slate-400'}">${idx + 1}</span>
                  ${this.renderTeamBadge(p.team, "w-7 h-7", "text-[9px]")}
                  <div>
                    <span class="text-xs font-bold text-white">${p.name}</span>
                    <span class="text-[10px] text-slate-400 block">${p.team} &bull; ${p.innings} inn</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-display text-base font-bold text-amber-400">${p.runs} RUNS</div>
                  <div class="text-[9px] text-slate-400 font-mono">${p.sixes} sixes &bull; HS: ${p.highestScore}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Purple Cap (Top Bowler) -->
        <div class="glass-panel p-4 border border-purple-500/30">
          <div class="flex items-center space-x-2 mb-3">
            <span class="text-xl">🟣</span>
            <div>
              <h3 class="text-base font-display font-bold text-purple-400 tracking-wide">PURPLE CAP - TOP BOWLER</h3>
              <p class="text-[10px] text-slate-400">Most wickets taken in NSL Season 2</p>
            </div>
          </div>
          <div class="space-y-2">
            ${topBowlers.map((p, idx) => `
              <div class="flex items-center justify-between p-2 rounded-xl bg-[#080E1A] border border-slate-800/80">
                <div class="flex items-center space-x-2.5">
                  <span class="font-display text-sm font-bold w-4 text-center ${idx === 0 ? 'text-purple-400' : 'text-slate-400'}">${idx + 1}</span>
                  ${this.renderTeamBadge(p.team, "w-7 h-7", "text-[9px]")}
                  <div>
                    <span class="text-xs font-bold text-white">${p.name}</span>
                    <span class="text-[10px] text-slate-400 block">${p.team} &bull; ${CricketEngine.ballsToOvers(p.legalBallsBowled)} ov</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-display text-base font-bold text-purple-400">${p.wickets} WICKETS</div>
                  <div class="text-[9px] text-slate-400 font-mono">Runs: ${p.runsConceded} &bull; Mdn: ${p.maidens}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /* -------------------------------------------------------------
   * TEAMS & SQUADS VIEW
   * ------------------------------------------------------------- */
  static renderTeams() {
    const teams = Object.values(Store.state.teams);

    return `
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-display font-bold text-white tracking-wide">OFFICIAL SQUADS</h2>
          <p class="text-xs text-slate-400">4 Franchise Teams registered for Nawab Super League S2</p>
        </div>

        <div class="space-y-4">
          ${teams.map(t => `
            <div class="glass-panel p-4 space-y-3" style="border-left: 4px solid ${t.primaryColor};">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  ${this.renderTeamBadge(t.id, "w-12 h-12", "text-sm")}
                  <div>
                    <h3 class="text-base font-bold text-white">${t.name} (${t.shortName})</h3>
                    <p class="text-xs text-slate-400">Captain: <strong class="text-slate-200">${t.captain}</strong></p>
                  </div>
                </div>
                <span class="text-xs font-mono font-bold text-slate-400">${t.squad.length} Players</span>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                ${t.squad.map(p => `
                  <div class="p-2 rounded-lg bg-[#080E1A] border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span class="text-xs font-medium text-slate-200">${p.name}</span>
                      ${p.isCaptain ? '<span class="text-[9px] text-amber-400 font-bold ml-1">(C)</span>' : ''}
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">${p.role}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* -------------------------------------------------------------
   * SETTINGS & ADMIN CONTROLS
   * ------------------------------------------------------------- */
  static renderSettings() {
    const isAdmin = Store.state.admin.isAuthenticated;

    return `
      <div class="space-y-4">
        <div>
          <h2 class="text-2xl font-display font-bold text-white tracking-wide">SETTINGS & BACKUP</h2>
          <p class="text-xs text-slate-400">Scorer security, data persistence, and tournament backups.</p>
        </div>

        <!-- Authorization Status Card -->
        <div class="glass-panel p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-white">Scorer Mode Authorization</h3>
              <p class="text-xs text-slate-400">${isAdmin ? 'Currently authorized to score matches.' : 'In spectator mode (read-only).'}</p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-black ${isAdmin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}">
              ${isAdmin ? 'SCORER' : 'SPECTATOR'}
            </span>
          </div>
          <button onclick="window.App.handleAdminToggleClick()" class="w-full py-2.5 rounded-xl font-bold text-xs uppercase ${isAdmin ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500 text-slate-950'}">
            ${isAdmin ? 'Switch to Spectator Mode' : 'Enter Scorer PIN'}
          </button>
        </div>

        <!-- Backup & Restore -->
        <div class="glass-panel p-4 space-y-3">
          <h3 class="text-sm font-bold text-white">Data Management & Backup</h3>
          <p class="text-xs text-slate-400">Download a full JSON backup of the tournament state or restore from file.</p>
          <div class="flex gap-2">
            <button onclick="window.App.exportBackup()" class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
              Export Backup (.json)
            </button>
            <button onclick="window.App.triggerImportBackup()" class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs">
              Import Backup
            </button>
          </div>
          <input type="file" id="importJsonFileInput" class="hidden" accept=".json" onchange="window.App.handleFileImport(event)" />
        </div>

        <!-- Danger Zone -->
        ${isAdmin ? `
          <div class="glass-panel p-4 border border-rose-500/40 space-y-3">
            <h3 class="text-sm font-bold text-rose-400">Tournament Reset Zone</h3>
            <p class="text-xs text-slate-400">Reset all tournament fixtures, active matches, and career stats to season initial state.</p>
            <button onclick="window.App.confirmResetAll()" class="w-full py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-300 font-bold text-xs uppercase">
              Reset Entire Tournament
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }
}
