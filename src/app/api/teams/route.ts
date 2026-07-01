import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🌟 これがビルドエラーを防ぐ最強の魔法です（必ずimportの直後に書きます）
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, color, playerNames } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "チーム名は必須です" }, { status: 400 });
    }

    // 既に同じチーム名がないかチェック
    const existingTeam = await prisma.team.findUnique({ where: { name } });
    if (existingTeam) {
      return NextResponse.json({ error: "このチーム名は既に登録されています" }, { status: 400 });
    }

    const normalizedPlayerNames = Array.isArray(playerNames)
      ? playerNames
          .map((pName: string) => pName.trim())
          .filter((pName: string) => pName !== "")
      : [];

    if (normalizedPlayerNames.length > 5) {
      return NextResponse.json({ error: "選手登録は最大5名までです" }, { status: 400 });
    }

    // チームと選手をまとめてデータベースに保存
    const team = await prisma.team.create({
      data: {
        name,
        color,
        players: {
          create: normalizedPlayerNames.map((pName: string, index: number) => ({
            name: pName,
            slotOrder: index + 1,
          })),
        },
      },
      include: {
        players: true,
      },
    });

    const sortedTeam = {
      ...team,
      players: [...team.players].sort((a, b) => a.slotOrder - b.slotOrder),
    };

    return NextResponse.json({ message: "チームと選手を登録しました！", team: sortedTeam }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "登録中にエラーが発生しました" }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 全チームと所属選手をデータベースから取得
    const teams = await prisma.team.findMany({
      include: {
        players: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(
      teams.map((team) => ({
        ...team,
        players: [...team.players].sort((a, b) => a.slotOrder - b.slotOrder),
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "チーム情報の取得に失敗しました" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, name, color, players } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ error: "チーム名とIDは必須です" }, { status: 400 });
    }

    if (!Array.isArray(players)) {
      return NextResponse.json({ error: "選手データの形式が不正です" }, { status: 400 });
    }

    const enteredPlayersCount = players.filter(
      (p: { id?: string; name?: string }) => (p.name || "").trim() !== ""
    ).length;

    if (enteredPlayersCount > 5) {
      return NextResponse.json({ error: "選手登録は最大5名までです" }, { status: 400 });
    }

    const normalizedPlayers = players.map((p: { id?: string; name?: string }) => ({
      id: (p.id || '').trim(),
      name: (p.name || '').trim(),
    }));

    const compactedPlayers = normalizedPlayers.filter((p) => p.name !== '');
    const playersToRemove = normalizedPlayers.filter((p) => p.id && p.name === '');

    if (playersToRemove.length > 0) {
      const removablePlayerIds = playersToRemove.map((p) => p.id);
      const playersWithMatchResults = await prisma.player.findMany({
        where: {
          id: { in: removablePlayerIds },
          matchResults: { some: {} },
        },
        select: { id: true, name: true },
      });

      if (playersWithMatchResults.length > 0) {
        return NextResponse.json({
          error: "試合結果がある選手は空欄に戻せません",
        }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.team.update({
        where: { id },
        data: { name, color },
      });

      for (const player of playersToRemove) {
        await tx.player.delete({
          where: { id: player.id },
        });
      }

      for (const [index, player] of compactedPlayers.entries()) {
        const slotOrder = index + 1;

        if (player.id) {
          await tx.player.update({
            where: { id: player.id },
            data: { name: player.name, slotOrder },
          });
        } else {
          await tx.player.create({
            data: {
              name: player.name,
              teamId: id,
              slotOrder,
            },
          });
        }
      }
    });

    return NextResponse.json({ message: "チーム情報を更新しました！" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "更新中にエラーが発生しました" }, { status: 500 });
  }
}