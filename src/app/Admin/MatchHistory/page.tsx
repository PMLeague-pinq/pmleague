"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../Admin.module.css";

type MatchSummary = {
  id: string;
  title: string | null;
  date: string;
  results: Array<{
    id: string;
    playerName: string;
    teamName: string;
    rawScore: number;
    points: number;
    rank: number | null;
  }>;
};

export default function MatchHistoryPage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/matches?status=FINISHED", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("試合結果の取得に失敗しました");
      }

      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
      setMessage(null);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "試合結果の取得中にエラーが発生しました";
      setMessage({ type: "error", text: messageText });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatches().catch(() => undefined);
  }, []);

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm("この試合結果を削除しますか？個人成績とチーム成績も自動で調整されます。")) {
      return;
    }

    try {
      const res = await fetch("/api/matches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "削除に失敗しました");
      }

      setMessage({ type: "success", text: body.message || "試合結果を削除しました。" });
      await loadMatches();
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "削除中にエラーが発生しました";
      setMessage({ type: "error", text: messageText });
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>MATCH HISTORY</h1>
          <p className={styles.subtitle}>過去の試合結果を編集・削除</p>
        </div>

        {message && (
          <div
            className={[
              styles.statusMessage,
              message.type === "error"
                ? styles.statusError
                : message.type === "success"
                  ? styles.statusSuccess
                  : styles.statusInfo,
            ].join(" ")}
          >
            {message.text}
          </div>
        )}

        <div className={styles.historyPanel}>
          <div className={styles.historyHeader}>
            <div>
              <div className={styles.historyTitle}>MATCH HISTORY</div>
              <div className={styles.historySubtitle}>試合結果の編集・削除</div>
            </div>
            <span className={styles.historyCount}>{matches.length}件</span>
          </div>

          {isLoading ? (
            <div className={styles.emptyState}>読み込み中...</div>
          ) : matches.length === 0 ? (
            <div className={styles.emptyState}>過去の試合結果はまだありません。</div>
          ) : (
            <div className={styles.historyList}>
              {matches.map((match) => (
                <div key={match.id} className={styles.historyCard}>
                  <div className={styles.historyMeta}>
                    <div>
                      <div className={styles.historyDate}>{new Date(match.date).toLocaleDateString("ja-JP")}</div>
                      <div className={styles.historyMatchTitle}>{match.title || "試合結果"}</div>
                    </div>

                    <div className={styles.historyActions}>
                      <Link href={`/Admin/Scores?edit=${match.id}`} className={styles.secondaryButton}>
                        編集
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteMatch(match.id)}
                        className={styles.dangerTextButton}
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  <div className={styles.historyResultGrid}>
                    {match.results.map((result) => (
                      <div key={result.id} className={styles.historyResultItem}>
                        <div className={styles.resultRank}>{result.rank ?? "-"}位</div>
                        <div className={styles.resultName}>{result.playerName}</div>
                        <div className={styles.resultTeam}>{result.teamName}</div>
                        <div className={styles.resultPoints}>{result.points.toFixed(1)} pt</div>
                        <div className={styles.resultRaw}>素点 {result.rawScore.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
