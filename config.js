/**
 * NSL S2 - Nawab Super League Season 2
 * Configuration, Teams, Rules & Default Schedule
 */

export const TOURNAMENT_CONFIG = {
  name: "Nawab Super League Season 2",
  shortName: "NSL S2",
  edition: "Tape-Ball Championship",
  defaultOvers: 8,
  maxOverPerBowler: 2, // Standard tape-ball rule for 8 overs
  wideRun: 1,
  noBallRun: 1,
  pointsForWin: 2,
  pointsForTie: 1,
  pointsForLoss: 0,
  storageKey: "NSL_S2_TOURNAMENT_V3_MODULAR",
  // SHA-256 hash for default PIN "2443" - no plaintext password in client code
  defaultPinHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"
};

export const TEAMS_DATA = {
  'KTG': {
    id: 'KTG',
    name: 'Khan Tigers',
    shortName: 'KTG',
    captain: 'Arbaz M',
    logo: 'assets/ktg.jpg',
    primaryColor: '#F59E0B',     // Vibrant Gold
    secondaryColor: '#EF4444',   // Fire Red
    accentGlow: 'rgba(245, 158, 11, 0.35)',
    logoBadgeText: 'KTG',
    squad: [
      { name: 'Arbaz M', isCaptain: true, role: 'All-Rounder' },
      { name: 'Azhar M', isCaptain: false, role: 'Batter' },
      { name: 'Farhan Iq', isCaptain: false, role: 'Bowler' },
      { name: 'Farhan J', isCaptain: false, role: 'Batter' },
      { name: 'Amir K', isCaptain: false, role: 'Bowler' },
      { name: 'Adeel K', isCaptain: false, role: 'Batter' },
      { name: 'Zohaib Ir', isCaptain: false, role: 'All-Rounder' },
      { name: 'Saqib G', isCaptain: false, role: 'Bowler' },
      { name: 'Ghayoor A', isCaptain: false, role: 'Batter' },
      { name: 'Faheem D', isCaptain: false, role: 'Bowler' },
      { name: 'Ayaz D', isCaptain: false, role: 'Batter' },
      { name: 'Aliyan S', isCaptain: false, role: 'All-Rounder' }
    ]
  },
  'ASK': {
    id: 'ASK',
    name: 'Arslan Aslam Super Kings',
    shortName: 'ASK',
    captain: 'Aslam K',
    logo: 'assets/ask.jpg',
    primaryColor: '#3B82F6',     // Royal Blue
    secondaryColor: '#F59E0B',   // Gold
    accentGlow: 'rgba(59, 130, 246, 0.35)',
    logoBadgeText: 'ASK',
    squad: [
      { name: 'Aslam K', isCaptain: true, role: 'All-Rounder' },
      { name: 'Shahzad M', isCaptain: false, role: 'Batter' },
      { name: 'Kashif K', isCaptain: false, role: 'Bowler' },
      { name: 'Zeeshan Iq', isCaptain: false, role: 'Batter' },
      { name: 'Irfan F', isCaptain: false, role: 'All-Rounder' },
      { name: 'Ali N', isCaptain: false, role: 'Bowler' },
      { name: 'Noman Ij', isCaptain: false, role: 'Batter' },
      { name: 'Atif M', isCaptain: false, role: 'Bowler' },
      { name: 'Hasan J', isCaptain: false, role: 'Batter' },
      { name: 'Danish R', isCaptain: false, role: 'Bowler' }
    ]
  },
  'NKG': {
    id: 'NKG',
    name: 'Nawab Kings',
    shortName: 'NKG',
    captain: 'AKHTIAR H',
    logo: 'assets/nkg.jpg',
    primaryColor: '#8B5CF6',     // Royal Purple
    secondaryColor: '#10B981',   // Emerald
    accentGlow: 'rgba(139, 92, 246, 0.35)',
    logoBadgeText: 'NKG',
    squad: [
      { name: 'AKHTIAR H', isCaptain: true, role: 'All-Rounder' },
      { name: 'Zeehsan Sh', isCaptain: false, role: 'Batter' },
      { name: 'Asim P', isCaptain: false, role: 'Bowler' },
      { name: 'Amir Ib', isCaptain: false, role: 'All-Rounder' },
      { name: 'Sadeeq D', isCaptain: false, role: 'Bowler' },
      { name: 'Rehan J', isCaptain: false, role: 'Batter' },
      { name: 'Shabeer D', isCaptain: false, role: 'Bowler' },
      { name: 'Ali B', isCaptain: false, role: 'Batter' },
      { name: 'Saqib S', isCaptain: false, role: 'All-Rounder' },
      { name: 'Ayan A', isCaptain: false, role: 'Batter' }
    ]
  },
  'ALW': {
    id: 'ALW',
    name: 'Ali Waly',
    shortName: 'ALW',
    captain: 'Imtiaz K',
    logo: 'assets/alw.jpg',
    primaryColor: '#06B6D4',     // Cyan Teal
    secondaryColor: '#059669',   // Forest Emerald
    accentGlow: 'rgba(6, 182, 212, 0.35)',
    logoBadgeText: 'ALW',
    squad: [
      { name: 'Imtiaz K', isCaptain: true, role: 'All-Rounder' },
      { name: 'Saddam D', isCaptain: false, role: 'Batter' },
      { name: 'Ijaz H', isCaptain: false, role: 'Bowler' },
      { name: 'Saqlain Ir', isCaptain: false, role: 'All-Rounder' },
      { name: 'Hasan Ch', isCaptain: false, role: 'Batter' },
      { name: 'Shahzad R', isCaptain: false, role: 'Bowler' },
      { name: 'Bilal D', isCaptain: false, role: 'Batter' },
      { name: 'Asad D', isCaptain: false, role: 'Bowler' },
      { name: 'Azhar Cf', isCaptain: false, role: 'Batter' },
      { name: 'Aftab Im', isCaptain: false, role: 'All-Rounder' }
    ]
  }
};

