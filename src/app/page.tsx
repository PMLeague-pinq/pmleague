import Link from "next/link";
import { Prisma, PrismaClient } from "@prisma/client";
import styles from "./page.module.css";

const prisma = new PrismaClient();
export const revalidate = 0;

type NextMatchWithResults = Prisma.MatchGetPayload<{
  select: {
    id: true;
    date: true;
    title: true;
    status: true;
    results: {
      select: {
        id: true;
        matchId: true;
        playerId: true;
        wind: true;
        player: {
          select: {
            id: true;
            name: true;
            teamId: true;
            team: {
              select: {
                id: true;
                name: true;
                color: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export default async function Home() {
  let nextMatches: NextMatchWithResults[] = [];
  let topTeams: Awaited<ReturnType<typeof prisma.team.findMany>> = [];
  let finishedMatchCount = 0;

  try {
    nextMatches = await prisma.match.findMany({
      where: { status: "SCHEDULED" },
      orderBy: [{ date: "asc" }, { id: "asc" }],
      take: 2,
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

    topTeams = await prisma.team.findMany({
      orderBy: { totalScore: "desc" },
      take: 4,
    });

    finishedMatchCount = await prisma.match.count({
      where: { status: "FINISHED" },
    });
  } catch (error) {
    console.error("[home] Failed to load match/team data", error);
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      
      <section className={`${styles.mStripeBg} relative w-full min-h-[70svh] md:h-[80vh] flex flex-col items-center justify-center border-b border-yellow-600/30 overflow-hidden px-4`}>
        <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/111111/333333?text=KEY+VISUAL+IMAGE')] bg-cover bg-center bg-no-repeat opacity-20 mix-blend-luminosity scale-105 animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/80"></div>
        
        <div className={`${styles.fadeInUp} relative z-10 text-center flex flex-col items-center`}>
          <div className="w-1 h-24 bg-gradient-to-b from-yellow-300 to-yellow-700 transform rotate-45 mb-6"></div>
          
          <h1 className="text-5xl sm:text-6xl md:text-9xl font-black italic tracking-tighter drop-shadow-2xl leading-none">
            <span className="text-white">PM </span>
            <span className={styles.textGoldGradient}>LEAGUE</span>
          </h1>
          <p className="mt-4 md:mt-6 text-yellow-500 tracking-[0.3em] md:tracking-[0.5em] text-[11px] md:text-lg font-bold text-center">
            THE PREMIER MAHJONG STAGE
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-4 py-2 md:px-6 md:py-3 shadow-[0_0_24px_rgba(0,0,0,0.25)]">
            <span className="text-[10px] md:text-xs text-gray-500 tracking-[0.25em] uppercase font-bold">TOTAL MATCHES </span>
            <span className="text-xl md:text-3xl font-black italic text-white tracking-tight">{finishedMatchCount}</span>
            <span className="text-[10px] md:text-xs text-gray-500 tracking-[0.2em] uppercase font-bold"> FINISHED</span>
          </div>
        </div>
      </section>

      <div className={styles.mainContainer}>
        
        <section className={`${styles.sectionWrapper} ${styles.fadeInUp} ${styles.delay1}`}>
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black italic tracking-wider text-white">
              NEXT <span className="text-yellow-500">MATCH</span>
            </h2>
            <span className="text-xs text-yellow-600 tracking-[0.3em] uppercase mt-2 block">次回対戦カード</span>
          </div>

          {nextMatches.length > 0 ? (
            <div className="w-full max-w-5xl space-y-6">
              {nextMatches.map((nextMatch, matchIndex) => (
                <div key={nextMatch.id} className={`${styles.glowPanel} p-1 md:p-2 relative group`}>
                  <div className="bg-[#0a0a0a] p-5 sm:p-8 md:p-12">
                    <div className="text-center mb-10">
                      <div className="text-[10px] text-gray-500 tracking-[0.3em] uppercase mb-3">
                        Match {matchIndex + 1}
                      </div>
                      <div className="inline-block bg-yellow-500 text-black font-bold tracking-widest px-8 py-2 text-xl transform -skew-x-12">
                        <span className="block transform skew-x-12">{nextMatch.title}</span>
                      </div>
                    </div>

                    <div className={styles.matchGrid}>
                      {[...nextMatch.results].sort((a, b) => String(a.id).localeCompare(String(b.id))).map((res, i) => {
                        const winds = ["東", "南", "西", "北"];
                        const windColors = ["text-red-500", "text-blue-500", "text-green-500", "text-gray-400"];

                        return (
                          <div key={res.id} className="relative bg-[#111] p-4 md:p-6 text-center border border-white/5 hover:border-white/20 hover:bg-[#151515] transition-all flex flex-col items-center justify-center min-h-[160px] md:min-h-[200px]">
                            <div className="absolute inset-0 bg-[url('https://placehold.co/400x600/222222/444444?text=PLAYER')] bg-cover bg-center opacity-10 mix-blend-luminosity"></div>
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: res.player.team?.color || '#eab308' }}></div>

                            <div className="z-10 relative mt-auto">
                              <div className={`text-xl font-black italic ${windColors[i]} mb-2`}>{winds[i]}家</div>
                              <div className="text-xs text-gray-400 tracking-widest uppercase mb-1">{res.player.team?.name}</div>
                              <div className="text-2xl font-bold text-white tracking-wider">{res.player.name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`${styles.glowPanel} p-16 text-center max-w-3xl`}>
              <div className="text-gray-500 font-bold tracking-widest">次節の対戦カードは現在調整中です。</div>
            </div>
          )}
          
          <Link href="/Matches" className={styles.skewButton}>
            <span>試合一覧を見る</span>
          </Link>
        </section>

        <section className={`${styles.sectionWrapper} ${styles.fadeInUp} ${styles.delay2}`}>
           <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black italic tracking-wider text-white">
              TEAM <span className="text-yellow-500">STANDINGS</span>  
            </h2>
            <span className="text-xs text-yellow-600 tracking-[0.3em] uppercase mt-2 block">チームランキング速報</span>
          </div>
          
          <div className={styles.standingsWrapper}>
            {topTeams.map((team, index) => {
              const topTeamScore = topTeams[0]?.totalScore ?? 0;

              return (
                <div key={team.id} className="bg-[#111] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/20 p-4 md:p-6 transition-all relative overflow-hidden group m-ranking-row">
                  <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: team.color || '#eab308' }}></div>
                  
                  <div className="m-ranking-left gap-3 md:gap-6 flex-grow pr-4">
                    <div className="w-6 md:w-8 text-center font-black italic text-2xl md:text-4xl text-gray-700 group-hover:text-yellow-500 transition-colors shrink-0">{index + 1}</div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-black border border-white/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-[6px] md:text-[8px] text-gray-500">LOGO</span>
                    </div>
                    <div className="text-base md:text-xl font-bold tracking-wider truncate">{team.name}</div>
                  </div>

                  <div className="m-ranking-right gap-3 md:gap-8">
                    <div className={`text-xl md:text-3xl font-mono font-black italic w-20 md:w-28 text-right shrink-0 ${team.totalScore >= 0 ? 'text-white' : 'text-red-500'}`}>
                      {team.totalScore > 0 ? '+' : ''}{team.totalScore.toFixed(1)}
                    </div>
                    <div className="w-16 md:w-28 text-right shrink-0">
                      {index === 0 ? (
                        <span className="text-[10px] md:text-xs text-yellow-500 font-bold tracking-widest uppercase">　　--</span>
                      ) : (
                        <span className="text-[10px] md:text-xs text-gray-500 font-mono tracking-widest">
                           <span className="text-gray-400">　　{(team.totalScore - topTeamScore).toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/Rankings" className={styles.skewButton}>
            <span>ランキング詳細を見る</span>
          </Link>
        </section>

      </div>
    </main>
  );
}