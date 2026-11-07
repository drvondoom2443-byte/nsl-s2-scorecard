/**
 * NSL S2 - Cricket Scoring Engine
 * Complete Tape-Ball Rules, Strike Rotation, Free Hit, Extras, NRR, and Tournament Progression
 */

import { TOURNAMENT_CONFIG, TEAMS_DATA } from './config.js';
import { Store } from './state.js';

export class CricketEngine {
  // Convert legal balls count to cricket over notation string e.g., 14 balls -> "2.2"
  static ballsToOvers(legalBalls) {
    const overs = Math.floor(legalBalls / 6);
    const balls = legalBalls % 6;
    return `${overs}.${balls}`;
  }

  // Convert overs to decimal for NRR calculation e.g. "2.2" -> 2 + 2/6 = 2.333
  static oversToDecimal(legalBalls) {
    if (!legalBalls) return 0;
    return Math.floor(legalBalls / 6) + (legalBalls % 6) / 6;
  }

  static initializeMatch(fixtureId, tossWinnerTeam, tossDecision, customOvers = TOURNAMENT_CONFIG.defaultOvers) {
    const fixture = Store.state.fixtures.find(f => f.id === fixtureId);
    if (!fixture) throw new Error("Fixture not found");

    const teamA = fixture.teamA;
    const teamB = fixture.teamB;
    if (!teamA || !teamB) throw new Error("Teams not yet determined for this fixture");

    // Determine Batting 1st and Bowling 1st teams
    let bat1stTeam, bowl1stTeam;
    if (tossDecision === 'BAT') {
      bat1stTeam = tossWinnerTeam;
      bowl1stTeam = tossWinnerTeam === teamA ? teamB : teamA;
    } else {
      bowl1stTeam = tossWinnerTeam;
      bat1stTeam = tossWinnerTeam === teamA ? teamB : teamA;
    }

    const teamBatData = Store.state.teams[bat1stTeam];
    const teamBowlData = Store.state.teams[bowl1stTeam];

    // Select default opening batters and opening bowler from squads
    const openingBatter1 = teamBatData.squad[0].name;
    const openingBatter2 = teamBatData.squad[1] ? teamBatData.squad[1].name : teamBatData.squad[0].name;
    const openingBowler = teamBowlData.squad.find(p => p.role === 'Bowler' || p.role === 'All-Rounder')?.name || teamBowlData.squad[0].name;

    const newMatch = {
      fixtureId: fixture.id,
      stage: fixture.stage,
      matchNumber: fixture.matchNumber,
      teamA,
      teamB,
      oversLimit: customOvers,
      maxOverPerBowler: TOURNAMENT_CONFIG.maxOverPerBowler,
      toss: {
        winner: tossWinnerTeam,
        decision: tossDecision // 'BAT' or 'BOWL'
      },
      currentInningsIndex: 1, // 1 or 2
      isComplete: false,
      resultText: null,
      isFreeHit: false,
      innings1: this.createInningsStructure(bat1stTeam, bowl1stTeam, openingBatter1, openingBatter2, openingBowler, customOvers),
      innings2: null
    };

    Store.recordUndoSnapshot();
    Store.state.activeMatch = newMatch;
    fixture.status = 'live';
    Store.save();
    Store.notify();
    return newMatch;
  }

  static createInningsStructure(battingTeam, bowlingTeam, strikerName, nonStrikerName, bowlerName, oversLimit) {
    const batTeamSquad = Store.state.teams[battingTeam].squad;
    const bowlTeamSquad = Store.state.teams[bowlingTeam].squad;

    const batsmen = {};
    batTeamSquad.forEach((p, idx) => {
      batsmen[p.name] = {
        name: p.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        status: (p.name === strikerName || p.name === nonStrikerName) ? 'batting' : 'dnb',
        howOut: null,
        dismissalBowler: null,
        fielder: null,
        battingPosition: (p.name === strikerName) ? 1 : (p.name === nonStrikerName) ? 2 : (idx + 1)
      };
    });

    const bowlers = {};
    bowlTeamSquad.forEach(p => {
      bowlers[p.name] = {
        name: p.name,
        legalBalls: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        currentOverRuns: 0
      };
    });

    return {
      battingTeam,
      bowlingTeam,
      oversLimit,
      totalRuns: 0,
      wickets: 0,
      legalBalls: 0,
      extras: {
        wides: 0,
        noBalls: 0,
        byes: 0,
        legByes: 0,
        total: 0
      },
      striker: strikerName,
      nonStriker: nonStrikerName,
      currentBowler: bowlerName,
      lastBowler: null,
      currentOverBalls: [], // list of balls for current over timeline
      oversHistory: [],     // completed overs summaries
      fallOfWickets: [],    // [{ wicket: 1, score: 25, over: "2.1", batter: "..." }]
      batsmen,
      bowlers,
      target: null
    };
  }

