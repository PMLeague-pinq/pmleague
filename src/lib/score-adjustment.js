export function computeScoreDelta(oldResults, newResults) {
  const playerDiffs = {};
  const teamDiffs = {};

  const addDelta = (map, key, value) => {
    if (!key) {
      return;
    }

    const numericValue = Number(value ?? 0);
    if (!Number.isFinite(numericValue)) {
      return;
    }

    map[key] = (map[key] ?? 0) + numericValue;
  };

  for (const result of oldResults) {
    addDelta(playerDiffs, result.playerId, -(Number(result.points ?? 0)));
    addDelta(teamDiffs, result.teamId, -(Number(result.points ?? 0)));
  }

  for (const result of newResults) {
    addDelta(playerDiffs, result.playerId, Number(result.points ?? 0));
    addDelta(teamDiffs, result.teamId, Number(result.points ?? 0));
  }

  return {
    players: Object.fromEntries(
      Object.entries(playerDiffs)
        .filter(([, value]) => Number(value) !== 0)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
    teams: Object.fromEntries(
      Object.entries(teamDiffs)
        .filter(([, value]) => Number(value) !== 0)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}
