import { FlatList, StyleSheet, Text, View } from "react-native";
import { MobileOverview } from "../lib/api";
import { badgeColor, formatDate, formatScore } from "../lib/format";
import { colors } from "../theme";

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

export function StatCard({ label, value, tone }: { label: string; value: string; tone: "accent" | "neutral" | "soft" }) {
  return (
    <View style={[styles.statCard, tone === "accent" && styles.statAccent, tone === "soft" && styles.statSoft]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function HeroCard({
  title,
  subtitle,
  accent,
  rightLabel,
}: {
  title: string;
  subtitle: string;
  accent: string;
  rightLabel: string;
}) {
  return (
    <View style={styles.heroCard}>
      <View style={[styles.heroAccent, { backgroundColor: accent }]} />
      <View style={styles.heroBody}>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.heroTag}>{rightLabel}</Text>
      </View>
    </View>
  );
}

export function RankingRow({
  index,
  title,
  subtitle,
  value,
  accent,
}: {
  index: number;
  title: string;
  subtitle: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={styles.rowCard}>
      <View style={[styles.rowAccent, { backgroundColor: accent }]} />
      <View style={styles.rowContent}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowIndex}>{index + 1}</Text>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>{title}</Text>
            <Text style={styles.rowSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export function MatchPreview({ match }: { match: MobileOverview["scheduledMatches"][number] }) {
  return (
    <View style={styles.cardBlock}>
      <View style={styles.cardBlockHead}>
        <Text style={styles.cardBlockTitle}>{match.title ?? "次回 対戦カード"}</Text>
        <Text style={styles.cardBlockMeta}>{match.isWindAssigned ? "風確定" : `${match.selectedTeamsCount}/4 teams`}</Text>
      </View>
      <View style={styles.cardGrid}>
        {match.results.length > 0 ? (
          match.results.map((result) => (
            <View key={result.id} style={styles.playerCard}>
              <View style={[styles.playerAccent, { backgroundColor: badgeColor(result.teamColor) }]} />
              <Text style={styles.playerWind}>{result.wind ?? "--"}</Text>
              <Text style={styles.playerName}>{result.playerName}</Text>
              <Text style={styles.playerTeam}>{result.teamName}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyInline}>監督の出場選手提出を待っています。</Text>
        )}
      </View>
      <Text style={styles.cardFooter}>{formatDate(match.date)}</Text>
    </View>
  );
}

export function HistoryCard({ match }: { match: MobileOverview["finishedMatches"][number] }) {
  return (
    <View style={styles.cardBlock}>
      <View style={styles.cardBlockHead}>
        <Text style={styles.cardBlockTitle}>{match.title ?? "リーグ戦"}</Text>
        <Text style={styles.cardBlockMeta}>{formatDate(match.date)}</Text>
      </View>
      <View style={styles.historyList}>
        {match.results.map((result, index) => (
          <View key={result.id} style={styles.historyRow}>
            <View style={[styles.historyAccent, { backgroundColor: badgeColor(result.teamColor) }]} />
            <Text style={styles.historyRank}>{index + 1}</Text>
            <View style={styles.historyCenter}>
              <Text style={styles.historyTeam}>{result.teamName}</Text>
              <Text style={styles.historyName}>{result.playerName}</Text>
            </View>
            <View style={styles.historyScores}>
              <Text style={styles.historyRaw}>{result.rawScore?.toLocaleString() ?? "0"}</Text>
              <Text style={styles.historyPoint}>{formatScore(result.points ?? 0)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ArchivePreview({ archive }: { archive: NonNullable<MobileOverview["latestArchive"]> }) {
  const topTeam = archive.snapshot?.teams[0];
  const topPlayer = archive.snapshot?.players[0];

  return (
    <View style={styles.cardBlock}>
      <View style={styles.cardBlockHead}>
        <Text style={styles.cardBlockTitle}>{archive.title}</Text>
        <Text style={styles.cardBlockMeta}>ARCHIVE</Text>
      </View>
      <View style={styles.archiveBody}>
        <View style={styles.archiveRow}>
          <Text style={styles.archiveLabel}>Top Team</Text>
          <Text style={styles.archiveValue}>{topTeam ? `${topTeam.name} (${formatScore(topTeam.totalScore)})` : "-"}</Text>
        </View>
        <View style={styles.archiveRow}>
          <Text style={styles.archiveLabel}>Top Player</Text>
          <Text style={styles.archiveValue}>{topPlayer ? `${topPlayer.name} / ${topPlayer.teamName}` : "-"}</Text>
        </View>
      </View>
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function TeamRosterList({ players }: { players: Array<{ id: string; name: string; totalScore: number }> }) {
  return (
    <FlatList
      data={players}
      keyExtractor={(player) => player.id}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
      ListEmptyComponent={<EmptyState text="選手が登録されていません" />}
      renderItem={({ item, index }) => (
        <View style={styles.modalPlayerRow}>
          <Text style={styles.modalPlayerIndex}>{index + 1}</Text>
          <View style={styles.modalPlayerTextWrap}>
            <Text style={styles.modalPlayerName}>{item.name}</Text>
            <Text style={styles.modalPlayerScore}>{formatScore(item.totalScore)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingTop: 12,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    width: "48%",
    minHeight: 88,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    justifyContent: "space-between",
  },
  statAccent: {
    backgroundColor: "rgba(245,197,66,0.16)",
  },
  statSoft: {
    backgroundColor: colors.surfaceElevated,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  heroCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  heroAccent: {
    height: 4,
  },
  heroBody: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  heroTextWrap: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  heroTag: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    paddingTop: 2,
  },
  rowCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowAccent: {
    height: 3,
  },
  rowContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    gap: 12,
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowIndex: {
    width: 26,
    color: colors.muted,
    fontSize: 15,
    fontWeight: "900",
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  rowSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  rowValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  cardBlock: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 14,
  },
  cardBlockHead: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  cardBlockTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
  },
  cardBlockMeta: {
    color: colors.muted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardGrid: {
    padding: 14,
    gap: 10,
  },
  playerCard: {
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
    position: "relative",
  },
  playerAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  playerWind: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginLeft: 6,
  },
  playerName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 6,
  },
  playerTeam: {
    color: colors.muted,
    fontSize: 11,
    marginLeft: 6,
  },
  emptyInline: {
    color: colors.muted,
    textAlign: "center",
    paddingVertical: 14,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    color: colors.muted,
    fontSize: 11,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: "right",
  },
  historyList: {
    padding: 14,
    gap: 10,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    position: "relative",
  },
  historyAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  historyRank: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "900",
    width: 22,
    textAlign: "center",
    marginLeft: 4,
  },
  historyCenter: {
    flex: 1,
    minWidth: 0,
  },
  historyTeam: {
    color: colors.muted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  historyName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  historyScores: {
    alignItems: "flex-end",
  },
  historyRaw: {
    color: colors.muted,
    fontSize: 11,
  },
  historyPoint: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
  archiveBody: {
    padding: 14,
    gap: 10,
  },
  archiveRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 12,
    gap: 4,
  },
  archiveLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  archiveValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  modalSeparator: {
    height: 8,
  },
  modalPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalPlayerIndex: {
    width: 24,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "900",
  },
  modalPlayerTextWrap: {
    flex: 1,
  },
  modalPlayerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  modalPlayerScore: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
});