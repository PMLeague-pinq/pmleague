import { MobileOverview } from "../lib/api";
import { EmptyState, HistoryCard, MatchPreview, SectionHeader } from "../components/LeagueCards";

type MatchesTabProps = {
  overview: MobileOverview;
};

export function MatchesTab({ overview }: MatchesTabProps) {
  return (
    <>
      <SectionHeader title="Upcoming" subtitle="SCHEDULED" />
      {overview.scheduledMatches.length > 0 ? overview.scheduledMatches.map((match) => <MatchPreview key={match.id} match={match} />) : <EmptyState text="次回予定はまだありません" />}

      <SectionHeader title="History" subtitle="FINISHED" />
      {overview.finishedMatches.length > 0 ? overview.finishedMatches.map((match) => <HistoryCard key={match.id} match={match} />) : <EmptyState text="試合履歴がありません" />}
    </>
  );
}