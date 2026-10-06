import assert from 'node:assert/strict';
import { computeScoreDelta } from '../src/lib/score-adjustment.js';

const oldResults = [
  { playerId: 'p1', teamId: 't1', points: 10 },
  { playerId: 'p2', teamId: 't1', points: -5 },
  { playerId: 'p3', teamId: 't2', points: 5 },
  { playerId: 'p4', teamId: 't2', points: -10 },
];

const newResults = [
  { playerId: 'p1', teamId: 't1', points: 20 },
  { playerId: 'p2', teamId: 't1', points: -5 },
  { playerId: 'p3', teamId: 't2', points: 0 },
  { playerId: 'p4', teamId: 't2', points: -15 },
];

const delta = computeScoreDelta(oldResults, newResults);

assert.deepEqual(delta.players, {
  p1: 10,
  p3: -5,
  p4: -5,
});

assert.deepEqual(delta.teams, {
  t1: 10,
  t2: -10,
});

console.log('score-adjustment test passed');
