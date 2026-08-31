import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

type ScheduleCreateInput = {
  title?: string;
};

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      where: { status: "SCHEDULED" },
      orderBy: { date: "asc" },
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

    const serialized = matches.map((match) => {
      const uniqueTeamCount = new Set(match.results.map((r) => r.player.teamId)).size;
      const isWindAssigned = match.results.length === 4 && match.results.every((r) => r.wind !== null);

      return {
        id: match.id,
        title: match.title,
        date: match.date,
        status: match.status,
        selectedTeamsCount: uniqueTeamCount,
        isWindAssigned,
        results: match.results.map((r) => ({
          id: r.id,
          playerId: r.playerId,
          playerName: r.player.name,
          teamId: r.player.teamId,
          teamName: r.player.team?.name ?? "",
          wind: r.wind,
        })),
      };
    });

    return NextResponse.json(serialized);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "次回予定の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const role = (session.user as any).role as "ADMIN" | "MANAGER" | undefined;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "日程作成は管理者のみ実行できます" }, { status: 403 });
    }

    const body = await req.json();

    const matches: ScheduleCreateInput[] = Array.isArray(body.matches)
      ? body.matches
      : [{ title: body.title }];

    if (matches.length === 0 || matches.length > 2) {
      return NextResponse.json({ error: "登録できる試合数は1〜2件です" }, { status: 400 });
    }

    const createdMatches = await prisma.$transaction(async (tx) => {
      const inserted = [];

      for (const match of matches) {
        const newMatch = await tx.match.create({
          data: {
            title: match.title || "次回 対戦カード",
            status: "SCHEDULED",
          },
        });

        inserted.push(newMatch);
      }

      return inserted;
    });

    return NextResponse.json(
      {
        message: `${createdMatches.length}件の次回予告を登録しました！`,
        matches: createdMatches,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "登録中にエラーが発生しました" }, { status: 500 });
  }
}