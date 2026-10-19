import React from "react";
import { View, Text, StyleSheet } from "react-native";
import RegionalStatCard from "./RegionalStatCard"; // Ou o componente menor equivalente se preferir

interface RegionalOverviewProps {
  total: number;
  emInvestigacao: number;
  veridicos: number;
  municipiosAtivos: number;
}

export default function RegionalOverview({
  total,
  emInvestigacao,
  veridicos,
  municipiosAtivos,
}: RegionalOverviewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visão geral da Regional</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <RegionalStatCard title="Total notif." value={total} />
        </View>

        <View style={styles.statItem}>
          <RegionalStatCard title="Em investigação" value={emInvestigacao} />
        </View>

        <View style={styles.statItem}>
          <RegionalStatCard title="Verídicas" value={veridicos} />
        </View>

        <View style={styles.statItem}>
          <RegionalStatCard title="Municípios ativos" value={municipiosAtivos} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#50756B",
    textTransform: "uppercase",
    marginBottom: 10,
    letterSpacing: 0.6,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },

  statItem: {
    width: "31%",
    flexGrow: 1,
  },
});