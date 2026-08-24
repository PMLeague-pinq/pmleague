import { MobileOverview } from "../lib/api";
import { ArchivePreview, EmptyState, HeroCard, MatchPreview, SectionHeader, StatCard } from "../components/LeagueCards";
import { badgeColor, formatScore } from "../lib/format";

type OverviewTabProps = {
  overview: MobileOverview;
};

export function OverviewTab({ overview }: OverviewTabProps) {
  const topTeam = overview.teamRankings[0];
  const topPlayer = overview.playerRankings[0];

  return (
    <>
      <StatGrid overview={overview} />

      <SectionHeader title="Top Team" subtitle="現在の首位チーム" />
      {topTeam ? (
        <HeroCard
          title={topTeam.name}
          subtitle={`Score ${formatScore(topTeam.totalScore)} / ${topTeam.playerCount} players`}
          accent={badgeColor(topTeam.color)}
          rightLabel="Leader"
        />
      ) : (
        <EmptyState text="チームデータがありません" />
      )}

      <SectionHeader title="Top Player" subtitle="現在の個人首位" />
      {topPlayer ? (
        <HeroCard
          title={topPlayer.name}
          subtitle={`${topPlayer.teamName} / ${formatScore(topPlayer.totalScore)}`}
          accent={badgeColor(topPlayer.teamColor)}
          rightLabel={`${topPlayer.topCount} wins`}
        />
      ) : (
        <EmptyState text="選手データがありません" />
      )}

      <SectionHeader title="Next Match" subtitle="次回対戦カード" />
      {overview.scheduledMatches[0] ? <MatchPreview match={overview.scheduledMatches[0]} /> : <EmptyState text="次回予定はまだありません" />}

      <SectionHeader title="Latest Archive" subtitle="最後のシーズン保存" />
      {overview.latestArchive?.snapshot ? <ArchivePreview archive={overview.latestArchive} /> : <EmptyState text="アーカイブがまだありません" />}
    </>
  );
}

function StatGrid({ overview }: OverviewTabProps) {
  return (
    <>
      <SectionHeader title="Summary" subtitle="リーグ全体" />
      <StatRow overview={overview} />
    </>
  );
}

function StatRow({ overview }: OverviewTabProps) {
  return (
    <>
      <StatCard label="Teams" value={String(overview.summary.teamCount)} tone="accent" />
      <StatCard label="Players" value={String(overview.summary.playerCount)} tone="neutral" />
      <StatCard label="Scheduled" value={String(overview.summary.scheduledMatchCount)} tone="soft" />
      <StatCard label="Finished" value={String(overview.summary.finishedMatchCount)} tone="soft" />
    </>
  );
}