export const INITIAL_FIXTURES = [
  { id: 1, type: 'GROUP', stage: 'Group Stage', matchNumber: 1, teamA: 'ASK', teamB: 'KTG', overs: 8, status: 'unlocked', result: null, scorecard: null },
  { id: 2, type: 'GROUP', stage: 'Group Stage', matchNumber: 2, teamA: 'ALW', teamB: 'NKG', overs: 8, status: 'locked', result: null, scorecard: null },
  { id: 3, type: 'GROUP', stage: 'Group Stage', matchNumber: 3, teamA: 'ASK', teamB: 'ALW', overs: 8, status: 'locked', result: null, scorecard: null },
  { id: 4, type: 'GROUP', stage: 'Group Stage', matchNumber: 4, teamA: 'KTG', teamB: 'NKG', overs: 8, status: 'locked', result: null, scorecard: null },
  { id: 5, type: 'GROUP', stage: 'Group Stage', matchNumber: 5, teamA: 'ASK', teamB: 'NKG', overs: 8, status: 'locked', result: null, scorecard: null },
  { id: 6, type: 'GROUP', stage: 'Group Stage', matchNumber: 6, teamA: 'ALW', teamB: 'KTG', overs: 8, status: 'locked', result: null, scorecard: null },
  { id: 7, type: 'PLAYOFF', stage: 'Playoff Knockout', matchNumber: 7, subtitle: '2nd Place vs 3rd Place', teamA: null, teamB: null, overs: 8, status: 'locked', result: null, scorecard: null },
  { id: 8, type: 'FINAL', stage: 'Grand Final', matchNumber: 8, subtitle: '1st Place vs Winner of Playoff', teamA: null, teamB: null, overs: 8, status: 'locked', result: null, scorecard: null }
];
