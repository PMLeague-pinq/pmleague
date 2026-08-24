import { Pressable, View } from "react-native";
import { MobileOverview } from "../lib/api";
import { EmptyState, RankingRow, SectionHeader } from "../components/LeagueCards";
import { badgeColor, formatScore } from "../lib/format";

type RankingsTabProps = {
  overview: MobileOverview;
  onSelectTeam: (teamId: string) => void;
};

export function RankingsTab({ overview, onSelectTeam }: RankingsTabProps) {
  return (
    <>
      <SectionHeader title="Team Ranking" subtitle="チーム成績" />
      {overview.teamRankings.length > 0 ? (
        overview.teamRankings.map((team, index) => (
          <Pressable key={team.id} onPress={() => onSelectTeam(team.id)}>
            <RankingRow
              index={index}
              title={team.name}
              subtitle={`${team.playerCount} players`}
              value={formatScore(team.totalScore)}
              accent={badgeColor(team.color)}
            />
            <View style={{ height: 10 }} />
          </Pressable>
        ))
      ) : (
        <EmptyState text="チームデータがありません" />
      )}

      <SectionHeader title="Player Ranking" subtitle="個人成績" />
      {overview.playerRankings.length > 0 ? (
        overview.playerRankings.map((player, index) => (
          <View key={player.id} style={{ marginBottom: 10 }}>
            <RankingRow
              index={index}
              title={player.name}
              subtitle={`${player.teamName} / Top ${player.topCount} / Last ${player.lastCount}`}
              value={formatScore(player.totalScore)}
              accent={badgeColor(player.teamColor)}
            />
          </View>
        ))
      ) : (
        <EmptyState text="選手データがありません" />
      )}
    </>
  );
}