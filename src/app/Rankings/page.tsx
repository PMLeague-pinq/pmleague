import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();
export const revalidate = 0;

export default async function RankingsPage() {
  const teams = await prisma.team.findMany({
    orderBy: { totalScore: 'desc' },
  });

  const players = await prisma.player.findMany({
    include: { 
      team: true,
      matchResults: true,
    },
    orderBy: [{ totalScore: 'desc' }, { slotOrder: 'asc' }],
  });

  const playerStatsMap = new Map<
    string,
    {
      totalMatches: number;
      topCount: number;
      lastCount: number;
      avoidLastRate: number;
      bestWinScore: number | null;
    }
  >();

  players.forEach((player) => {
    playerStatsMap.set(player.id, {
      totalMatches: 0,
      topCount: 0,
      lastCount: 0,
      avoidLastRate: 0,
      bestWinScore: null,
    });
  });

  const matchGroups = new Map<string, typeof players[number]['matchResults']>();

  players.forEach((player) => {
    player.matchResults.forEach((result) => {
      const existingResults = matchGroups.get(result.matchId) ?? [];
      existingResults.push(result);
      matchGroups.set(result.matchId, existingResults);
    });
  });

  matchGroups.forEach((matchResults) => {
    const rankedResults = [...matchResults].sort((a, b) => {
      const pointDiff = (b.points ?? 0) - (a.points ?? 0);
      if (pointDiff !== 0) {
        return pointDiff;
      }

      const rawScoreDiff = (b.rawScore ?? 0) - (a.rawScore ?? 0);
      if (rawScoreDiff !== 0) {
        return rawScoreDiff;
      }

      return a.id.localeCompare(b.id);
    });

    rankedResults.forEach((result, index) => {
      const stats = playerStatsMap.get(result.playerId);

      if (!stats) {
        return;
      }

      stats.totalMatches += 1;

      if (index === 0) {
        stats.topCount += 1;

        if (typeof result.rawScore === 'number') {
          stats.bestWinScore =
            stats.bestWinScore === null ? result.rawScore : Math.max(stats.bestWinScore, result.rawScore);
        }
      }

      if (index === rankedResults.length - 1) {
        stats.lastCount += 1;
      }
    });
  });

  const playerStats = players.map((player) => {
    const stats = playerStatsMap.get(player.id) ?? {
      totalMatches: 0,
      topCount: 0,
      lastCount: 0,
      avoidLastRate: 0,
      bestWinScore: null,
    };

    return {
      ...player,
      ...stats,
      avoidLastRate:
        stats.totalMatches > 0
          ? Number((((stats.totalMatches - stats.lastCount) / stats.totalMatches) * 100).toFixed(1))
          : 0,
    };
  });

  const bestScoreRanked = playerStats
    .filter((player) => player.bestWinScore !== null)
    .sort((a, b) => {
      if ((b.bestWinScore ?? 0) !== (a.bestWinScore ?? 0)) {
        return (b.bestWinScore ?? 0) - (a.bestWinScore ?? 0);
      }

      if (b.topCount !== a.topCount) {
        return b.topCount - a.topCount;
      }

      return b.totalScore - a.totalScore;
    });

  // ランキング順位を計算（トップ数でソート、同点の場合はラス回避率でソート）
  const topCountRanked = [...playerStats].sort((a, b) => {
    if (b.topCount !== a.topCount) {
      return b.topCount - a.topCount;
    }
    return b.avoidLastRate - a.avoidLastRate;
  });

  const lastAvoidRanked = [...playerStats].sort((a, b) => {
    if (b.avoidLastRate !== a.avoidLastRate) {
      return b.avoidLastRate - a.avoidLastRate;
    }

    return b.topCount - a.topCount;
  });

  const topTeamScore = teams[0]?.totalScore ?? 0;

  return (
    <main className="min-h-screen bg-[#050505] p-4 md:p-6 text-white font-sans">
      <div className="max-w-6xl mx-auto mt-8 md:mt-10">
        <div className="bg-[#090909] border border-white/15 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="border-b border-white/10 bg-black/40 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            <div className="text-[10px] text-gray-500 tracking-[0.25em] uppercase font-bold">RANKINGS BOARD</div>
            <div className="text-[10px] text-gray-500 tracking-[0.25em] uppercase font-bold">PM LEAGUE</div>
          </div>
          <div className="p-4 md:p-6">

        <div className="text-center mb-10 md:mb-16 border border-white/10 rounded-xl bg-black/30 pb-5 md:pb-6 pt-6 md:pt-8 px-4 md:px-6 pm-board-section">
          <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-yellow-500">RANKINGS</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-2 tracking-[0.2em] md:tracking-[0.3em] uppercase font-bold">PMリーグ 最新ランキング</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          <section className="pm-board-section">
            <div className="mb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 px-4 sm:px-6 py-4 bg-white/5 pm-board-section-head">
              <h2 className="text-2xl font-black italic tracking-wider text-yellow-500">TEAM RANKING</h2>
              <span className="text-[10px] text-gray-500 tracking-widest uppercase">チーム成績</span>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 pm-board-inner">
              {teams.map((team, index) => (
                <div key={team.id} className="bg-[#111] border border-white/15 p-3 md:p-4 rounded-lg relative overflow-hidden transition-colors hover:border-white/30 m-ranking-row pm-board-row">
                  <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: team.color || '#eab308' }}></div>
                  
                  <div className="m-ranking-left gap-3 md:gap-4 flex-grow pr-4">
                    <div className="w-6 md:w-8 text-center font-black italic text-xl md:text-2xl text-gray-600 shrink-0">{index + 1}</div>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-black border border-white/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[6px] text-gray-500">LOGO</span>
                    </div>
                    <div className="text-sm md:text-lg font-bold tracking-wider truncate">{team.name}</div>
                  </div>
                  
                  <div className="m-ranking-right gap-3 md:gap-6">
                    <div className={`text-lg md:text-2xl font-mono font-bold w-16 md:w-24 text-right shrink-0 ${team.totalScore >= 0 ? 'text-white' : 'text-red-500'}`}>
                      {team.totalScore > 0 ? '+' : ''}{team.totalScore.toFixed(1)}
                    </div>
                    <div className="w-16 md:w-24 text-right shrink-0">
                      {index === 0 ? (
                        <span className="text-[10px] md:text-xs text-yellow-500 font-bold tracking-widest uppercase">Leader</span>
                      ) : (
                        <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest">
                          首位差 <span className="text-gray-300">{(team.totalScore - topTeamScore).toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {teams.length === 0 && <div className="text-center text-gray-500 py-10 font-bold tracking-widest text-sm">NO DATA</div>}
            </div>
          </section>

          <section className="lg:col-span-2 pm-board-section">
            <div className="mb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 px-4 sm:px-6 py-4 bg-white/5 pm-board-section-head">
              <h2 className="text-2xl font-black italic tracking-wider text-yellow-500">PLAYER RANKING</h2>
              <span className="text-[10px] text-gray-500 tracking-widest uppercase">個人成績</span>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-4 pm-board-inner">
              <div className="bg-[#0f0f0f] border border-white/15 rounded-xl overflow-hidden shadow-[0_0_18px_rgba(0,0,0,0.2)] pm-board-panel">
                <div className="px-4 py-3 bg-black/70 border-b border-yellow-600/20 flex items-center justify-between gap-3 pm-board-panel-head">
                  <div className="text-sm font-bold text-yellow-500 tracking-[0.2em] uppercase">ポイント</div>
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase">総合スコア</div>
                </div>
                <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto custom-scrollbar">
                  {players.map((player, index) => (
                    <div key={player.id} className="bg-black/40 border border-white/15 p-3 rounded-lg relative overflow-hidden transition-colors hover:border-white/35 m-ranking-row pm-board-row">
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: player.team?.color || '#eab308' }}></div>
                      <div className="m-ranking-left gap-3 flex-grow pr-3">
                        <div className="w-6 text-center font-black italic text-lg text-gray-500 shrink-0">{index + 1}</div>
                        <div className="min-w-0 flex flex-col">
                          <div className="text-sm font-bold tracking-wider truncate">{player.name}</div>
                          <div className="text-[10px] text-gray-500 tracking-widest uppercase truncate">{player.team?.name}</div>
                        </div>
                      </div>
                      <div className={`text-lg font-mono font-bold w-20 text-right shrink-0 ${player.totalScore >= 0 ? 'text-white' : 'text-red-500'}`}>
                        {player.totalScore > 0 ? '+' : ''}{player.totalScore.toFixed(1)}
                      </div>
                    </div>
                  ))}
                  {players.length === 0 && <div className="text-center text-gray-500 py-10 font-bold tracking-widest text-sm">NO DATA</div>}
                </div>
              </div>

              <div className="bg-[#0f0f0f] border border-white/15 rounded-xl overflow-hidden shadow-[0_0_18px_rgba(0,0,0,0.2)] pm-board-panel">
                <div className="px-4 py-3 bg-black/70 border-b border-green-600/20 flex items-center justify-between gap-3 pm-board-panel-head">
                  <div className="text-sm font-bold text-green-400 tracking-[0.2em] uppercase">トップ数</div>
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase">1位回数</div>
                </div>
                <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto custom-scrollbar">
                  {topCountRanked.map((player, index) => (
                    <div key={player.id} className="bg-black/40 border border-white/15 p-3 rounded-lg relative overflow-hidden transition-colors hover:border-white/35 m-ranking-row pm-board-row">
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: player.team?.color || '#eab308' }}></div>
                      <div className="m-ranking-left gap-3 flex-grow pr-3">
                        <div className="w-6 text-center font-black italic text-lg text-gray-500 shrink-0">{index + 1}</div>
                        <div className="min-w-0 flex flex-col">
                          <div className="text-sm font-bold tracking-wider truncate">{player.name}</div>
                          <div className="text-[10px] text-gray-500 tracking-widest uppercase truncate">{player.team?.name}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-mono font-bold text-green-400">{player.topCount}回</div>
                        <div className="text-[10px] text-gray-500 tracking-widest uppercase">PT {player.totalScore > 0 ? '+' : ''}{player.totalScore.toFixed(1)}</div>
                      </div>
                    </div>
                  ))}
                  {topCountRanked.length === 0 && <div className="text-center text-gray-500 py-10 font-bold tracking-widest text-sm">NO DATA</div>}
                </div>
              </div>

              <div className="bg-[#0f0f0f] border border-white/15 rounded-xl overflow-hidden shadow-[0_0_18px_rgba(0,0,0,0.2)] pm-board-panel">
                <div className="px-4 py-3 bg-black/70 border-b border-amber-600/20 flex items-center justify-between gap-3 pm-board-panel-head">
                  <div className="text-sm font-bold text-amber-400 tracking-[0.2em] uppercase">最高スコア</div>
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase">1着時の素点</div>
                </div>
                <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto custom-scrollbar">
                  {bestScoreRanked.map((player, index) => (
                    <div key={player.id} className="bg-black/40 border border-white/15 p-3 rounded-lg relative overflow-hidden transition-colors hover:border-white/35 m-ranking-row pm-board-row">
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: player.team?.color || '#eab308' }}></div>
                      <div className="m-ranking-left gap-3 flex-grow pr-3">
                        <div className="w-6 text-center font-black italic text-lg text-gray-500 shrink-0">{index + 1}</div>
                        <div className="min-w-0 flex flex-col">
                          <div className="text-sm font-bold tracking-wider truncate">{player.name}</div>
                          <div className="text-[10px] text-gray-500 tracking-widest uppercase truncate">{player.team?.name}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-mono font-bold text-amber-400">{player.bestWinScore?.toFixed(0)}点</div>
                        <div className="text-[10px] text-gray-500 tracking-widest uppercase">TOP {player.topCount} / PT {player.totalScore > 0 ? '+' : ''}{player.totalScore.toFixed(1)}</div>
                      </div>
                    </div>
                  ))}
                  {bestScoreRanked.length === 0 && <div className="text-center text-gray-500 py-10 font-bold tracking-widest text-sm">NO DATA</div>}
                </div>
              </div>

              <div className="bg-[#0f0f0f] border border-white/15 rounded-xl overflow-hidden shadow-[0_0_18px_rgba(0,0,0,0.2)] pm-board-panel">
                <div className="px-4 py-3 bg-black/70 border-b border-blue-600/20 flex items-center justify-between gap-3 pm-board-panel-head">
                  <div className="text-sm font-bold text-blue-400 tracking-[0.2em] uppercase">ラス回避率</div>
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase">最下位回避</div>
                </div>
                <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto custom-scrollbar">
                  {lastAvoidRanked.map((player, index) => (
                    <div key={player.id} className="bg-black/40 border border-white/15 p-3 rounded-lg relative overflow-hidden transition-colors hover:border-white/35 m-ranking-row pm-board-row">
                      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: player.team?.color || '#eab308' }}></div>
                      <div className="m-ranking-left gap-3 flex-grow pr-3">
                        <div className="w-6 text-center font-black italic text-lg text-gray-500 shrink-0">{index + 1}</div>
                        <div className="min-w-0 flex flex-col">
                          <div className="text-sm font-bold tracking-wider truncate">{player.name}</div>
                          <div className="text-[10px] text-gray-500 tracking-widest uppercase truncate">{player.team?.name}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-mono font-bold text-blue-400">{player.avoidLastRate}%</div>
                        <div className="text-[10px] text-gray-500 tracking-widest uppercase">L {player.lastCount}/{player.totalMatches}</div>
                      </div>
                    </div>
                  ))}
                  {lastAvoidRanked.length === 0 && <div className="text-center text-gray-500 py-10 font-bold tracking-widest text-sm">NO DATA</div>}
                </div>
              </div>
            </div>
          </section>

        </div>
        
          <div className="mt-16 text-center pb-10">
           <Link href="/" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors tracking-widest uppercase">← BACK TO TOP</Link>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}