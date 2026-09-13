import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { CategoriaResumo } from "@/utils/regionalDashboard";

interface NotificationsByCategoryProps {
  data: CategoriaResumo[];
  total: number;
}

export default function NotificationsByCategory({
  data,
  total,
}: NotificationsByCategoryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribuição por categoria</Text>

      <View style={styles.card}>
        {data.length === 0 || total === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma notificação registrada.
          </Text>
        ) : (
          data.map((item) => {
            const porcentagem = (item.quantidade / total) * 100;

            return (
              <View key={item.categoria} style={styles.categoriaRow}>
                <View style={styles.header}>
                  <Text style={styles.categoria} numberOfLines={1}>
                    {item.categoria}
                  </Text>

                  <Text style={styles.porcentagem}>
                    {porcentagem.toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${porcentagem}%` },
                    ]}
                  />
                </View>

                <Text style={styles.quantidade}>
                  {item.quantidade}{" "}
                  {item.quantidade === 1
                    ? "notificação"
                    : "notificações"}
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

  categoriaRow: {
    marginBottom: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },

  categoria: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#17211E",
  },

  porcentagem: {
    fontSize: 15,
    fontWeight: "700",
    color: "#087F5B",
  },

  barContainer: {
    height: 8,
    backgroundColor: "#D7D5CE",
    borderRadius: 4,
    overflow: "hidden",
  },

  bar: {
    height: "100%",
    backgroundColor: "#087F5B",
    borderRadius: 4,
  },

  quantidade: {
    marginTop: 5,
    fontSize: 12,
    color: "#6B7280",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
    paddingVertical: 10,
  },
});