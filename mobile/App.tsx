import "react-native-gesture-handler";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, RefreshControl, SafeAreaView, ScrollView, StatusBar as RNStatusBar, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer, NavigationProp } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { fetchMobileOverview, MobileOverview } from "./src/lib/api";
import { colors } from "./src/theme";
import { OverviewTab } from "./src/screens/OverviewTab";
import { RankingsTab } from "./src/screens/RankingsTab";
import { MatchesTab } from "./src/screens/MatchesTab";
import { EmptyState } from "./src/components/LeagueCards";
import { TeamRosterList } from "./src/components/LeagueCards";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

type RootStackParamList = {
  Tabs: undefined;
  TeamDetail: { teamId: string };
};

type TeamDetailViewProps = {
  teamId: string;
  overview: MobileOverview;
  onClose: () => void;
};

function TeamDetailView({ teamId, overview, onClose }: TeamDetailViewProps) {
  const team = overview.teamRankings.find((item) => item.id === teamId) ?? null;

  return (
    <SafeAreaView style={styles.modalSafeArea}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.modalHeader}>
        <View style={styles.modalPill}>
          <Text style={styles.modalPillText}>TEAM DETAIL</Text>
        </View>
        <Pressable onPress={onClose} style={styles.modalCloseButton}>
          <Text style={styles.modalCloseText}>Close</Text>
        </Pressable>
      </View>

      {team ? (
        <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>{team.name}</Text>
          <Text style={styles.modalSubtitle}>{team.playerCount} players / {team.totalScore.toFixed(1)}</Text>

          <View style={styles.modalRosterSection}>
            <Text style={styles.modalRosterLabel}>Roster</Text>
            <TeamRosterList players={team.players} />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.modalEmptyWrap}>
          <EmptyState text="チームが見つかりません" />
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  const [overview, setOverview] = useState<MobileOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOverview = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    setErrorMessage(null);
    try {
      const data = await fetchMobileOverview();
      setOverview(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  const openWebPortal = async () => {
    await Linking.openURL("http://localhost:3000/Login");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <RNStatusBar barStyle="light-content" backgroundColor={colors.background} />
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>WEB SITE REMAINS</Text>
            </View>
            <Pressable onPress={() => void openWebPortal()} style={styles.webButton}>
              <Text style={styles.webButtonText}>Open Web</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>PM LEAGUE</Text>
          <Text style={styles.subtitle}>Expo app edition for rankings, matches, and team data. Login and admin flows stay on the web portal.</Text>
        </View>

        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Loading league data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <RNStatusBar barStyle="light-content" backgroundColor={colors.background} />
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>WEB SITE REMAINS</Text>
          </View>
          <Pressable onPress={() => void openWebPortal()} style={styles.webButton}>
            <Text style={styles.webButtonText}>Open Web</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>PM LEAGUE</Text>
        <Text style={styles.subtitle}>Expo app edition for rankings, matches, and team data. Login and admin flows stay on the web portal.</Text>
      </View>

      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Tabs" options={{ headerShown: false }}>
            {() => (
              <Tab.Navigator
                initialRouteName="Overview"
                screenOptions={({ route }) => ({
                  headerShown: false,
                  tabBarActiveTintColor: colors.accent,
                  tabBarInactiveTintColor: colors.muted,
                  tabBarStyle: styles.tabBar,
                  tabBarLabelStyle: styles.tabLabel,
                  tabBarIcon: ({ color, size }) => {
                    const iconName =
                      route.name === "Overview"
                        ? "grid-outline"
                        : route.name === "Rankings"
                          ? "trophy-outline"
                          : "calendar-outline";

                    return <Ionicons name={iconName} size={size ?? 20} color={color} />;
                  },
                })}
              >
                <Tab.Screen name="Overview">
                  {() => (
                    <ScrollView
                      style={styles.container}
                      contentContainerStyle={styles.content}
                      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadOverview(true)} tintColor={colors.accent} />}
                    >
                      {errorMessage ? (
                        <View style={styles.errorCard}>
                          <Text style={styles.errorTitle}>データ取得エラー</Text>
                          <Text style={styles.errorBody}>{errorMessage}</Text>
                          <Pressable onPress={() => void loadOverview()} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>RETRY</Text>
                          </Pressable>
                        </View>
                      ) : overview ? (
                        <OverviewTab overview={overview} />
                      ) : (
                        <EmptyState text="データがありません" />
                      )}

                      <View style={styles.footerNote}>
                        <Text style={styles.footerNoteText}>Latest archive: {overview?.latestArchive?.title ?? "none"}</Text>
                      </View>
                    </ScrollView>
                  )}
                </Tab.Screen>

                <Tab.Screen name="Rankings">
                  {({ navigation }) => (
                    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadOverview(true)} tintColor={colors.accent} />}>
                      {errorMessage ? (
                        <View style={styles.errorCard}>
                          <Text style={styles.errorTitle}>データ取得エラー</Text>
                          <Text style={styles.errorBody}>{errorMessage}</Text>
                          <Pressable onPress={() => void loadOverview()} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>RETRY</Text>
                          </Pressable>
                        </View>
                      ) : overview ? (
                        <RankingsTab
                          overview={overview}
                          onSelectTeam={(teamId) => {
                            const parentNavigation = navigation.getParent() as NavigationProp<RootStackParamList> | undefined;
                            if (parentNavigation) {
                              parentNavigation.navigate("TeamDetail", { teamId });
                            }
                          }}
                        />
                      ) : (
                        <EmptyState text="データがありません" />
                      )}
                    </ScrollView>
                  )}
                </Tab.Screen>

                <Tab.Screen name="Matches">
                  {() => (
                    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void loadOverview(true)} tintColor={colors.accent} />}>
                      {errorMessage ? (
                        <View style={styles.errorCard}>
                          <Text style={styles.errorTitle}>データ取得エラー</Text>
                          <Text style={styles.errorBody}>{errorMessage}</Text>
                          <Pressable onPress={() => void loadOverview()} style={styles.retryButton}>
                            <Text style={styles.retryButtonText}>RETRY</Text>
                          </Pressable>
                        </View>
                      ) : overview ? (
                        <MatchesTab overview={overview} />
                      ) : (
                        <EmptyState text="データがありません" />
                      )}
                    </ScrollView>
                  )}
                </Tab.Screen>
              </Tab.Navigator>
            )}
          </Stack.Screen>

          <Stack.Screen
            name="TeamDetail"
            options={{
              presentation: "modal",
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            {({ route, navigation }) => (
              <TeamDetailView
                teamId={route.params.teamId}
                overview={overview!}
                onClose={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 20,
    gap: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerPillText: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },
  webButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.35)",
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  webButtonText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    paddingBottom: 18,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 66,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  tabButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButtonActive: {
    backgroundColor: colors.accentSoft,
    borderColor: "rgba(245,197,66,0.35)",
  },
  tabButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  tabTextActive: {
    color: colors.accent,
  },
  loadingWrap: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
  },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
    backgroundColor: "rgba(248,113,113,0.08)",
    padding: 16,
    gap: 10,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "900",
  },
  errorBody: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  retryButtonText: {
    color: colors.background,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footerNote: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  footerNoteText: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  modalPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalPillText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  modalCloseButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  modalBody: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  modalRosterSection: {
    gap: 12,
  },
  modalRosterLabel: {
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  modalEmptyWrap: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
});
