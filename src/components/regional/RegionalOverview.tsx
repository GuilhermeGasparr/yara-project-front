import React from "react";
import { View, Text, StyleSheet } from "react-native";

import RegionalStatCard from "./RegionalStatCard";

interface RegionalOverviewProps {
  total: number;
  emInvestigacao: number;
  confirmadas: number;
  municipiosAtivos: number;
}

export default function RegionalOverview({
  total,
  emInvestigacao,
  confirmadas,
  municipiosAtivos,
}: RegionalOverviewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Visão geral da Regional</Text>

      <View style={styles.row}>
        <RegionalStatCard
          title="Notificações"
          value={total}
          icon="bell"
        />

        <RegionalStatCard
          title="Em investigação"
          value={emInvestigacao}
          icon="search"
        />
      </View>

      <View style={styles.row}>
        <RegionalStatCard
          title="Confirmadas"
          value={confirmadas}
          icon="check-circle"
        />

        <RegionalStatCard
          title="Municípios ativos"
          value={municipiosAtivos}
          icon="map-pin"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#12372A",
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    marginHorizontal: -5,
  },
});