  static getActiveInnings() {
    const match = Store.state.activeMatch;
    if (!match) return null;
    return match.currentInningsIndex === 1 ? match.innings1 : match.innings2;
  }

  /**
   * Main Scoring Method: Process an action ball-by-ball
   */
  static processBall(action) {
    const match = Store.state.activeMatch;
    if (!match || match.isComplete) return false;

    const inn = this.getActiveInnings();
    if (!inn) return false;

    // Snapshot state for instant Undo
    Store.recordUndoSnapshot();

    const striker = inn.batsmen[inn.striker];
    const bowler = inn.bowlers[inn.currentBowler];
    let isLegal = false;
    let ballLabel = "";
    let ballRuns = 0;
    let rotateStrike = false;

    switch (action.type) {
      case 'RUNS': {
        const runs = Number(action.runs);
        ballRuns = runs;
        isLegal = true;
        striker.runs += runs;
        striker.balls += 1;
        if (runs === 4) striker.fours += 1;
        if (runs === 6) striker.sixes += 1;

        bowler.runsConceded += runs;
        bowler.currentOverRuns += runs;
        inn.totalRuns += runs;

        ballLabel = runs === 0 ? "•" : runs.toString();
        if (runs % 2 === 1) rotateStrike = true;
        match.isFreeHit = false;
        break;
      }

      case 'WIDE': {
        const extraRuns = 1 + (Number(action.additionalRuns) || 0);
        ballRuns = extraRuns;
        isLegal = false;
        inn.extras.wides += 1;
        inn.extras.total += extraRuns;
        inn.totalRuns += extraRuns;

        bowler.wides += 1;
        bowler.runsConceded += extraRuns;
        bowler.currentOverRuns += extraRuns;

        ballLabel = extraRuns > 1 ? `Wd+${extraRuns - 1}` : "Wd";
        if ((extraRuns - 1) % 2 === 1) rotateStrike = true;
        // Free hit stays active if already active
        break;
      }

      case 'NO_BALL': {
        const batRuns = Number(action.batRuns) || 0;
        const totalNbRuns = 1 + batRuns;
        ballRuns = totalNbRuns;
        isLegal = false;
        inn.extras.noBalls += 1;
        inn.extras.total += 1;
        inn.totalRuns += totalNbRuns;

        striker.runs += batRuns;
        striker.balls += 1;
        if (batRuns === 4) striker.fours += 1;
        if (batRuns === 6) striker.sixes += 1;

        bowler.noBalls += 1;
        bowler.runsConceded += totalNbRuns;
        bowler.currentOverRuns += totalNbRuns;

        ballLabel = batRuns > 0 ? `Nb+${batRuns}` : "Nb";
        if (batRuns % 2 === 1) rotateStrike = true;
        match.isFreeHit = true; // Next ball is a free hit
        break;
      }

      case 'BYE':
      case 'LEG_BYE': {
        const runs = Number(action.runs) || 1;
        ballRuns = runs;
        isLegal = true;
        striker.balls += 1;
        if (action.type === 'BYE') inn.extras.byes += runs;
        else inn.extras.legByes += runs;

        inn.extras.total += runs;
        inn.totalRuns += runs;
        // Byes / Leg byes are NOT charged to the bowler's runs conceded!
        ballLabel = action.type === 'BYE' ? `B${runs}` : `Lb${runs}`;
        if (runs % 2 === 1) rotateStrike = true;
        match.isFreeHit = false;
        break;
      }

      case 'WICKET': {
        isLegal = true;
        const wicketType = action.wicketType || 'BOWLED'; // BOWLED, CAUGHT, RUN_OUT, STUMPED, LBW, HIT_WICKET
        const outPlayerName = action.outPlayer || inn.striker;
        const outBatter = inn.batsmen[outPlayerName];

        outBatter.balls += 1;
        outBatter.status = 'out';
        inn.wickets += 1;

        let dismissalDescription = "";
        const isBowlerWicket = wicketType !== 'RUN_OUT';

        if (isBowlerWicket) {
          bowler.wickets += 1;
          if (wicketType === 'BOWLED') dismissalDescription = `b ${inn.currentBowler}`;
          else if (wicketType === 'CAUGHT') dismissalDescription = action.fielder ? `c ${action.fielder} b ${inn.currentBowler}` : `c & b ${inn.currentBowler}`;
          else if (wicketType === 'STUMPED') dismissalDescription = `st ${action.fielder || 'Keeper'} b ${inn.currentBowler}`;
          else if (wicketType === 'LBW') dismissalDescription = `lbw b ${inn.currentBowler}`;
          else if (wicketType === 'HIT_WICKET') dismissalDescription = `hit wicket b ${inn.currentBowler}`;
        } else {
          // Run out
          dismissalDescription = action.fielder ? `run out (${action.fielder})` : 'run out';
        }

        outBatter.howOut = dismissalDescription;
        outBatter.dismissalBowler = isBowlerWicket ? inn.currentBowler : null;
        outBatter.fielder = action.fielder || null;

        inn.fallOfWickets.push({
          wicketNumber: inn.wickets,
          score: inn.totalRuns,
          over: this.ballsToOvers(inn.legalBalls + 1),
          batter: outBatter.name
        });

        ballLabel = "W";
        match.isFreeHit = false;

        // Bring in next batter if provided
        if (action.newBatter) {
          inn.batsmen[action.newBatter].status = 'batting';
          if (outPlayerName === inn.striker) {
            inn.striker = action.newBatter;
          } else {
            inn.nonStriker = action.newBatter;
          }
        }
        break;
      }
    }

    // Add to current over timeline
    inn.currentOverBalls.push({
      label: ballLabel,
      type: action.type,
      runs: ballRuns,
      isLegal,
      striker: inn.striker,
      bowler: inn.currentBowler
    });

    if (isLegal) {
      inn.legalBalls += 1;
      bowler.legalBalls += 1;
    }

    // Rotate strike if odd runs
    if (rotateStrike) {
      const temp = inn.striker;
      inn.striker = inn.nonStriker;
      inn.nonStriker = temp;
    }

    // Check 2nd Innings Target Chase Victory
    if (match.currentInningsIndex === 2 && inn.target) {
      if (inn.totalRuns >= inn.target) {
        this.concludeMatch(match);
        Store.save();
        Store.notify();
        return true;
      }
    }

    // Check End of Over (6 legal balls)
    if (isLegal && inn.legalBalls % 6 === 0) {
      this.handleOverCompletion(inn, match);
    }

    // Check Innings End conditions (Overs limit reached or all out)
    const maxBalls = inn.oversLimit * 6;
    const squadCount = Object.keys(inn.batsmen).length;
    const isAllOut = inn.wickets >= (squadCount - 1); // 10 wickets in a 11-player squad

    if (inn.legalBalls >= maxBalls || isAllOut) {
      this.handleInningsEnd(match);
    }

    Store.save();
    Store.notify();
    return true;
  }

