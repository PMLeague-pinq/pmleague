"use client";

import React, { useState } from 'react';
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn("credentials", {
        userId,
        password,
        redirect: false,
        callbackUrl: "/Admin",
      });

      if (!result?.ok || result?.error) {
        setError("IDまたはパスワードが正しくありません");
      } else {
        router.push("/Admin");
        router.refresh();
      }
    } catch (err) {
      setError("接続エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 text-white font-sans">
      {/* 背景の装飾用ロゴ */}
      <div className="fixed inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
        <span className="text-[20vw] font-black italic">PM</span>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* ヘッダー・ロゴ */}
        <div className="text-center mb-8 md:mb-10">
          <Link href="/" className="text-3xl sm:text-4xl font-black italic tracking-tighter text-gold-gradient no-underline">
            PM LEAGUE
          </Link>
          <p className="text-gray-500 text-[10px] md:text-xs mt-2 tracking-[0.2em] md:tracking-[0.3em] uppercase font-bold">
            Portal Login
          </p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-[#111] border border-white/10 p-5 sm:p-8 rounded-sm shadow-2xl relative overflow-hidden">
          {/* 上部の装飾ライン */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700"></div>

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm p-3 rounded-sm animate-pulse">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full bg-black border border-white/10 p-4 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                placeholder="IDを入力"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 p-4 text-white focus:outline-none focus:border-yellow-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 text-black font-black italic py-4 transition-all tracking-widest"
            >
              {isLoading ? "AUTHENTICATING..." : "LOGIN"}
            </button>
          </form>
          {/* ----- ログイン画面の </form> の直下に追加 ----- */}
          <div className="mt-6 text-center border-t border-white/10 pt-6">
             <p className="text-[10px] text-gray-500 tracking-widest mb-2">関係者（監督）の方はこちら</p>
             <Link href="/Register" className="text-xs text-yellow-600 hover:text-yellow-400 transition-colors tracking-widest uppercase font-bold">
               ▶ 新規アカウント登録 (要 招待コード)
             </Link>
          </div>
        </div>

        {/* フッターリンク */}
        <div className="mt-8 text-center text-xs text-gray-600">
          <p>© 2024 PM LEAGUE. All Rights Reserved.</p>
        </div>
      </div>
    </main>
  );
}