import { auth, signOut } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. サーバー側でログイン状態を厳密にチェック
  const session = await auth();

  // 2. もしログイン情報が空っぽなら、問答無用でログイン画面へ蹴り返す
  if (!session?.user) {
    redirect("/Login");
  }

  const role = (session.user as any).role as "ADMIN" | "MANAGER" | undefined;

  const commonLinks = [
    { href: "/Admin", label: "ホーム" },
    { href: "/Admin/Scores", label: "結果入力" },
    { href: "/Admin/MatchHistory", label: "試合履歴" },
    { href: "/Admin/PostSeason", label: "ポストシーズン" },
    { href: "/Admin/Schedule", label: "試合日程" },
    { href: "/Admin/Teams", label: "チーム管理" },
    { href: "/Admin/Archive", label: "アーカイブ" },
  ];

  const adminOnlyLinks = [{ href: "/Admin/Users", label: "ユーザー管理" }];

  // 3. ログインしている場合は、ヘッダー付きで画面を表示する
  return (
    <div>
      {/* 🌟 証拠提出用ヘッダー：ここに名前が出たらログイン状態です！ */}
      <div className="bg-zinc-950 border-b border-yellow-600/30 p-3 flex justify-between items-center text-sm z-50 relative">
        <div className="text-gray-400 font-bold tracking-widest">
          ADMIN PANEL <span className="mx-2">|</span> 
          <span className="text-yellow-500">{session.user.name || "名無し"}</span> 監督としてログイン中
        </div>
        
        {/* 強制ログアウトボタン */}
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/Login" });
          }}
        >
          <button className="bg-red-900/30 hover:bg-red-900 text-red-500 hover:text-red-200 text-xs px-4 py-2 rounded-sm transition-colors border border-red-900">
            ログアウトして退出
          </button>
        </form>
      </div>

      <div className="bg-black/80 border-b border-white/10 px-3 sm:px-4 py-2 flex flex-wrap gap-2">
        {commonLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-[11px] sm:text-xs tracking-widest uppercase px-3 py-1.5 border border-white/15 text-gray-300 hover:text-yellow-400 hover:border-yellow-500 transition-colors"
          >
            {item.label}
          </Link>
        ))}

        {role === "ADMIN" &&
          adminOnlyLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[11px] sm:text-xs tracking-widest uppercase px-3 py-1.5 border border-red-500/40 text-red-300 hover:text-red-100 hover:bg-red-500/20 transition-colors"
            >
              {item.label}
            </Link>
          ))}
      </div>

      {/* スコア入力画面やチーム登録画面の中身がここに入ります */}
      {children}
    </div>
  );
}