  static handleOverCompletion(inn, match) {
    const bowler = inn.bowlers[inn.currentBowler];
    // Check for maiden over: 6 legal balls in current over and 0 runs conceded
    if (bowler.currentOverRuns === 0) {
      bowler.maidens += 1;
    }
    bowler.currentOverRuns = 0;

    // Archive completed over
    inn.oversHistory.push({
      overNumber: Math.floor(inn.legalBalls / 6),
      bowler: inn.currentBowler,
      balls: [...inn.currentOverBalls],
      totalRunsAfterOver: inn.totalRuns,
      wicketsAfterOver: inn.wickets
    });
    inn.currentOverBalls = [];

    // Strike rotates at the end of the over
    const temp = inn.striker;
    inn.striker = inn.nonStriker;
    inn.nonStriker = temp;

    inn.lastBowler = inn.currentBowler;

    // Auto-select or suggest next bowler (who is not the last bowler and hasn't exceeded max overs)
    const eligibleBowlers = Object.values(inn.bowlers).filter(b => {
      const maxBalls = match.maxOverPerBowler * 6;
      return b.name !== inn.lastBowler && b.legalBalls < maxBalls;
    });

    if (eligibleBowlers.length > 0) {
      inn.currentBowler = eligibleBowlers[0].name;
    }
  }

