import Link from 'next/link';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 常に最新のデータベース情報を取得する設定
export const revalidate = 0; 

export default async function TeamsPage() {
  // データベースから、全チームとそれに紐づく選手を一気に取得！
  const teams = await prisma.team.findMany({
    include: {
      players: true,
    },
    orderBy: {
      name: 'asc', // 名前順（後でトータルスコア順などに変更も可能です）
    },
  });

  return (
    <main className="min-h-screen bg-[#050505] p-4 md:p-6 text-white font-sans">
      <div className="max-w-6xl mx-auto mt-8 md:mt-10">
        
        {/* ヘッダー */}
        <div className="text-center mb-10 md:mb-16 border-b border-white/10 pb-5 md:pb-6">
          <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-yellow-500">
            TEAMS
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-2 tracking-[0.2em] md:tracking-[0.3em] uppercase font-bold">
            PMリーグ 参加チーム一覧
          </p>
        </div>

        {/* チーム一覧のグリッド表示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {teams.map((team) => (
            <Link
              href={`/Teams/${team.id}`}
              key={team.id}
              className="group block no-underline text-inherit focus:outline-none"
            >
              <div className="bg-[#111] border border-white/10 rounded-sm overflow-hidden transition-all duration-300 hover:border-yellow-500 hover:shadow-[0_0_30px_rgba(234,179,8,0.15)] hover:-translate-y-1 h-full flex flex-col">
                
                {/* チームカラーのトップライン（登録がなければゴールド） */}
                <div 
                  className="h-2 w-full transition-colors" 
                  style={{ backgroundColor: team.color || '#eab308' }}
                ></div>
                
                <div className="p-5 sm:p-8 flex-grow flex flex-col justify-center items-center text-center space-y-3 sm:space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-black italic tracking-wider text-white no-underline group-hover:text-yellow-500 transition-colors">
                    {team.name}
                  </h2>
                  <div className="text-gray-500 text-xs font-bold tracking-[0.2em] uppercase">
                    {team.players.length} PLAYERS
                  </div>
                  
                  {/* スコア表示（今は初期値の0.0 pt） */}
                  <div className="mt-4 pt-4 border-t border-white/10 w-full">
                    <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-1">Total Score</div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-yellow-500">
                      {team.totalScore.toFixed(1)} pt
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {teams.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-20 font-bold tracking-widest">
              NO TEAMS REGISTERED YET.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}