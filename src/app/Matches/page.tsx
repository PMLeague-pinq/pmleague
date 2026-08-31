import { PrismaClient } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

// 常に最新のデータベース情報を取得する設定
export const revalidate = 0;

export default async function MatchesPage() {
  // 1. 終了した試合（履歴）を新しい順に取得
  const finishedMatches = await prisma.match.findMany({
    where: { status: 'FINISHED' },
    orderBy: { id: 'desc' }, // 新しい順（とりあえずID降順で代用）
    select: {
      id: true,
      date: true,
      title: true,
      status: true,
      results: {
        orderBy: { points: 'desc' },
        select: {
          id: true,
          matchId: true,
          playerId: true,
          wind: true,
          rawScore: true,
          points: true,
          rank: true,
          player: {
            select: {
              id: true,
              name: true,
              teamId: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // 2. 予定されている試合（次回日程）を取得
  const scheduledMatches = await prisma.match.findMany({
    where: { status: 'SCHEDULED' },
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      title: true,
      status: true,
      results: {
        select: {
          id: true,
          matchId: true,
          playerId: true,
          wind: true,
          player: {
            select: {
              id: true,
              name: true,
              teamId: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      },
    },
  });
  
  const upcomingMatches = scheduledMatches.slice(0, 2);

  return (
    <main className="min-h-screen bg-[#050505] p-4 md:p-6 text-white font-sans">
      <div className="max-w-5xl mx-auto mt-8 md:mt-10">
        {/* ヘッダー */}
        <div className="text-center mb-10 md:mb-16 border border-white/10 rounded-xl bg-black/30 pb-5 md:pb-6 pt-6 md:pt-8 px-4 md:px-6 pm-board-section">
          <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-yellow-500">
            MATCHES
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-2 tracking-[0.2em] md:tracking-[0.3em] uppercase font-bold">
            試合日程・結果
          </p>
        </div>

        {/* =========================================
            次回予告（NEXT MATCH）セクション
            ========================================= */}
        <section className="mb-14 md:mb-20 pm-board-section pm-next-match-section">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 px-4 sm:px-6 py-4 bg-white/5 pm-board-section-head pm-next-match-section-head">
            <h2 className="text-2xl font-black italic tracking-wider text-yellow-500">
              NEXT MATCH
            </h2>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">次回 対戦カード</span>
          </div>

          <div className="p-4 sm:p-6 pm-board-inner">
            {upcomingMatches.length > 0 ? (
              <div className="space-y-6">
                {upcomingMatches.map((match) => {
                  const winds = ["EAST", "SOUTH", "WEST", "NORTH"] as const;
                  const isWindAssigned = match.results.length === 4 && match.results.every((res) => res.wind !== null);
                  const orderedResults = isWindAssigned
                    ? [...match.results].sort((a, b) => winds.indexOf(a.wind as typeof winds[number]) - winds.indexOf(b.wind as typeof winds[number]))
                    : match.results;

                  return (
                    <div key={match.id} className="pm-board-card pm-next-match-card shadow-[0_0_30px_rgba(234,179,8,0.1)] ring-1 ring-white/5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700"></div>

                      <div className="px-4 sm:px-8 pt-5 sm:pt-6 pb-4 border-b border-white/10 bg-gradient-to-r from-black/70 to-transparent pm-board-card-head pm-next-match-card-head">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="text-[10px] text-gray-500 tracking-[0.25em] uppercase font-bold mb-2">NEXT MATCH CARD</div>
                            <div className="text-yellow-500 font-bold tracking-widest text-xl sm:text-2xl">{match.title}</div>
                          </div>
                          <div className="text-xs text-gray-400 tracking-widest uppercase">
                            {isWindAssigned ? '出場予定選手（方角確定）' : `監督提出待ち (${new Set(match.results.map((r) => r.player.teamId)).size}/4)`}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                          {orderedResults.map((res) => {
                            const windLabel =
                              res.wind === 'EAST'
                                ? '東家'
                                : res.wind === 'SOUTH'
                                ? '南家'
                                : res.wind === 'WEST'
                                ? '西家'
                                : res.wind === 'NORTH'
                                ? '北家'
                                : '提出済み';

                            const windClass =
                              res.wind === 'EAST'
                                ? 'text-red-500'
                                : res.wind === 'SOUTH'
                                ? 'text-blue-500'
                                : res.wind === 'WEST'
                                ? 'text-green-500'
                                : res.wind === 'NORTH'
                                ? 'text-gray-300'
                                : 'text-yellow-500';

                            return (
                              <div key={res.id} className="pm-board-row pm-board-card-accent pm-next-match-player pm-next-match-player-outline relative overflow-hidden min-h-32">
                                <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: res.player.team?.color || '#eab308' }}></div>
                                <div className="p-4 h-full flex flex-col justify-between gap-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase ${windClass} bg-white/5 border border-white/10`}>
                                      {windLabel}
                                    </div>
                                    <div className="text-[10px] text-gray-500 tracking-widest uppercase text-right">
                                      {res.player.team?.name}
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <div className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Player</div>
                                    <div className="text-lg sm:text-xl font-bold text-white tracking-wider break-words">
                                      {res.player.name}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {match.results.length === 0 && (
                            <div className="col-span-full text-center text-gray-500 py-10 font-bold tracking-wide border border-dashed border-white/15 rounded-lg bg-black/30">
                              監督の出場選手提出を待っています。
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#111] border border-white/10 p-12 text-center rounded-xl pm-board-outline pm-next-match-player-outline">
                <div className="text-gray-500 font-bold tracking-widest">
                  次節の対戦カードは現在調整中です。
                </div>
              </div>
            )}
          </div>
        </section>
        {/* =========================================
            試合結果（MATCH HISTORY）セクション
            ========================================= */}
        <section className="pm-board-section pm-history-section">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 px-4 sm:px-6 py-4 bg-white/5 pm-board-section-head pm-history-section-head">
            <h2 className="text-2xl font-black italic tracking-wider text-yellow-500">
              MATCH HISTORY
            </h2>
            <span className="text-[10px] text-gray-500 tracking-widest uppercase">過去の試合結果</span>
          </div>

            <div className="p-4 sm:p-6 space-y-8 pm-board-inner">
            {finishedMatches.map((match) => (
              <div key={match.id} className="bg-[#0f0f0f] border border-white/15 rounded-xl overflow-hidden hover:border-white/30 transition-colors shadow-[0_0_24px_rgba(0,0,0,0.25)] pm-board-card pm-history-card">
                
                {/* 試合タイトル帯 */}
                <div className="bg-black/70 border-b border-white/10 px-4 sm:px-6 py-3 flex justify-between items-center pm-board-card-head pm-history-card-head">
                  <div className="font-bold tracking-widest text-yellow-500">{match.title}</div>
                  <div className="text-[10px] text-gray-500 tracking-[0.2em] uppercase font-bold">RESULTS</div>
                </div>

                {/* 順位（1着〜4着）のリスト */}
                <div className="p-4 sm:p-6 space-y-2">
                  {match.results.map((res, index) => {
                    // 順位ごとの文字色を設定（1着=金、2着=銀、3着=銅、4着=灰）
                    const rankColors = ["text-yellow-400", "text-gray-300", "text-amber-600", "text-gray-600"];
                    const rankColor = rankColors[index] || "text-gray-500";

                    return (
                      <div key={res.id} className="flex items-center justify-between gap-3 bg-black/40 border border-white/15 p-3 rounded-lg relative overflow-hidden pm-board-row pm-history-row">
                        {/* チームカラーのサイドライン */}
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: res.player.team?.color || '#333' }}></div>
                        
                        <div className="flex items-center gap-3 sm:gap-4 pl-4 flex-grow min-w-0">
                          <div className={`font-black italic text-xl ${rankColor} w-8 text-center`}>
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] text-gray-500 tracking-widest uppercase truncate">{res.player.team?.name}</div>
                            <div className="font-bold text-white tracking-wider truncate">{res.player.name}</div>
                          </div>
                        </div>

                        <div className="text-right pr-2 shrink-0">
                          <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-0.5">
                            {(res.rawScore ?? 0).toLocaleString()}
                          </div>
                          <div className={`text-lg font-mono font-bold ${(res.points ?? 0) >= 0 ? 'text-white' : 'text-red-500'}`}>
                            {(res.points ?? 0) > 0 ? '+' : ''}{(res.points ?? 0).toFixed(1)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {finishedMatches.length === 0 && (
              <div className="text-center text-gray-500 py-20 font-bold tracking-widest border border-dashed border-white/10 rounded-xl bg-black/20 pm-board-outline pm-history-outline">
                まだ試合結果がありません。
              </div>
            )}
          </div>
        </section>
        
          <div className="mt-16 text-center pb-10">
           <Link href="/" className="text-sm text-gray-400 hover:text-yellow-500 transition-colors tracking-widest uppercase">
             ← BACK TO TOP
           </Link>
          </div>
      </div>
    </main>
  );
}