  static handleInningsEnd(match) {
    if (match.currentInningsIndex === 1) {
      // Transition to Innings 2
      const inn1 = match.innings1;
      const target = inn1.totalRuns + 1;
      const bat2ndTeam = inn1.bowlingTeam;
      const bowl2ndTeam = inn1.battingTeam;

      const teamBat2Data = Store.state.teams[bat2ndTeam];
      const teamBowl2Data = Store.state.teams[bowl2ndTeam];

      const openBat1 = teamBat2Data.squad[0].name;
      const openBat2 = teamBat2Data.squad[1] ? teamBat2Data.squad[1].name : teamBat2Data.squad[0].name;
      const openBowl = teamBowl2Data.squad.find(p => p.role === 'Bowler' || p.role === 'All-Rounder')?.name || teamBowl2Data.squad[0].name;

      match.innings2 = this.createInningsStructure(bat2ndTeam, bowl2ndTeam, openBat1, openBat2, openBowl, match.oversLimit);
      match.innings2.target = target;
      match.currentInningsIndex = 2;
    } else {
      // 2nd innings finished -> Match Conclusion
      this.concludeMatch(match);
    }
  }

  static concludeMatch(match) {
    match.isComplete = true;
    const inn1 = match.innings1;
    const inn2 = match.innings2;

    let winner = null;
    let margin = "";

    if (inn2.totalRuns >= inn2.target) {
      // Chasing team won
      winner = inn2.battingTeam;
      const wicketsLeft = (Object.keys(inn2.batsmen).length - 1) - inn2.wickets;
      const ballsRemaining = (inn2.oversLimit * 6) - inn2.legalBalls;
      margin = `${wicketsLeft} wickets (${ballsRemaining} balls left)`;
      match.resultText = `${Store.state.teams[winner].name} won by ${margin}`;
    } else if (inn2.totalRuns === (inn2.target - 1)) {
      // Match Tied
      winner = 'TIE';
      match.resultText = `Match Tied (Scores Level: ${inn1.totalRuns} - ${inn2.totalRuns})`;
    } else {
      // Defending team won
      winner = inn1.battingTeam;
      const runMargin = inn1.totalRuns - inn2.totalRuns;
      margin = `${runMargin} runs`;
      match.resultText = `${Store.state.teams[winner].name} won by ${margin}`;
    }

    match.winnerTeam = winner;

    // Update Fixture Status and Result
    const fixture = Store.state.fixtures.find(f => f.id === match.fixtureId);
    if (fixture) {
      fixture.status = 'completed';
      fixture.result = match.resultText;
      fixture.winner = winner;
      fixture.scorecard = {
        innings1: {
          team: inn1.battingTeam,
          score: inn1.totalRuns,
          wickets: inn1.wickets,
          overs: this.ballsToOvers(inn1.legalBalls)
        },
        innings2: {
          team: inn2.battingTeam,
          score: inn2.totalRuns,
          wickets: inn2.wickets,
          overs: this.ballsToOvers(inn2.legalBalls),
          target: inn2.target
        }
      };
    }

    // Aggregate career & tournament player stats
    this.aggregateTournamentStats(match);

    // Progression logic (unlock next match / playoffs / final)
    this.handleTournamentProgression();
  }

  static aggregateTournamentStats(match) {
    [match.innings1, match.innings2].forEach(inn => {
      if (!inn) return;
      // Batter stats
      Object.values(inn.batsmen).forEach(b => {
        if (b.status === 'batting' || b.status === 'out') {
          const p = Store.state.playerStats[b.name];
          if (p) {
            p.matches += 1;
            p.innings += 1;
            p.runs += b.runs;
            p.ballsFaced += b.balls;
            p.fours += b.fours;
            p.sixes += b.sixes;
            if (b.status === 'batting') p.notOuts += 1;
            if (b.runs > p.highestScore) p.highestScore = b.runs;
          }
        }
      });

      // Bowler stats
      Object.values(inn.bowlers).forEach(b => {
        if (b.legalBalls > 0) {
          const p = Store.state.playerStats[b.name];
          if (p) {
            p.legalBallsBowled += b.legalBalls;
            p.runsConceded += b.runsConceded;
            p.wickets += b.wickets;
            p.maidens += b.maidens;
            // Best bowling
            if (b.wickets > p.bestWickets || (b.wickets === p.bestWickets && b.runsConceded < p.bestRuns)) {
              p.bestWickets = b.wickets;
              p.bestRuns = b.runsConceded;
            }
          }
        }
      });
    });
  }

