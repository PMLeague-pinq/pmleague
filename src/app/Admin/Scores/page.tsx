"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Player = { id: string; name: string; teamId?: string };
type Team = { id: string; name: string; players: Player[] };
type ResultRow = { teamId: string; playerId: string; rawScore: string; points: string };

const createEmptyRow = (): ResultRow => ({
  teamId: '',
  playerId: '',
  rawScore: '',
  points: '',
});

const normalizeName = (value: string) =>
  String(value ?? '').replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim();

export default function ScoreInputPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchTitle, setMatchTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string }>({
    type: 'info',
    text: '4人分の成績を入力してください。',
  });
  const [results, setResults] = useState<ResultRow[]>(Array.from({ length: 4 }, createEmptyRow));

  useEffect(() => {
    let mounted = true;

    fetch('/api/teams', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted || !Array.isArray(data)) {
          return;
        }

        const normalized = data.map((team) => ({
          ...team,
          name: normalizeName(team.name || ''),
          players: (team.players || []).map((player: Player) => ({
            ...player,
            name: normalizeName(player.name || ''),
          })),
        }));

        setTeams(normalized);
      })
      .catch((error) => {
        console.error('チーム取得エラー', error);
        setMessage({ type: 'error', text: 'チーム一覧の取得に失敗しました。ページを再読み込みしてください。' });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const teamMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);

  const updateResult = (index: number, field: keyof ResultRow, value: string) => {
    setResults((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        if (field === 'teamId') {
          return { ...row, teamId: value, playerId: '' };
        }

        return { ...row, [field]: value };
      })
    );
  };

  const calculatePoints = () => {
    const validRows = results.filter((row) => row.teamId && row.playerId && row.rawScore !== '');

    if (validRows.length === 0) {
      setMessage({ type: 'error', text: 'まずは4人分の素点を入力してください。' });
      return;
    }

    const rawScores = validRows
      .map((row) => ({ ...row, score: Number(row.rawScore) }))
      .filter((row) => Number.isFinite(row.score));

    if (rawScores.length !== 4) {
      setMessage({ type: 'error', text: '全員の素点は数値で入力してください。' });
      return;
    }

    const ordered = [...rawScores].sort((a, b) => Number(b.score) - Number(a.score));
    const umaTable = [50, 10, -10, -30];

    const nextResults = results.map((row) => {
      if (!row.teamId || !row.playerId || row.rawScore === '') {
        return row;
      }

      const score = Number(row.rawScore);
      if (!Number.isFinite(score)) {
        return row;
      }

      const rankIndex = ordered.findIndex((entry) => entry.teamId === row.teamId && entry.playerId === row.playerId);
      const uma = umaTable[rankIndex] ?? -30;
      const points = (score - 30000) / 1000 + uma;

      return { ...row, points: points.toFixed(1) };
    });

    setResults(nextResults);
    setMessage({ type: 'success', text: 'ポイントを自動計算しました。' });
  };

  const totalPoints = results.reduce((sum, row) => {
    const value = Number(row.points);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const validateFormResults = () => {
    const filled = results.filter((row) => row.teamId || row.playerId || row.rawScore || row.points);

    if (filled.length !== 4) {
      return '4人分の成績を入力してください。';
    }

    for (const row of results) {
      if (!row.teamId || !row.playerId || row.rawScore === '' || row.points === '') {
        return '各行でチーム・選手・素点・ポイントをすべて入力してください。';
      }
    }

    const playerIds = results.map((row) => row.playerId.trim());
    if (new Set(playerIds).size !== playerIds.length) {
      return '同じ選手が重複しています。別の選手を選んでください。';
    }

    for (const row of results) {
      if (!Number.isFinite(Number(row.rawScore)) || !Number.isFinite(Number(row.points))) {
        return '素点またはポイントが不正です。';
      }
    }

    for (const row of results) {
      const team = teamMap.get(row.teamId);
      if (!team) {
        return 'チーム情報が取得できませんでした。再読み込みしてから再試行してください。';
      }

      const player = team.players.find((entry) => entry.id === row.playerId);
      if (!player) {
        return '選手とチームの組み合わせが不正です。チームの選手一覧を確認してください。';
      }
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: 'info', text: '登録中です...' });

    const validationError = validateFormResults();
    if (validationError) {
      setIsLoading(false);
      setMessage({ type: 'error', text: validationError });
      return;
    }

    const payload = {
      title: matchTitle.trim() || '試合結果',
      results: results.map((row) => ({
        teamId: row.teamId,
        playerId: row.playerId,
        rawScore: Number(row.rawScore),
        points: Number(row.points),
      })),
    };

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || '登録に失敗しました');
      }

      setMessage({ type: 'success', text: '試合結果を登録しました。' });
      setMatchTitle('');
      setResults(Array.from({ length: 4 }, createEmptyRow));
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '登録中にエラーが発生しました';
      setMessage({ type: 'error', text: messageText });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] p-4 md:p-6 text-white font-sans flex flex-col items-center">
      <div className="w-full max-w-5xl mt-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-8 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-yellow-500">SCORE REGISTRATION</h1>
            <p className="text-gray-500 text-[10px] md:text-xs mt-1 tracking-[0.12em] md:tracking-[0.2em] uppercase font-bold">試合結果入力</p>
          </div>
          <Link href="/" className="text-xs md:text-sm text-gray-400 hover:text-yellow-500 transition-colors">トップへ戻る</Link>
        </div>

        {message.text && (
          <div
            className={`mb-6 rounded-sm border p-4 text-sm ${
              message.type === 'error'
                ? 'border-red-500 bg-red-900/30 text-red-100'
                : message.type === 'success'
                  ? 'border-green-500 bg-green-900/30 text-green-100'
                  : 'border-yellow-500 bg-yellow-900/20 text-yellow-100'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#111] border border-white/10 p-5 sm:p-8 rounded-sm shadow-2xl relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700" />

          <div className="mb-6 sm:mb-8">
            <label className="mb-2 block text-[10px] font-bold tracking-[0.18em] text-gray-400 uppercase">試合名（任意）</label>
            <input
              type="text"
              value={matchTitle}
              onChange={(event) => setMatchTitle(event.target.value)}
              placeholder="例: 第1節 第1試合"
              className="w-full max-w-md bg-black border border-white/10 p-3 text-white outline-none focus:border-yellow-500"
            />
          </div>

          <div className="space-y-4">
            {results.map((result, index) => {
              const selectedTeam = teams.find((team) => team.id === result.teamId);

              return (
                <div key={index} className="grid grid-cols-1 gap-4 rounded-sm border border-white/5 bg-black/50 p-4 md:grid-cols-[2fr_2fr_1.5fr_1.5fr]">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase text-gray-500">Team</label>
                    <select
                      value={result.teamId}
                      onChange={(event) => updateResult(index, 'teamId', event.target.value)}
                      className="w-full border border-white/10 bg-[#111] p-2 text-white outline-none focus:border-yellow-500"
                    >
                      <option value="">チームを選択</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] uppercase text-gray-500">Player</label>
                    <select
                      value={result.playerId}
                      onChange={(event) => updateResult(index, 'playerId', event.target.value)}
                      disabled={!result.teamId}
                      className="w-full border border-white/10 bg-[#111] p-2 text-white outline-none focus:border-yellow-500 disabled:opacity-50"
                    >
                      <option value="">選手を選択</option>
                      {(selectedTeam?.players ?? []).map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] uppercase text-gray-500">Raw Score</label>
                    <input
                      type="number"
                      value={result.rawScore}
                      onChange={(event) => updateResult(index, 'rawScore', event.target.value)}
                      placeholder="35000"
                      className="w-full border border-white/10 bg-[#111] p-2 text-white outline-none focus:border-yellow-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] uppercase text-gray-500">Points</label>
                    <input
                      type="number"
                      step="0.1"
                      value={result.points}
                      onChange={(event) => updateResult(index, 'points', event.target.value)}
                      placeholder="自動計算"
                      className="w-full border border-white/10 bg-[#111] p-2 text-yellow-400 outline-none focus:border-yellow-500 font-mono font-bold"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={calculatePoints}
              className="w-full rounded-sm border border-white/10 bg-zinc-800 px-6 py-3 text-sm font-bold text-white transition hover:bg-zinc-700 sm:w-auto"
            >
              ポイントを自動計算
            </button>
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-sm border border-white/10 bg-black p-4 sm:flex-row sm:items-center">
            <div className="text-sm font-bold tracking-[0.18em] text-gray-400 uppercase">Total Points Check</div>
            <div className={`font-mono text-2xl font-bold ${Math.abs(totalPoints) < 0.1 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPoints.toFixed(1)} pt
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full bg-yellow-500 px-4 py-4 text-base font-black italic tracking-[0.2em] text-black transition hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-300"
          >
            {isLoading ? 'SAVING...' : '試合結果を確定する'}
          </button>
        </form>
      </div>
    </main>
  );
}
