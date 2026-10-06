import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const role = (session.user as any).role as "ADMIN" | "MANAGER" | undefined;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "管理者のみがポストシーズンを開始できます" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({ force: false }));
    const force = Boolean(body?.force);

    if (!force) {
      return NextResponse.json(
        { error: "シーズン途中のデータを破損しないよう、ポストシーズン開始は明示的に force: true を指定して実行してください。" },
        { status: 400 },
      );
    }

    const [teams, players] = await Promise.all([
      prisma.team.findMany({
        select: {
          id: true,
          totalScore: true,
          regularTotalScore: true,
          postSeasonTotalScore: true,
          isPostSeason: true,
        },
      }),
      prisma.player.findMany({
        select: {
          id: true,
          totalScore: true,
          regularTotalScore: true,
          postSeasonTotalScore: true,
          isPostSeason: true,
        },
      }),
    ]);

    const hasExistingSeasonData =
      teams.some((team) => team.regularTotalScore > 0 || team.postSeasonTotalScore > 0 || team.isPostSeason) ||
      players.some(
        (player) => player.regularTotalScore > 0 || player.postSeasonTotalScore > 0 || player.isPostSeason,
      );

    if (hasExistingSeasonData) {
      return NextResponse.json(
        {
          error:
            "既存のシーズン記録が検出されたため、シーズン途中のポストシーズン開始は中止しました。既存データを保持したまま新しいシーズンを始める場合は、データをバックアップしてから明示的に開始してください。",
        },
        { status: 409 },
      );
    }

    await prisma.$transaction([
      ...teams.map((team) =>
        prisma.team.update({
          where: { id: team.id },
          data: {
            regularTotalScore: team.totalScore,
            postSeasonTotalScore: 0,
            totalScore: team.totalScore / 2,
            isPostSeason: true,
          },
        }),
      ),
      ...players.map((player) =>
        prisma.player.update({
          where: { id: player.id },
          data: {
            regularTotalScore: player.totalScore,
            postSeasonTotalScore: 0,
            totalScore: player.totalScore / 2,
            isPostSeason: true,
          },
        }),
      ),
    ]);

    return NextResponse.json({ message: "ポストシーズンを開始しました。全チームのポイントが半分になりました。" });
  } catch (error) {
    console.error("post-season failure:", error);
    return NextResponse.json({ error: "ポストシーズンの開始に失敗しました" }, { status: 500 });
  }
}
