import { colors } from "../theme";

export function formatScore(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

export function badgeColor(teamColor: string | null) {
  return teamColor ?? colors.accent;
}