  /**
   * Unlock next sequential fixture, setup Playoffs & Grand Final
   */
  static handleTournamentProgression() {
    const fixtures = Store.state.fixtures;

    // Check group matches (Matches 1 to 6)
    const groupMatches = fixtures.filter(f => f.type === 'GROUP');
    const allGroupsDone = groupMatches.every(f => f.status === 'completed');

    // Unlock next locked group match
    const nextLockedGroup = groupMatches.find(f => f.status === 'locked');
    if (nextLockedGroup) {
      nextLockedGroup.status = 'unlocked';
    }

    // When all group matches are done, calculate standings and populate Playoff and Final!
    if (allGroupsDone) {
      const standings = this.calculateStandings();
      const playoff = fixtures.find(f => f.type === 'PLAYOFF');
      const finalMatch = fixtures.find(f => f.type === 'FINAL');

      if (playoff && standings.length >= 3) {
        playoff.teamA = standings[1].teamId; // 2nd place
        playoff.teamB = standings[2].teamId; // 3rd place
        if (playoff.status === 'locked') playoff.status = 'unlocked';
      }

      if (finalMatch && standings.length >= 1) {
        finalMatch.teamA = standings[0].teamId; // 1st place direct entry!
      }
    }

    // When Playoff is complete, winner moves to Grand Final
    const playoffMatch = fixtures.find(f => f.type === 'PLAYOFF');
    const finalMatch = fixtures.find(f => f.type === 'FINAL');
    if (playoffMatch && playoffMatch.status === 'completed' && finalMatch) {
      finalMatch.teamB = playoffMatch.winner;
      if (finalMatch.status === 'locked') finalMatch.status = 'unlocked';
    }
  }

  /**
   * Official Standings & Net Run Rate (NRR) computation
   */
  static calculateStandings() {
    const teams = Store.state.teams;
    const completedFixtures = Store.state.fixtures.filter(f => f.type === 'GROUP' && f.status === 'completed' && f.scorecard);

    const table = {};
    Object.keys(teams).forEach(id => {
      table[id] = {
        teamId: id,
        name: teams[id].name,
        shortName: teams[id].shortName,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        points: 0,
        runsScored: 0,
        oversFacedDecimal: 0,
        runsConceded: 0,
        oversBowledDecimal: 0,
        nrr: 0
      };
    });

    completedFixtures.forEach(fix => {
      const sc = fix.scorecard;
      const t1 = sc.innings1.team;
      const t2 = sc.innings2.team;

      if (!table[t1] || !table[t2]) return;

      table[t1].played += 1;
      table[t2].played += 1;

      // Runs & overs
      const inn1Balls = this.parseOversToBalls(sc.innings1.overs);
      const inn2Balls = this.parseOversToBalls(sc.innings2.overs);

      table[t1].runsScored += sc.innings1.score;
      table[t1].oversFacedDecimal += this.oversToDecimal(inn1Balls);
      table[t1].runsConceded += sc.innings2.score;
      table[t1].oversBowledDecimal += this.oversToDecimal(inn2Balls);

      table[t2].runsScored += sc.innings2.score;
      table[t2].oversFacedDecimal += this.oversToDecimal(inn2Balls);
      table[t2].runsConceded += sc.innings1.score;
      table[t2].oversBowledDecimal += this.oversToDecimal(inn1Balls);

      if (fix.winner === t1) {
        table[t1].won += 1;
        table[t1].points += TOURNAMENT_CONFIG.pointsForWin;
        table[t2].lost += 1;
      } else if (fix.winner === t2) {
        table[t2].won += 1;
        table[t2].points += TOURNAMENT_CONFIG.pointsForWin;
        table[t1].lost += 1;
      } else {
        table[t1].tied += 1;
        table[t2].tied += 1;
        table[t1].points += TOURNAMENT_CONFIG.pointsForTie;
        table[t2].points += TOURNAMENT_CONFIG.pointsForTie;
      }
    });

    // Compute NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
    Object.values(table).forEach(row => {
      const battingRate = row.oversFacedDecimal > 0 ? (row.runsScored / row.oversFacedDecimal) : 0;
      const bowlingRate = row.oversBowledDecimal > 0 ? (row.runsConceded / row.oversBowledDecimal) : 0;
      row.nrr = parseFloat((battingRate - bowlingRate).toFixed(3));
    });

    // Sort by Points DESC, then NRR DESC, then Runs Scored DESC
    return Object.values(table).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.nrr !== a.nrr) return b.nrr - a.nrr;
      return b.runsScored - a.runsScored;
    });
  }

  static parseOversToBalls(oversStr) {
    if (!oversStr) return 0;
    const parts = oversStr.split('.');
    const ov = parseInt(parts[0], 10) || 0;
    const b = parseInt(parts[1], 10) || 0;
    return (ov * 6) + b;
  }
}
