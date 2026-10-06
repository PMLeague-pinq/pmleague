import Link from "next/link";
import { auth } from "@/auth";
import { PostSeasonAction } from "./PostSeasonAction";
import styles from "./Admin.module.css";

type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  adminOnly?: boolean;
};

const adminNavItems: AdminNavItem[] = [
  {
    href: "/Admin/Scores",
    label: "Scores",
    description: "試合結果の入力とポイント計算",
  },
  {
    href: "/Admin/Schedule",
    label: "Schedule Register",
    description: "次以降の試合日程を登録",
  },
  {
    href: "/Admin/Teams",
    label: "Teams",
    description: "チームと選手の登録・編集",
  },
  {
    href: "/Admin/Archive",
    label: "Archive",
    description: "シーズン終了と成績保存",
  },
  {
    href: "/Admin/Users",
    label: "Users",
    description: "システム管理者向けユーザー管理",
    adminOnly: true,
  },
];

export default async function AdminRootPage() {
  const session = await auth();
  const isSystemAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>ADMIN HOME</h1>
          <p className={styles.subtitle}>運営メニューを選択してください</p>
        </div>

        <PostSeasonAction isSystemAdmin={isSystemAdmin} />

        <div className={styles.grid}>
          {adminNavItems
            .filter((item) => !item.adminOnly || isSystemAdmin)
            .map((item) => (
              <Link key={item.href} href={item.href} className={styles.card}>
                <span className={styles.cardTitle}>{item.label}</span>
                <span className={styles.cardDescription}>{item.description}</span>
              </Link>
            ))}
        </div>
      </div>
    </main>
  );
}