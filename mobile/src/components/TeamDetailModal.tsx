import { Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { TeamRosterList, EmptyState } from "./LeagueCards";

export type TeamDetail = {
  id: string;
  name: string;
  color: string | null;
  totalScore: number;
  playerCount: number;
  players: Array<{ id: string; name: string; totalScore: number }>;
};

type TeamDetailModalProps = {
  team: TeamDetail | null;
  onClose: () => void;
};

export function TeamDetailModal({ team, onClose }: TeamDetailModalProps) {
  return (
    <Modal visible={team !== null} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <View style={styles.handle} />
          {team ? (
            <>
              <View style={styles.header}>
                <View style={styles.titleWrap}>
                  <Text style={styles.title}>{team.name}</Text>
                  <Text style={styles.subtitle}>{team.playerCount} players / {team.totalScore.toFixed(1)}</Text>
                </View>
                <Pressable onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>Close</Text>
                </Pressable>
              </View>

              <View style={styles.rosterSection}>
                <Text style={styles.rosterLabel}>Roster</Text>
                <TeamRosterList players={team.players} />
              </View>
            </>
          ) : (
            <EmptyState text="チームが見つかりません" />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
    maxHeight: "88%",
  },
  handle: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 14,
  },
  header: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  titleWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  rosterSection: {
    gap: 12,
  },
  rosterLabel: {
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});