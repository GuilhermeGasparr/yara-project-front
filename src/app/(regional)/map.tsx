import WebMap from "@/app/(agente)/WebMap";
import { listarNotificacoesRegionais } from "@/services/RegionalService";
import type { Notificacao } from "@/services/NotificationService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  primaryHeader: "#0D6847",
  doenca: "#D9534F",
  epizootia: "#C07D2B",
  desastre: "#337AB7",
  background: "#F5F7F6",
  cardBg: "#FFFFFF",
  textDark: "#2D3748",
  textGray: "#718096",
  chipSelected: "#0D6847",
};

const CATEGORIAS_FILTRO = ["Todos", "Doença", "Epizootia", "Desastre"];

export default function VrMapScreen() {
  const router = useRouter();

  const [filter, setFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [erro, setErro] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Todos os meses");
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [region, setRegion] = useState({
    latitude: -3.7319,
    longitude: -38.5267,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  async function fetchNotificacoes() {
    try {
      setLoading(true);
      setErro("");

      // O backend retorna somente notificações da superintendência
      // vinculada ao usuário VR autenticado.
      const lista = await listarNotificacoesRegionais();

      setNotificacoes(lista);

      const primeiraComCoords = lista.find(
        (item) => item.latitude != null && item.longitude != null,
      );

      if (primeiraComCoords) {
        setRegion({
          latitude: primeiraComCoords.latitude!,
          longitude: primeiraComCoords.longitude!,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar notificações do mapa regional:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as notificações regionais.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getMarkerColor(categoria?: string | null) {
    const catUpper = categoria?.toUpperCase() || "";

    if (catUpper.includes("DOENÇA") || catUpper.includes("DOENCA")) {
      return COLORS.doenca;
    }

    if (catUpper.includes("EPIZOOTIA")) {
      return COLORS.epizootia;
    }

    if (catUpper.includes("DESASTRE")) {
      return COLORS.desastre;
    }

    return COLORS.doenca;
  }

  const mesesDisponiveis = Array.from(
    new Set(
      notificacoes
        .filter((item) => item.data_envio)
        .map((item) => {
          const date = new Date(item.data_envio);

          if (Number.isNaN(date.getTime())) {
            return null;
          }

          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0",
          )}`;
        })
        .filter((mes): mes is string => mes !== null),
    ),
  ).sort((a, b) => b.localeCompare(a));

  function formatMonthLabel(monthKey: string) {
    const [year, month] = monthKey.split("-").map(Number);

    const label = new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });

    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  const filteredNotificacoes = notificacoes.filter((item) => {
    const categoria = item.categoria?.toUpperCase() || "";

    const correspondeCategoria =
      filter === "Todos" ||
      categoria.includes(filter.toUpperCase()) ||
      (filter === "Doença" && categoria.includes("DOENCA"));

    const date = new Date(item.data_envio);

    const mesNotificacao = Number.isNaN(date.getTime())
      ? ""
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    const correspondeMes =
      selectedMonth === "Todos os meses" || mesNotificacao === selectedMonth;

    return correspondeCategoria && correspondeMes;
  });

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "";

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryHeader}
      />

      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Mapa Regional</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filtro por categoria */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {CATEGORIAS_FILTRO.map((cat) => {
            const isSelected = filter === cat;

            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setFilter(cat)}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filtro por mês */}

        {/* Filtro por mês — lista suspensa */}
        <View style={styles.monthFilterContainer}>
          <TouchableOpacity
            style={styles.monthDropdownButton}
            onPress={() => setMonthDropdownOpen((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={COLORS.primaryHeader}
            />

            <Text style={styles.monthDropdownText}>
              {selectedMonth === "Todos os meses"
                ? "Todos os meses"
                : formatMonthLabel(selectedMonth)}
            </Text>

            <Ionicons
              name={monthDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={COLORS.textGray}
            />
          </TouchableOpacity>

          {monthDropdownOpen && (
            <View style={styles.monthDropdownOptions}>
              {["Todos os meses", ...mesesDisponiveis].map((mes) => {
                const isSelected = selectedMonth === mes;

                return (
                  <TouchableOpacity
                    key={mes}
                    style={[
                      styles.monthOption,
                      isSelected && styles.monthOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedMonth(mes);
                      setMonthDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        isSelected && styles.monthOptionTextSelected,
                      ]}
                    >
                      {mes === "Todos os meses" ? mes : formatMonthLabel(mes)}
                    </Text>

                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={COLORS.primaryHeader}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Mapa */}
        <View style={styles.mapCard}>
          <View style={styles.mapContainer}>
            <WebMap
              region={region}
              notificacoes={filteredNotificacoes.map((n) => ({
                ...n,
                endereco: n.endereco ?? undefined,
                latitude: n.latitude ?? undefined,
                longitude: n.longitude ?? undefined,
              }))}
              getMarkerColor={getMarkerColor}
            />
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.doenca }]}
              />
              <Text style={styles.legendText}>Doença</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: COLORS.epizootia },
                ]}
              />
              <Text style={styles.legendText}>Epizootia</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: COLORS.desastre }]}
              />
              <Text style={styles.legendText}>Desastre</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            OCORRÊNCIAS NA SUPERINTENDÊNCIA
          </Text>

          <Text style={styles.countText}>{filteredNotificacoes.length}</Text>
        </View>

        <View style={styles.listCard}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primaryHeader}
              style={{ padding: 20 }}
            />
          ) : erro ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{erro}</Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchNotificacoes}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : filteredNotificacoes.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma ocorrência encontrada para os filtros selecionados.
            </Text>
          ) : (
            filteredNotificacoes.map((item, index) => {
              const color = getMarkerColor(item.categoria);
              const isLast = index === filteredNotificacoes.length - 1;

              return (
                <View
                  key={item.id}
                  style={[styles.listItem, !isLast && styles.listItemBorder]}
                >
                  <View style={[styles.listDot, { backgroundColor: color }]} />

                  <View style={styles.listInfo}>
                    <Text style={styles.itemTitle}>
                      {item.tipo_evento || item.categoria || "Ocorrência"}
                      {" — "}
                      {item.endereco ||
                        item.local_ocorrencia ||
                        "Local não informado"}
                    </Text>

                    <Text style={styles.itemSubtitle}>
                      {formatDate(item.data_envio)}
                      {" · "}
                      {item.municipio || "Município não informado"}
                      {" · "}
                      {item.pessoas_animais_infectados_afetados ?? 0}
                      {" afetados"}
                    </Text>

                    {!!item.coads && (
                      <Text style={styles.coadsText}>COADS: {item.coads}</Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.primaryHeader,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  filterScrollView: {
    marginVertical: 8,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: COLORS.chipSelected,
    borderColor: COLORS.chipSelected,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },

  monthFilterContainer: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    zIndex: 10,
  },

  monthDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },

  monthDropdownText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textDark,
  },

  monthDropdownOptions: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
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
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },

  monthOptionSelected: {
    backgroundColor: "#F0F7F3",
  },

  monthOptionText: {
    fontSize: 14,
    color: COLORS.textDark,
  },

  monthOptionTextSelected: {
    color: COLORS.primaryHeader,
    fontWeight: "600",
  },

  mapCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 20,
  },
  mapContainer: {
    height: 220,
    width: "100%",
    position: "relative",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EDF2F7",
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
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textGray,
    letterSpacing: 0.5,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primaryHeader,
  },
  listCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    elevation: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  listDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  coadsText: {
    fontSize: 12,
    color: COLORS.primaryHeader,
    marginTop: 4,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: COLORS.textGray,
  },
  errorContainer: {
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: COLORS.textDark,
    textAlign: "center",
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: COLORS.primaryHeader,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
