import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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

    const rankedResults = [...normalizedResults].map((res, index) => ({
      ...res,
      originalIndex: index,
    })).sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      if (b.rawScore !== a.rawScore) {
        return b.rawScore - a.rawScore;
      }

      return a.originalIndex - b.originalIndex;
    });

    const match = await prisma.$transaction(async (tx) => {
      const newMatch = await tx.match.create({
        data: {
          title: typeof title === "string" && title.trim() ? title.trim() : "リーグ戦",
          status: "FINISHED",
        },
      });

      for (const [index, res] of rankedResults.entries()) {
        const player = await tx.player.findUnique({
          where: { id: res.playerId },
          select: { id: true, teamId: true },
        });

        if (!player) {
          throw new Error(`選手が見つかりません: ${res.playerId}`);
        }

        if (player.teamId !== res.teamId) {
          throw new Error("選手とチームの組み合わせが不正です");
        }

        await tx.matchResult.create({
          data: {
            matchId: newMatch.id,
            playerId: res.playerId,
            rawScore: res.rawScore,
            points: res.points,
            rank: index + 1,
          },
        });

        await tx.player.update({
          where: { id: res.playerId },
          data: { totalScore: { increment: res.points } },
        });

        await tx.team.update({
          where: { id: res.teamId },
          data: { totalScore: { increment: res.points } },
        });
      }

      return newMatch;
    });

    return NextResponse.json({ message: "試合結果を登録しました！", match }, { status: 201 });
  } catch (error) {
    console.error("match registration failed:", error);

    if (error instanceof Error && (error.message.includes("チームまたは選手が選択されていません") || error.message.includes("成績データが不正です") || error.message.includes("素点またはポイントが数値ではありません") || error.message.includes("4人分の成績を入力してください") || error.message.includes("選手が見つかりません") || error.message.includes("選手とチームの組み合わせが不正です"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "登録中にエラーが発生しました" }, { status: 500 });
  }
}