"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type Player = { id: string; name: string };
type Team = { id: string; name: string; color: string; players: Player[] };

export default function TeamEditPage() {
  const searchParams = useSearchParams();
  const preselectedTeamId = searchParams.get('teamId') || '';
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  // 編集用の入力データ
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('');
  // 常に5人分の枠を用意する（既存選手はID入り、空き枠はIDなし）
  const [players, setPlayers] = useState([
    { id: '', name: '' },
    { id: '', name: '' },
    { id: '', name: '' },
    { id: '', name: '' },
    { id: '', name: '' },
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // チーム一覧を取得（キャッシュを使わず常に最新を取得）
  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams', { cache: 'no-store' });
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error("チーム取得エラー", error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (!preselectedTeamId || teams.length === 0) return;

    const team = teams.find((t) => t.id === preselectedTeamId);
    if (!team) return;

    setSelectedTeamId(team.id);
    setTeamName(team.name);
    setTeamColor(team.color || '');
    const newPlayers = Array(5)
      .fill({ id: '', name: '' })
      .map((_, i) => {
        return team.players[i]
          ? { id: team.players[i].id, name: team.players[i].name }
          : { id: '', name: '' };
      });
    setPlayers(newPlayers);
  }, [preselectedTeamId, teams]);

  // 編集するチームを選んだ時の処理
  const handleSelectTeam = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value;
    setSelectedTeamId(teamId);
    setMessage({ type: '', text: '' });

    if (!teamId) {
      // 未選択に戻した場合
      setTeamName('');
      setTeamColor('');
      setPlayers([
        { id: '', name: '' },
        { id: '', name: '' },
        { id: '', name: '' },
        { id: '', name: '' },
        { id: '', name: '' },
      ]);
      return;
    }

    // 選ばれたチームのデータをフォームにセットする
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setTeamName(team.name);
      setTeamColor(team.color || '');
      
      // 最大5人分のデータ枠を作成する
      const newPlayers = Array(5).fill({ id: '', name: '' }).map((_, i) => {
        return team.players[i] ? { id: team.players[i].id, name: team.players[i].name } : { id: '', name: '' };
      });
      setPlayers(newPlayers);
    }
  };

  const handlePlayerNameChange = (index: number, newName: string) => {
    const newPlayers = [...players];
    newPlayers[index].name = newName;
    setPlayers(newPlayers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/teams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTeamId,
          name: teamName,
          color: teamColor,
          players: players,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'チーム情報を更新しました！' });
        fetchTeams(); // 一覧データを最新化
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '通信エラーが発生しました' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] p-4 md:p-6 text-white font-sans flex flex-col items-center">
      <div className="w-full max-w-2xl mt-8 md:mt-10">
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-8 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-yellow-500">
              EDIT TEAM
            </h1>
            <p className="text-gray-500 text-[10px] md:text-xs mt-1 tracking-[0.12em] md:tracking-[0.2em] uppercase font-bold">
              登録済みチームの編集
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

          {/* 編集するチームの選択 */}
          <div className="mb-6 sm:mb-8 p-4 bg-black/50 border border-yellow-600/30 rounded-sm">
            <label className="text-[10px] font-bold text-yellow-500 tracking-widest uppercase block mb-2">
              Select Team to Edit
            </label>
            <select
              value={selectedTeamId}
              onChange={handleSelectTeam}
              className="w-full bg-black border border-white/10 p-3 text-white focus:outline-none focus:border-yellow-500"
            >
              <option value="">編集するチームを選択してください...</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* チームが選ばれている時だけ入力フォームを表示 */}
          {selectedTeamId && (
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-yellow-500 tracking-widest uppercase border-b border-white/10 pb-2">Team Info</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 tracking-widest uppercase block">チーム名 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-black border border-white/10 p-3 text-white focus:outline-none focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 tracking-widest uppercase block">チームカラー</label>
                    <input
                      type="text"
                      value={teamColor}
                      onChange={(e) => setTeamColor(e.target.value)}
                      className="w-full bg-black border border-white/10 p-3 text-white focus:outline-none focus:border-yellow-500"
                      placeholder="例: #eab308 または ゴールド"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-sm font-bold text-yellow-500 tracking-widest uppercase border-b border-white/10 pb-2">Players</h2>
                <p className="text-xs text-gray-500">※名前を書き換えると更新されます。登録済みの選手を空欄に戻すと、その枠から外れて未登録になります（最大5名）。</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {players.map((player, index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-[10px] text-gray-400 tracking-widest uppercase flex justify-between">
                        <span>選手 {index + 1}</span>
                        {player.id && <span className="text-green-500 font-mono text-[8px]">登録済み</span>}
                        {!player.id && <span className="text-gray-600 font-mono text-[8px]">空き枠</span>}
                      </label>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                        className={`w-full bg-black border p-3 text-white focus:outline-none focus:border-yellow-500 ${player.id ? 'border-white/20' : 'border-white/5 border-dashed'}`}
                        placeholder={player.id ? "" : "（追加選手がいれば入力）"}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 text-black font-black italic py-4 transition-all tracking-widest mt-4"
              >
                {isLoading ? "UPDATING..." : "変更を保存する"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}