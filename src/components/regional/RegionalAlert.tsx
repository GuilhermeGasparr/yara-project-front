import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";

interface RegionalAlertProps {
  emInvestigacao: number;
  municipiosEmInvestigacao: string[];
}

export default function RegionalAlert({
  emInvestigacao,
  municipiosEmInvestigacao,
}: RegionalAlertProps) {
  if (emInvestigacao === 0) {
    return (
      <View style={styles.container}>
        <Feather name="check-circle" size={22} color="#087F5B" />

        <View style={styles.content}>
          <Text style={styles.title}>Situação regional</Text>

          <Text style={styles.description}>
            Nenhuma notificação está em investigação no momento.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Feather name="alert-triangle" size={22} color="#D64545" />

      <View style={styles.content}>
        <Text style={styles.title}>Atenção regional</Text>

        <Text style={styles.description}>
          {emInvestigacao}{" "}
          {emInvestigacao === 1 ? "notificação está" : "notificações estão"} em
          investigação em {municipiosEmInvestigacao.length}{" "}
          {municipiosEmInvestigacao.length === 1 ? "município" : "municípios"}:
        </Text>

        <View style={styles.municipios}>
          {municipiosEmInvestigacao.map((municipio) => (
            <Text key={municipio} style={styles.municipio}>
              • {municipio}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FDECEC",

    borderLeftWidth: 3,
    borderLeftColor: "#E5484D",

    borderRadius: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },

  content: {
    flex: 1,
    marginLeft: 12,
  },
  municipios: {
    marginTop: 6,
    gap: 2,
  },

  municipio: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7A292D",
    fontWeight: "500",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#B4232A",
    marginBottom: 3,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7A292D",
  },
});
