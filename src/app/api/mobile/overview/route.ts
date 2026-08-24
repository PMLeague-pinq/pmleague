import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

type RankingStats = {
  totalMatches: number;
  topCount: number;
  lastCount: number;
  avoidLastRate: number;
};

function sortResultsByPoints<T extends { points: number | null; rawScore: number | null; id: string }>(results: T[]) {
  return [...results].sort((a, b) => {
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
}

export async function GET() {
  try {
    const [teams, players, scheduledMatches, finishedMatches, latestArchive] = await Promise.all([
      prisma.team.findMany({
        orderBy: { totalScore: "desc" },
        include: {
          players: {
            orderBy: { totalScore: "desc" },
          },
        },
      }),
      prisma.player.findMany({
        include: {
          team: true,
          matchResults: true,
        },
        orderBy: { totalScore: "desc" },
      }),
      prisma.match.findMany({
        where: { status: "SCHEDULED" },
        orderBy: { date: "asc" },
        include: {
          results: {
            include: {
              player: {
                include: { team: true },
              },
            },
          },
        },
      }),
      prisma.match.findMany({
        where: { status: "FINISHED" },
        orderBy: { date: "desc" },
        include: {
          results: {
            include: {
              player: {
                include: { team: true },
              },
            },
          },
        },
      }),
      prisma.seasonArchive.findFirst({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const playerStatsMap = new Map<string, RankingStats>();

    players.forEach((player) => {
      playerStatsMap.set(player.id, {
        totalMatches: 0,
        topCount: 0,
        lastCount: 0,
        avoidLastRate: 0,
      });
    });

    const matchGroups = new Map<string, typeof players[number]["matchResults"]>();

    players.forEach((player) => {
      player.matchResults.forEach((result) => {
        const existingResults = matchGroups.get(result.matchId) ?? [];
        existingResults.push(result);
        matchGroups.set(result.matchId, existingResults);
      });
    });

    matchGroups.forEach((matchResults) => {
      const rankedResults = sortResultsByPoints(matchResults);

      rankedResults.forEach((result, index) => {
        const stats = playerStatsMap.get(result.playerId);

        if (!stats) {
          return;
        }

        stats.totalMatches += 1;

        if (index === 0) {
          stats.topCount += 1;
        }

        if (index === rankedResults.length - 1) {
          stats.lastCount += 1;
        }
      });
    });

    const playerRankings = players.map((player) => {
      const stats = playerStatsMap.get(player.id) ?? {
        totalMatches: 0,
        topCount: 0,
        lastCount: 0,
        avoidLastRate: 0,
      };

      return {
        id: player.id,
        name: player.name,
        totalScore: player.totalScore,
        teamId: player.teamId,
        teamName: player.team?.name ?? "",
        teamColor: player.team?.color ?? null,
        totalMatches: stats.totalMatches,
        topCount: stats.topCount,
        lastCount: stats.lastCount,
        avoidLastRate:
          stats.totalMatches > 0
            ? Number((((stats.totalMatches - stats.lastCount) / stats.totalMatches) * 100).toFixed(1))
            : 0,
      };
    });

    const teamRankings = teams.map((team) => ({
      id: team.id,
      name: team.name,
      color: team.color,
      totalScore: team.totalScore,
      playerCount: team.players.length,
      players: team.players.map((player) => ({
        id: player.id,
        name: player.name,
        totalScore: player.totalScore,
      })),
    }));

    const scheduled = scheduledMatches.map((match) => {
      const uniqueTeamCount = new Set(match.results.map((result) => result.player.teamId)).size;
      const isWindAssigned = match.results.length === 4 && match.results.every((result) => result.wind !== null);

      return {
        id: match.id,
        title: match.title,
        date: match.date,
        status: match.status,
        selectedTeamsCount: uniqueTeamCount,
        isWindAssigned,
        results: match.results.map((result) => ({
          id: result.id,
          playerId: result.playerId,
          playerName: result.player.name,
          teamId: result.player.teamId,
          teamName: result.player.team?.name ?? "",
          teamColor: result.player.team?.color ?? null,
          wind: result.wind,
        })),
      };
    });

    const finished = finishedMatches.map((match) => ({
      id: match.id,
      title: match.title,
      date: match.date,
      status: match.status,
      results: sortResultsByPoints(match.results).map((result) => ({
        id: result.id,
        playerId: result.playerId,
        playerName: result.player.name,
        teamId: result.player.teamId,
        teamName: result.player.team?.name ?? "",
        teamColor: result.player.team?.color ?? null,
        rawScore: result.rawScore,
        points: result.points,
        rank: result.rank,
      })),
    }));

    const latestArchiveSnapshot = latestArchive
      ? (() => {
          try {
            const parsed = JSON.parse(latestArchive.data) as {
              teams?: Array<{ id: string; name: string; totalScore: number }>;
              players?: Array<{
                id: string;
                name: string;
                totalScore: number;
                team?: { name?: string } | null;
              }>;
            };

            return {
              teams: Array.isArray(parsed.teams) ? parsed.teams : [],
              players: Array.isArray(parsed.players)
                ? parsed.players.map((player) => ({
                    id: player.id,
                    name: player.name,
                    totalScore: player.totalScore,
                    teamName: player.team?.name ?? "",
                  }))
                : [],
            };
          } catch {
            return null;
          }
        })()
      : null;

    return NextResponse.json({
      summary: {
        teamCount: teamRankings.length,
        playerCount: playerRankings.length,
        scheduledMatchCount: scheduled.length,
        finishedMatchCount: finished.length,
        latestArchiveTitle: latestArchive?.title ?? null,
      },
      teamRankings,
      playerRankings,
      scheduledMatches: scheduled,
      finishedMatches: finished,
      latestArchive: latestArchive
        ? {
            id: latestArchive.id,
            title: latestArchive.title,
            createdAt: latestArchive.createdAt,
            snapshot: latestArchiveSnapshot,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "モバイル向け概要データの取得に失敗しました" }, { status: 500 });
  }
}