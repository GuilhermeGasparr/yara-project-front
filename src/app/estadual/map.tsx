import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { listarNotificacoesVE } from "@/services/VeService";
import type { Notificacao } from "@/services/NotificationService";

import WebMap from "@/app/agente/WebMap";

import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORIAS_FILTRO = ["Todos", "Doença", "Epizootia", "Desastre"];

const COLORS_CATEGORIA = {
  doenca: "#D9534F",
  epizootia: "#C07D2B",
  desastre: "#337AB7",
};

type CategoriaFiltro = (typeof CATEGORIAS_FILTRO)[number];

export default function MapaEstadualScreen() {
  const [filter, setFilter] = useState<CategoriaFiltro>("Todos");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("Todos os meses");
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);

  const [region, setRegion] = useState({
    latitude: -3.7319,
    longitude: -38.5267,
    latitudeDelta: 0.8,
    longitudeDelta: 0.8,
  });

  const fetchNotificacoes = async () => {
    try {
      setLoading(true);

      const lista = await listarNotificacoesVE();

      setNotificacoes(lista);

      console.log("NOTIFICAÇÕES DO MAPA ESTADUAL:", lista);

      const primeiraComCoords = lista.find(
        (item) =>
          item.latitude !== null &&
          item.latitude !== undefined &&
          item.longitude !== null &&
          item.longitude !== undefined,
      );

      if (
        primeiraComCoords?.latitude !== undefined &&
        primeiraComCoords?.longitude !== undefined
      ) {
        setRegion({
          latitude: primeiraComCoords.latitude,
          longitude: primeiraComCoords.longitude,
          latitudeDelta: 0.3,
          longitudeDelta: 0.3,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar notificações para o mapa estadual:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchNotificacoes();
    } finally {
      setRefreshing(false);
    }
  };

  const getMarkerColor = (categoria: string) => {
    const catUpper = categoria?.toUpperCase() || "";

    if (catUpper.includes("DOENÇA") || catUpper.includes("DOENCA")) {
      return COLORS_CATEGORIA.doenca;
    }

    if (catUpper.includes("EPIZOOTIA")) {
      return COLORS_CATEGORIA.epizootia;
    }

    if (catUpper.includes("DESASTRE")) {
      return COLORS_CATEGORIA.desastre;
    }

    return COLORS_CATEGORIA.doenca;
  };

  const filteredNotificacoes = useMemo(() => {
    return notificacoes.filter((item) => {
      const categoria = item.categoria?.toUpperCase() || "";

      const correspondeCategoria =
        filter === "Todos" ||
        categoria.includes(filter.toUpperCase()) ||
        (filter === "Doença" && categoria.includes("DOENCA"));

      const date = item.data_envio ? new Date(item.data_envio) : null;

      const mesNotificacao =
        date && !Number.isNaN(date.getTime())
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
              2,
              "0",
            )}`
          : "";

      const correspondeMes =
        selectedMonth === "Todos os meses" || mesNotificacao === selectedMonth;

      return correspondeCategoria && correspondeMes;
    });
  }, [notificacoes, filter, selectedMonth]);

  const notificacoesComCoordenadas = useMemo(() => {
    return filteredNotificacoes.filter(
      (item) =>
        item.latitude !== null &&
        item.latitude !== undefined &&
        item.longitude !== null &&
        item.longitude !== undefined,
    );
  }, [filteredNotificacoes]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    const date = new Date(dateStr);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const mesesDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        notificacoes
          .filter((item) => item.data_envio)
          .map((item) => {
            const date = new Date(item.data_envio);

            if (Number.isNaN(date.getTime())) {
              return null;
            }

            return `${date.getFullYear()}-${String(
              date.getMonth() + 1,
            ).padStart(2, "0")}`;
          })
          .filter((mes): mes is string => mes !== null),
      ),
    ).sort((a, b) => b.localeCompare(a));
  }, [notificacoes]);

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);

    const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Mapa Estadual</Text>

          <Text style={styles.headerSubtitle}>
            Distribuição das notificações
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.teal600}
          />
        }
      >
        {/* FILTROS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {CATEGORIAS_FILTRO.map((categoria) => {
            const selected = filter === categoria;

            return (
              <TouchableOpacity
                key={categoria}
                onPress={() => setFilter(categoria)}
                style={[styles.chip, selected && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextActive]}
                >
                  {categoria}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FILTRO POR MÊS */}
        <View style={styles.monthFilterContainer}>
          <TouchableOpacity
            style={styles.monthDropdownButton}
            onPress={() => setMonthDropdownOpen((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Feather name="calendar" size={18} color={Colors.teal600} />

            <Text style={styles.monthDropdownText}>
              {selectedMonth === "Todos os meses"
                ? "Todos os meses"
                : formatMonthLabel(selectedMonth)}
            </Text>

            <Feather
              name={monthDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={Colors.gray400}
            />
          </TouchableOpacity>

          {monthDropdownOpen && (
            <View style={styles.monthDropdownOptions}>
              {["Todos os meses", ...mesesDisponiveis].map((mes) => {
                const selected = selectedMonth === mes;

                return (
                  <TouchableOpacity
                    key={mes}
                    style={[
                      styles.monthOption,
                      selected && styles.monthOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedMonth(mes);
                      setMonthDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        selected && styles.monthOptionTextSelected,
                      ]}
                    >
                      {mes === "Todos os meses" ? mes : formatMonthLabel(mes)}
                    </Text>

                    {selected && (
                      <Feather name="check" size={18} color={Colors.teal600} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* RESUMO */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Feather name="map" size={20} color={Colors.teal600} />
          </View>

          <View style={styles.summaryInfo}>
            <Text style={styles.summaryValue}>
              {notificacoesComCoordenadas.length}
            </Text>

            <Text style={styles.summaryLabel}>
              ocorrências localizadas no mapa
            </Text>
          </View>
        </View>

        {/* MAPA */}
        <View style={styles.mapCard}>
          <View style={styles.mapContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.teal600} />

                <Text style={styles.loadingText}>Carregando mapa...</Text>
              </View>
            ) : (
              <WebMap
                region={region}
                notificacoes={filteredNotificacoes}
                getMarkerColor={getMarkerColor}
              />
            )}
          </View>

          {/* LEGENDA */}
          <View style={styles.legendContainer}>
            <LegendItem color={COLORS_CATEGORIA.doenca} label="Doença" />

            <LegendItem color={COLORS_CATEGORIA.epizootia} label="Epizootia" />

            <LegendItem color={COLORS_CATEGORIA.desastre} label="Desastre" />
          </View>
        </View>

        {/* LISTA */}
        <Text style={styles.sectionTitle}>OCORRÊNCIAS NO MAPA</Text>

        <View style={styles.listCard}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={Colors.teal600}
              style={styles.listLoading}
            />
          ) : filteredNotificacoes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="map-pin" size={26} color={Colors.gray400} />

              <Text style={styles.emptyTitle}>
                Nenhuma ocorrência encontrada
              </Text>

              <Text style={styles.emptyText}>
                Não existem notificações para o filtro selecionado.
              </Text>
            </View>
          ) : (
            filteredNotificacoes.map((item, index) => {
              const color = getMarkerColor(item.categoria);

              const possuiCoordenadas =
                item.latitude !== null &&
                item.latitude !== undefined &&
                item.longitude !== null &&
                item.longitude !== undefined;

              const isLast = index === filteredNotificacoes.length - 1;

              return (
                <View
                  key={item.id}
                  style={[styles.listItem, !isLast && styles.listItemBorder]}
                >
                  <View style={[styles.listDot, { backgroundColor: color }]} />

                  <View style={styles.listInfo}>
                    <Text style={styles.itemTitle} numberOfLines={2}>
                      {item.tipo_evento || "Ocorrência"}
                    </Text>

                    <Text style={styles.itemLocation} numberOfLines={2}>
                      {item.municipio ||
                        item.endereco ||
                        item.local_ocorrencia ||
                        "Local não informado"}
                    </Text>

                    <Text style={styles.itemSubtitle}>
                      {formatDate(item.data_envio)} ·{" "}
                      {item.pessoas_animais_infectados_afetados ?? 0} afetados
                    </Text>
                  </View>

                  {!possuiCoordenadas && (
                    <View style={styles.noLocationBadge}>
                      <Feather
                        name="map-pin"
                        size={12}
                        color={Colors.gray400}
                      />
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />

      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  header: {
    backgroundColor: Colors.teal600,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: "700",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  filterScroll: {
    marginTop: Spacing.md,
  },

  filterContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },

  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },

  chipActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },

  chipText: {
    color: Colors.gray600,
    fontSize: FontSize.sm,
    fontWeight: "500",
  },

  chipTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },

  summaryCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(15,110,86,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },

  summaryInfo: {
    flex: 1,
  },

  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.teal600,
  },

  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginTop: 1,
  },
  monthFilterContainer: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    zIndex: 10,
  },

  monthDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: Spacing.sm,
  },

  monthDropdownText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.gray600,
  },

  monthDropdownOptions: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    marginTop: 4,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  monthOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  monthOptionSelected: {
    backgroundColor: "rgba(15,110,86,0.08)",
  },

  monthOptionText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },

  monthOptionTextSelected: {
    color: Colors.teal600,
    fontWeight: "700",
  },
  mapCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  mapContainer: {
    height: 360,
    width: "100%",
    backgroundColor: Colors.gray100,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.gray400,
  },

  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendText: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
    fontWeight: "500",
  },

  sectionTitle: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    letterSpacing: 0.5,
  },

  listCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    elevation: 1,
  },

  listLoading: {
    paddingVertical: Spacing.lg,
  },

  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },

  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  listDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },

  listInfo: {
    flex: 1,
  },

  itemTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray600,
  },

  itemLocation: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
    marginTop: 2,
  },

  itemSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginTop: 3,
  },

  noLocationBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: Spacing.md,
  },

  emptyTitle: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.gray600,
  },

  emptyText: {
    marginTop: 4,
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textAlign: "center",
  },

  bottomSpacing: {
    height: Spacing.xl,
  },
});
