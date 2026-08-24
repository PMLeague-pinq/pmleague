import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "シーズン名は必須です" }, { status: 400 });
    }

    // 1. 現在の全チームと全選手のランキングデータを取得
    const teams = await prisma.team.findMany({ orderBy: { totalScore: 'desc' } });
    const players = await prisma.player.findMany({ 
      include: { team: true }, 
      orderBy: { totalScore: 'desc' } 
    });

    // データを丸ごと文字列（JSON）に変換して保存の準備
    const archiveData = JSON.stringify({ teams, players });

    // 2. トランザクション（以下の処理を一気に、かつ安全に実行する）
    await prisma.$transaction([
      // ① アーカイブ（金庫）に最終成績を保存
      prisma.seasonArchive.create({
        data: {
          title: title,
          data: archiveData,
        },
      }),
      // ② 全チームのスコアを 0 にリセット
      prisma.team.updateMany({ data: { totalScore: 0 } }),
      // ③ 全選手のスコアを 0 にリセット
      prisma.player.updateMany({ data: { totalScore: 0 } }),
      // ④ 過去の試合結果データ（詳細）をすべて削除
      prisma.matchResult.deleteMany({}),
      // ⑤ 過去の試合枠データをすべて削除
      prisma.match.deleteMany({}),
    ]);

    return NextResponse.json({ message: "シーズンを終了し、成績をアーカイブしました！" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "アーカイブ処理中にエラーが発生しました" }, { status: 500 });
  }
}