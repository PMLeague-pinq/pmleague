"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Player = { id: string; name: string };
type Team = { id: string; name: string; players: Player[] };

export default function ScoreInputPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchTitle, setMatchTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [results, setResults] = useState([
    { teamId: '', playerId: '', rawScore: '', points: '' },
    { teamId: '', playerId: '', rawScore: '', points: '' },
    { teamId: '', playerId: '', rawScore: '', points: '' },
    { teamId: '', playerId: '', rawScore: '', points: '' },
  ]);

  useEffect(() => {
    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => setTeams(data))
      .catch((err) => console.error("チーム取得エラー", err));
  }, []);

  const handleResultChange = (index: number, field: string, value: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    if (field === 'teamId') {
      newResults[index].playerId = '';
    }
    setResults(newResults);
  };

  // 🌟 ポイント自動計算ロジック（Mリーグルール基準）
  const calculatePoints = () => {
    setMessage({ type: '', text: '' });

    // 1. 全員の素点が入力されているかチェック
    if (results.some(r => r.rawScore === '')) {
      setMessage({ type: 'error', text: '4人全員の素点を入力してから計算してください。' });
      return;
    }

    // 2. 素点の合計が10万点かチェック（入力ミスの防止）
    const totalRawScore = results.reduce((sum, r) => sum + Number(r.rawScore), 0);
    if (totalRawScore !== 100000) {
      if (!window.confirm(`素点の合計が ${totalRawScore} 点です（通常は10万点）。このまま計算しますか？`)) {
        return;
      }
    }

    // 3. 計算処理
    const umas = [50.0, 10.0, -10.0, -30.0]; // トップ賞のオカ(+20)込みのウマ
    const scores = results.map(r => Number(r.rawScore)).sort((a, b) => b - a);
    const newResults = [...results];

    newResults.forEach((r, i) => {
      const score = Number(r.rawScore);
      
      // 同着判定（同じ点数の人が何位タイになるかを探す）
      const tieIndices: number[] = [];
      scores.forEach((s, idx) => {
        if (s === score) tieIndices.push(idx);
      });

      // 同着の場合はウマを分け合う（例：2着同点なら +10 と -10 を足して2で割る = 0）
      const avgUma = tieIndices.reduce((sum, idx) => sum + umas[idx], 0) / tieIndices.length;
      
      // ポイント計算： (素点 - 30000) / 1000 + ウマ
      const pt = (score - 30000) / 1000 + avgUma;
      
      newResults[i].points = pt.toFixed(1);
    });

    setResults(newResults);
    setMessage({ type: 'success', text: '順位とポイントを自動計算しました！' });
  };

  const totalPoints = results.reduce((sum, r) => sum + (parseFloat(r.points) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const isComplete = results.every(r => r.teamId && r.playerId && r.rawScore !== '' && r.points !== '');
    if (!isComplete) {
      setMessage({ type: 'error', text: '全員のチーム・選手・スコア・ポイントを入力してください。' });
      setIsLoading(false);
      return;
    }

    const normalizedResults = results.map((result) => ({
      teamId: result.teamId.trim(),
      playerId: result.playerId.trim(),
      rawScore: Number(result.rawScore),
      points: Number(result.points),
    }));

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: matchTitle.trim(),
          results: normalizedResults,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '試合結果を登録し、スコアを更新しました！' });
        setResults(results.map(r => ({ ...r, rawScore: '', points: '' })));
        setMatchTitle('');
      } else {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setMessage({ type: 'error', text: data.error || '登録に失敗しました' });
        } catch {
          setMessage({ type: 'error', text: text || '登録に失敗しました' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: '通信エラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] p-4 md:p-6 text-white font-sans flex flex-col items-center">
      <div className="w-full max-w-4xl mt-8 md:mt-10">
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-8 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-yellow-500">
              SCORE REGISTRATION
            </h1>
            <p className="text-gray-500 text-[10px] md:text-xs mt-1 tracking-[0.12em] md:tracking-[0.2em] uppercase font-bold">
              試合結果入力
            </p>
          </div>
          <Link href="/" className="text-xs md:text-sm text-gray-400 hover:text-yellow-500 transition-colors">
            トップへ戻る
          </Link>
        </div>

        {message.text && (
          <div className={`p-4 mb-6 rounded-sm border ${message.type === 'error' ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-green-900/50 border-green-500 text-green-200'}`}>
            {message.text}
          </div>
        )}

        <div className="bg-[#111] border border-white/10 p-5 sm:p-8 rounded-sm shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700"></div>

          <div className="mb-6 sm:mb-8">
            <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase block mb-2">試合名（任意）</label>
            <input
              type="text"
              value={matchTitle}
              onChange={(e) => setMatchTitle(e.target.value)}
              className="w-full max-w-md bg-black border border-white/10 p-3 text-white focus:outline-none focus:border-yellow-500"
              placeholder="例: 第1節 第1試合"
            />
          </div>

          <div className="space-y-4">
            {results.map((result, index) => {
              const selectedTeam = teams.find(t => t.id === result.teamId);
              return (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1.5fr_1.5fr] gap-4 bg-black/50 p-4 border border-white/5 rounded-sm">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Team</label>
                    <select
                      value={result.teamId}
                      onChange={(e) => handleResultChange(index, 'teamId', e.target.value)}
                      className="w-full bg-[#111] border border-white/10 p-2 text-white focus:outline-none focus:border-yellow-500"
                    >
                      <option value="">チームを選択</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Player</label>
                    <select
                      value={result.playerId}
                      onChange={(e) => handleResultChange(index, 'playerId', e.target.value)}
                      disabled={!result.teamId}
                      className="w-full bg-[#111] border border-white/10 p-2 text-white focus:outline-none focus:border-yellow-500 disabled:opacity-50"
                    >
                      <option value="">選手を選択</option>
                      {selectedTeam?.players.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Raw Score (素点)</label>
                    <input
                      type="number"
                      value={result.rawScore}
                      onChange={(e) => handleResultChange(index, 'rawScore', e.target.value)}
                      placeholder="例: 35000"
                      className="w-full bg-[#111] border border-white/10 p-2 text-white focus:outline-none focus:border-yellow-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">Points (pt)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={result.points}
                      onChange={(e) => handleResultChange(index, 'points', e.target.value)}
                      placeholder="自動計算"
                      className="w-full bg-[#111] border border-white/10 p-2 text-yellow-500 focus:outline-none focus:border-yellow-500 font-mono font-bold"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🌟 自動計算ボタンを追加 */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={calculatePoints}
              className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold py-3 px-6 rounded-sm transition-colors border border-white/10"
            >
              ポイントを自動計算する
            </button>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-between sm:items-center bg-black p-4 border border-white/10 rounded-sm">
            <div className="text-sm font-bold text-gray-400 tracking-widest uppercase">
              Total Points Check
            </div>
            <div className={`text-2xl font-mono font-bold ${Math.abs(totalPoints) < 0.1 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPoints.toFixed(1)} pt
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 text-black font-black italic py-4 transition-all tracking-widest mt-6"
          >
            {isLoading ? "SAVING..." : "試合結果を確定する"}
          </button>
        </div>
      </div>
    </main>
  );
}