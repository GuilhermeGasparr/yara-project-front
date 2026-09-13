import React from "react";
import { View, Text, StyleSheet } from "react-native";

import type { MunicipioResumo } from "@/utils/regionalDashboard";

interface NotificationsByMunicipioProps {
  data: MunicipioResumo[];
}

export default function NotificationsByMunicipio({
  data,
}: NotificationsByMunicipioProps) {
  const municipios = data.slice(0, 5);

  const maiorQuantidade = Math.max(
    ...municipios.map((item) => item.quantidade),
    1
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Municípios com maior atividade
      </Text>

      <View style={styles.card}>
        {municipios.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma notificação registrada.
          </Text>
        ) : (
          municipios.map((item) => {
            const larguraBarra =
              (item.quantidade / maiorQuantidade) * 100;

            return (
              <View
                key={item.municipio}
                style={styles.municipioRow}
              >
                <Text
                  style={styles.municipio}
                  numberOfLines={1}
                >
                  {item.municipio}
                </Text>

                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${larguraBarra}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.quantidade}>
                  {item.quantidade}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#50756B",
    textTransform: "uppercase",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,

    borderWidth: 1,
    borderColor: "#D9E7E3",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,

    elevation: 2,
  },

  municipioRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 34,
  },

  municipio: {
    width: 100,
    fontSize: 15,
    color: "#17211E",
  },

  barContainer: {
    flex: 1,
    height: 7,
    backgroundColor: "#D7D5CE",
    borderRadius: 4,
    overflow: "hidden",
    marginHorizontal: 10,
  },

  bar: {
    height: "100%",
    backgroundColor: "#087F5B",
    borderRadius: 4,
  },

  quantidade: {
    width: 28,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "600",
    color: "#087F5B",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
    paddingVertical: 10,
  },
}); 