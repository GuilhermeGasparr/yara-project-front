import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import type { CategoriaResumo } from "@/utils/regionalDashboard";

interface NotificationsByCategoryProps {
  data: CategoriaResumo[];
  total: number;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function NotificationsByCategory({
  data,
  total,
}: NotificationsByCategoryProps) {
  // Transforma os dados do dashboard para o formato aceito pelo BarChart do gifted-charts
  const chartData = data.map((item) => {
    const porcentagem = total > 0 ? (item.quantidade / total) * 100 : 0;

    return {
      value: Number(porcentagem.toFixed(1)), // Valor para o eixo Y (%)
      // Encurta nomes muito longos no eixo X para evitar sobreposição (opcional, ajustável)
      label: item.categoria.length > 8 
        ? `${item.categoria.substring(0, 7)}...` 
        : item.categoria,
      fullLabel: item.categoria, // Mantém o nome completo para tooltips/legendas se necessário
      frontColor: "#087F5B",
      topLabelComponent: () => (
        <Text style={{ color: "#087F5B", fontSize: 10, fontWeight: "700", marginBottom: 4 }}>
          {porcentagem.toFixed(0)}%
        </Text>
      ),
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Distribuição por categoria</Text>

      <View style={styles.card}>
        {data.length === 0 || total === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma notificação registrada.
          </Text>
        ) : (
          <View style={styles.chartWrapper}>
            <BarChart
              data={chartData}
              barWidth={28}
              noOfSections={4}
              maxValue={100} // O eixo Y vai de 0% a 100%
              height={180}
              spacing={24}
              roundedTop
              roundedBottom={false}
              hideRules={false}
              rulesColor="#E5E7EB"
              xAxisColor="#D9E7E3"
              yAxisColor="#D9E7E3"
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.xAxisText}
              xAxisLabelsVerticalShift={2}
              renderTooltip={(item: any) => {
                // Caso queira exibir detalhes adicionais ao interagir ou apenas manter limpo
                return null;
              }}
            />
            
            {/* Legenda textual complementar opcional abaixo do gráfico para mostrar a contagem exata */}
            <View style={styles.legendContainer}>
              {data.map((item) => (
                <View key={item.categoria} style={styles.legendItem}>
                  <View style={styles.legendDot} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    <Text style={{ fontWeight: "600" }}>{item.categoria}:</Text> {item.quantidade} {item.quantidade === 1 ? "notificação" : "notificações"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingVertical: 18,
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

  chartWrapper: {
    alignItems: "center",
    overflow: "hidden",
  },

  axisText: {
    color: "#6B7280",
    fontSize: 10,
  },

  xAxisText: {
    color: "#374151",
    fontSize: 10,
    textAlign: "center",
  },

  emptyText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
    paddingVertical: 10,
  },

  legendContainer: {
    marginTop: 20,
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#087F5B",
    marginRight: 8,
  },

  legendText: {
    fontSize: 12,
    color: "#4B5563",
  },
});