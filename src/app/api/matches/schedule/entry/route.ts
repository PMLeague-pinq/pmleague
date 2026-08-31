import { NextResponse } from "next/server";
import { PrismaClient, Wind } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

function shuffle<T>(array: T[]): T[] {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

async function assignWindsIfReady(matchId: string) {
  const current = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      results: {
        include: {
          player: {
            select: {
              id: true,
              name: true,
              teamId: true,
            },
          },
        },
      },
    },
  });

  if (!current || current.status !== "SCHEDULED") {
    return;
  }

  const uniqueTeamIds = Array.from(new Set(current.results.map((r) => r.player.teamId)));

  // 4チーム分の選出が揃った時点で方角抽選を行う
  if (current.results.length !== 4 || uniqueTeamIds.length !== 4) {
    return;
  }

  if (current.results.every((r) => r.wind !== null)) {
    return;
  }

  const winds = shuffle<Wind>(["EAST", "SOUTH", "WEST", "NORTH"]);

  await prisma.$transaction(
    current.results.map((result, index) =>
      prisma.matchResult.update({
        where: { id: result.id },
        data: { wind: winds[index] },
      })
    )
  );
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const role = (session.user as any).role as "ADMIN" | "MANAGER" | undefined;
    const teamId = (session.user as any).teamId as string | null | undefined;

    if (role !== "MANAGER") {
      return NextResponse.json({ error: "この操作は監督のみ実行できます" }, { status: 403 });
    }

    if (!teamId) {
      return NextResponse.json({ error: "監督アカウントに所属チームが設定されていません" }, { status: 400 });
    }

    const body = await req.json();
    const matchId = String(body.matchId || "").trim();
    const playerId = String(body.playerId || "").trim();

    if (!matchId || !playerId) {
      return NextResponse.json({ error: "試合と出場選手の指定が必要です" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match || match.status !== "SCHEDULED") {
      return NextResponse.json({ error: "選択できる試合が見つかりません" }, { status: 404 });
    }

    const selectedPlayer = await prisma.player.findUnique({
      where: { id: playerId },
      select: { id: true, teamId: true },
    });

    if (!selectedPlayer) {
      return NextResponse.json({ error: "選手が見つかりません" }, { status: 404 });
    }

    if (selectedPlayer.teamId !== teamId) {
      return NextResponse.json({ error: "自チームの選手のみ選択できます" }, { status: 403 });
    }

    const teamExisting = await prisma.matchResult.findFirst({
      where: {
        matchId,
        player: { teamId },
      },
      select: { id: true },
    });

    const otherTeamUsingSlot = await prisma.matchResult.findFirst({
      where: {
        matchId,
        player: { teamId: { not: teamId } },
        wind: null,
      },
      select: { id: true },
    });

    // すでに確定抽選済み（windあり）が進んだ試合では再選択不可
    const windLocked = await prisma.matchResult.findFirst({
      where: {
        matchId,
        wind: { not: null },
      },
      select: { id: true },
    });

    if (windLocked) {
      return NextResponse.json({ error: "この試合はすでに方角抽選が完了しています" }, { status: 400 });
    }

    if (!teamExisting && otherTeamUsingSlot) {
      // 他チームが既に4枠を埋めているケースの保険
      const totalCount = await prisma.matchResult.count({ where: { matchId } });
      if (totalCount >= 4) {
        return NextResponse.json({ error: "この試合の出場枠はすでに埋まっています" }, { status: 400 });
      }
    }

    if (teamExisting) {
      await prisma.matchResult.update({
        where: { id: teamExisting.id },
        data: { playerId },
      });
    } else {
      await prisma.matchResult.create({
        data: {
          matchId,
          playerId,
        },
      });
    }

    await assignWindsIfReady(matchId);

    return NextResponse.json({ message: "出場選手を登録しました" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "登録中にエラーが発生しました" }, { status: 500 });
  }
}
