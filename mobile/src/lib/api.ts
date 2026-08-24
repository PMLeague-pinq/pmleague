import { Platform } from "react-native";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Platform.select({
    android: "http://10.0.2.2:3000",
    ios: "http://localhost:3000",
    web: "http://localhost:3000",
    default: "http://localhost:3000",
  }) as string);

export type MobileOverview = {
  summary: {
    teamCount: number;
    playerCount: number;
    scheduledMatchCount: number;
    finishedMatchCount: number;
    latestArchiveTitle: string | null;
  };
  teamRankings: Array<{
    id: string;
    name: string;
    color: string | null;
    totalScore: number;
    playerCount: number;
    players: Array<{
      id: string;
      name: string;
      totalScore: number;
    }>;
  }>;
  playerRankings: Array<{
    id: string;
    name: string;
    totalScore: number;
    teamId: string;
    teamName: string;
    teamColor: string | null;
    totalMatches: number;
    topCount: number;
    lastCount: number;
    avoidLastRate: number;
  }>;
  scheduledMatches: Array<{
    id: string;
    title: string | null;
    date: string;
    status: string;
    selectedTeamsCount: number;
    isWindAssigned: boolean;
    results: Array<{
      id: string;
      playerId: string;
      playerName: string;
      teamId: string;
      teamName: string;
      teamColor: string | null;
      wind: string | null;
    }>;
  }>;
  finishedMatches: Array<{
    id: string;
    title: string | null;
    date: string;
    status: string;
    results: Array<{
      id: string;
      playerId: string;
      playerName: string;
      teamId: string;
      teamName: string;
      teamColor: string | null;
      rawScore: number | null;
      points: number | null;
      rank: number | null;
    }>;
  }>;
  latestArchive: {
    id: string;
    title: string;
    createdAt: string;
    snapshot: {
      teams: Array<{
        id: string;
        name: string;
        totalScore: number;
      }>;
      players: Array<{
        id: string;
        name: string;
        totalScore: number;
        teamName: string;
      }>;
    } | null;
  } | null;
};

export async function fetchMobileOverview(signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/api/mobile/overview`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `HTTP ${response.status}`);
  }

  return (await response.json()) as MobileOverview;
}