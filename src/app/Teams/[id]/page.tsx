import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();
export const revalidate = 0;

// URLに含まれるチームID（[id]）を受け取って画面を作る
export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  // 念のため params を非同期で展開（最新のNext.jsの仕様対応）
  const { id } = await params;

  // 受け取ったIDに一致するチームと、その選手を探す
  const team = await prisma.team.findUnique({
    where: { id: id },
    include: {
      players: true,
    },
  });

  // 万が一チームが見つからなかったら404エラーページを出す
  if (!team) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center">
      
      {/* ヒーローセクション（チームカラーをグラデーションで背景に敷く） */}
      <div 
        className="w-full h-56 md:h-64 relative flex items-center justify-center border-b border-white/10"
        style={{ 
          background: `linear-gradient(to bottom, ${team.color || '#eab308'}20, #050505)`,
          borderTop: `4px solid ${team.color || '#eab308'}`
        }}
      >
        <div className="absolute top-4 left-4 md:top-6 md:left-6">
          <Link href="/Teams" className="text-xs md:text-sm font-bold text-gray-400 hover:text-white transition-colors tracking-widest uppercase flex items-center gap-2">
            <span>←</span> BACK TO TEAMS
          </Link>
        </div>
        
        <div className="text-center z-10 px-4">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter text-white drop-shadow-2xl">
            {team.name}
          </h1>
          <div className="mt-3 md:mt-4 text-xl md:text-2xl font-mono font-bold text-yellow-500 drop-shadow-md">
            TOTAL: {team.totalScore.toFixed(1)} pt
          </div>
        </div>
      </div>

      {/* 所属選手一覧 */}
      <div className="w-full max-w-5xl px-4 sm:px-6 py-10 md:py-16">
        <div className="mb-10 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-black italic tracking-wider text-yellow-500">
            PLAYERS
          </h2>
          <p className="text-gray-500 text-xs mt-1 tracking-[0.2em] uppercase font-bold">
            所属選手一覧
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {team.players.map((player) => (
            <div key={player.id} className="bg-[#111] border border-white/10 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-sm hover:border-white/30 transition-colors">
              <div className="min-w-0">
                <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-1">Player</div>
                <h3 className="text-xl md:text-2xl font-bold text-white tracking-wider truncate">{player.name}</h3>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-1">Personal Score</div>
                <div className="text-xl md:text-2xl font-mono font-bold text-white">{player.totalScore.toFixed(1)}</div>
              </div>
            </div>
          ))}
          
          {team.players.length === 0 && (
            <div className="col-span-full text-gray-500 py-10 font-bold tracking-widest text-center">
              NO PLAYERS REGISTERED.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}