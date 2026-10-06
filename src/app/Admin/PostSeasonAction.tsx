"use client";

import { useState } from "react";
import styles from "./Admin.module.css";

export function PostSeasonAction({ isSystemAdmin }: { isSystemAdmin: boolean }) {
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success" | "info"; text: string } | null>(null);

  if (!isSystemAdmin) {
    return null;
  }

  const handleStartPostSeason = async () => {
    if (!window.confirm("ポストシーズンを開始しますか？既存のシーズンデータを保護したまま、明示的に開始します。")) {
      return;
    }

    setIsStarting(true);
    setMessage({ type: "info", text: "ポストシーズンを開始しています..." });

    try {
      const res = await fetch("/api/post-season", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "ポストシーズンの開始に失敗しました");
      }

      setMessage({ type: "success", text: body.message || "ポストシーズンを開始しました。" });
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "ポストシーズンの開始中にエラーが発生しました";
      setMessage({ type: "error", text: messageText });
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className={styles.actionsBlock}>
      <div className={styles.actionsBar}>
        <button
          type="button"
          onClick={handleStartPostSeason}
          disabled={isStarting}
          className={styles.dangerButton}
        >
          {isStarting ? "処理中..." : "ポストシーズン開始"}
        </button>
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
    </div>
  );
}
