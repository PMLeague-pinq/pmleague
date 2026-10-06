import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { computeScoreDelta } from "@/lib/score-adjustment";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

function normalizeResult(res: any) {
  if (!res || typeof res !== "object") {
    throw new Error("成績データが不正です");
  }

  const teamId = String(res.teamId ?? "").trim();
  const playerId = String(res.playerId ?? "").trim();
  const rawScore = Number(res.rawScore);
  const points = Number(res.points);

  if (!teamId || !playerId) {
    throw new Error("チームまたは選手が選択されていません");
  }

  if (!Number.isFinite(rawScore) || !Number.isFinite(points)) {
    throw new Error("素点またはポイントが数値ではありません");
  }

  return {
    teamId,
    playerId,
    rawScore,
    points,
  };
}

function sortRankedResults<T extends { points: number; rawScore: number; playerId: string }>(results: T[]) {
  return [...results].map((res, index) => ({ ...res, originalIndex: index })).sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.rawScore !== a.rawScore) {
      return b.rawScore - a.rawScore;
    }

    return a.originalIndex - b.originalIndex;
  });
}

function serializeMatch(match: any) {
  return {
    id: match.id,
    title: match.title,
    date: match.date.toISOString(),
    status: match.status,
    results: match.results.map((result: any) => ({
      id: result.id,
      playerId: result.playerId,
      teamId: result.player.teamId,
      playerName: result.player.name,
      teamName: result.player.team?.name ?? "",
      rawScore: result.rawScore ?? 0,
      points: result.points ?? 0,
      rank: result.rank ?? null,
    })),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const matches = await prisma.match.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: [{ date: "desc" }, { id: "desc" }],
      include: {
        results: {
          orderBy: { rank: "asc" },
          include: {
            player: {
              include: { team: true },
            },
          },
        },
      },
    });

    return NextResponse.json(matches.map(serializeMatch));
  } catch (error) {
    console.error("failed to fetch matches", error);
    return NextResponse.json({ error: "試合一覧の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let payload: any;

    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "リクエストの形式が不正です" }, { status: 400 });
    }

    const { title, results } = payload;

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "成績データがありません" }, { status: 400 });
    }

    const normalizedResults = results.map(normalizeResult);

    if (normalizedResults.length !== 4) {
      return NextResponse.json({ error: "4人分の成績を入力してください" }, { status: 400 });
    }

    const rankedResults = sortRankedResults(normalizedResults);

    const newMatch = await prisma.match.create({
      data: {
        title: typeof title === "string" && title.trim() ? title.trim() : "リーグ戦",
        status: "FINISHED",
      },
    });

    for (const [index, res] of rankedResults.entries()) {
      const player = await prisma.player.findUnique({
        where: { id: res.playerId },
        select: { id: true, teamId: true },
      });

      if (!player) {
        throw new Error(`選手が見つかりません: ${res.playerId}`);
      }

      if (player.teamId !== res.teamId) {
        throw new Error("選手とチームの組み合わせが不正です");
      }

      await prisma.matchResult.create({
        data: {
          matchId: newMatch.id,
          playerId: res.playerId,
          rawScore: res.rawScore,
          points: res.points,
          rank: index + 1,
        },
      });

      const playerRecord = await prisma.player.findUnique({
        where: { id: res.playerId },
        select: { isPostSeason: true },
      });
      const teamRecord = await prisma.team.findUnique({
        where: { id: res.teamId },
        select: { isPostSeason: true },
      });

      await prisma.player.update({
        where: { id: res.playerId },
        data: playerRecord?.isPostSeason
          ? {
              totalScore: { increment: res.points },
              postSeasonTotalScore: { increment: res.points },
            }
          : {
              totalScore: { increment: res.points },
              regularTotalScore: { increment: res.points },
            },
      });

      await prisma.team.update({
        where: { id: res.teamId },
        data: teamRecord?.isPostSeason
          ? {
              totalScore: { increment: res.points },
              postSeasonTotalScore: { increment: res.points },
            }
          : {
              totalScore: { increment: res.points },
              regularTotalScore: { increment: res.points },
            },
      });
    }

    return NextResponse.json({ message: "試合結果を登録しました！", match: newMatch }, { status: 201 });
  } catch (error) {
    console.error("match registration failed:",
      error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    );

    if (error instanceof Error && (error.message.includes("チームまたは選手が選択されていません") || error.message.includes("成績データが不正です") || error.message.includes("素点またはポイントが数値ではありません") || error.message.includes("4人分の成績を入力してください") || error.message.includes("選手が見つかりません") || error.message.includes("選手とチームの組み合わせが不正です"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "登録中にエラーが発生しました" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = await req.json();
    const { matchId, title, results } = payload;

    if (!matchId || typeof matchId !== "string") {
      return NextResponse.json({ error: "対象の試合IDがありません" }, { status: 400 });
    }

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "成績データがありません" }, { status: 400 });
    }

    const existingMatch = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        results: {
          include: {
            player: { select: { teamId: true } },
          },
        },
      },
    });

    if (!existingMatch) {
      return NextResponse.json({ error: "編集対象の試合が見つかりません" }, { status: 404 });
    }

    const oldResults = existingMatch.results.map((result) => ({
      playerId: result.playerId,
      teamId: result.player.teamId,
      points: Number(result.points ?? 0),
    }));

    const normalizedResults = results.map(normalizeResult);
    if (normalizedResults.length !== 4) {
      return NextResponse.json({ error: "4人分の成績を入力してください" }, { status: 400 });
    }

    const rankedResults = sortRankedResults(normalizedResults);
    const delta = computeScoreDelta(oldResults, rankedResults.map((res) => ({
      playerId: res.playerId,
      teamId: res.teamId,
      points: Number(res.points ?? 0),
    })));

    await prisma.$transaction(async (tx) => {
      for (const [playerId, amount] of Object.entries(delta.players)) {
        if (Number(amount) === 0) continue;
        const playerRecord = await tx.player.findUnique({
          where: { id: playerId },
          select: { isPostSeason: true },
        });
        await tx.player.update({
          where: { id: playerId },
          data: playerRecord?.isPostSeason
            ? {
                totalScore: { increment: Number(amount) },
                postSeasonTotalScore: { increment: Number(amount) },
              }
            : {
                totalScore: { increment: Number(amount) },
                regularTotalScore: { increment: Number(amount) },
              },
        });
      }

      for (const [teamId, amount] of Object.entries(delta.teams)) {
        if (Number(amount) === 0) continue;
        const teamRecord = await tx.team.findUnique({
          where: { id: teamId },
          select: { isPostSeason: true },
        });
        await tx.team.update({
          where: { id: teamId },
          data: teamRecord?.isPostSeason
            ? {
                totalScore: { increment: Number(amount) },
                postSeasonTotalScore: { increment: Number(amount) },
              }
            : {
                totalScore: { increment: Number(amount) },
                regularTotalScore: { increment: Number(amount) },
              },
        });
      }

      await tx.matchResult.deleteMany({ where: { matchId } });
      await tx.match.update({
        where: { id: matchId },
        data: {
          title: typeof title === "string" && title.trim() ? title.trim() : existingMatch.title ?? "リーグ戦",
        },
      });

      await tx.matchResult.createMany({
        data: rankedResults.map((res, index) => ({
          matchId,
          playerId: res.playerId,
          rawScore: res.rawScore,
          points: res.points,
          rank: index + 1,
        })),
      });
    });

    return NextResponse.json({ message: "試合結果を更新しました。", matchId });
  } catch (error) {
    console.error("match update failed:", error);

    if (error instanceof Error && (error.message.includes("チームまたは選手が選択されていません") || error.message.includes("成績データが不正です") || error.message.includes("素点またはポイントが数値ではありません") || error.message.includes("4人分の成績を入力してください") || error.message.includes("選手が見つかりません") || error.message.includes("選手とチームの組み合わせが不正です"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "更新中にエラーが発生しました" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const payload = await req.json();
    const matchId = typeof payload?.matchId === "string" ? payload.matchId.trim() : "";

    if (!matchId) {
      return NextResponse.json({ error: "削除対象の試合IDがありません" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        results: {
          include: {
            player: { select: { teamId: true } },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "削除対象の試合が見つかりません" }, { status: 404 });
    }

    const oldResults = match.results.map((result) => ({
      playerId: result.playerId,
      teamId: result.player.teamId,
      points: Number(result.points ?? 0),
    }));
    const delta = computeScoreDelta(oldResults, []);

    await prisma.$transaction(async (tx) => {
      for (const [playerId, amount] of Object.entries(delta.players)) {
        if (Number(amount) === 0) continue;
        const playerRecord = await tx.player.findUnique({
          where: { id: playerId },
          select: { isPostSeason: true },
        });
        await tx.player.update({
          where: { id: playerId },
          data: playerRecord?.isPostSeason
            ? {
                totalScore: { increment: Number(amount) },
                postSeasonTotalScore: { increment: Number(amount) },
              }
            : {
                totalScore: { increment: Number(amount) },
                regularTotalScore: { increment: Number(amount) },
              },
        });
      }

      for (const [teamId, amount] of Object.entries(delta.teams)) {
        if (Number(amount) === 0) continue;
        const teamRecord = await tx.team.findUnique({
          where: { id: teamId },
          select: { isPostSeason: true },
        });
        await tx.team.update({
          where: { id: teamId },
          data: teamRecord?.isPostSeason
            ? {
                totalScore: { increment: Number(amount) },
                postSeasonTotalScore: { increment: Number(amount) },
              }
            : {
                totalScore: { increment: Number(amount) },
                regularTotalScore: { increment: Number(amount) },
              },
        });
      }

      await tx.matchResult.deleteMany({ where: { matchId } });
      await tx.match.delete({ where: { id: matchId } });
    });

    return NextResponse.json({ message: "試合結果を削除しました。" });
  } catch (error) {
    console.error("match delete failed:", error);
    return NextResponse.json({ error: "削除中にエラーが発生しました" }, { status: 500 });
  }
}
