import WebMap from "@/app/agente/WebMap";
import { listarNotificacoesCM, NotificacaoCM } from "@/services/CmService";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
};

const CATEGORIAS_FILTRO = ["Todos", "Doença", "Epizootia", "Desastre"];

// Campos adicionais que o mapa pode receber caso estejam presentes
// na resposta da API, mesmo não estando declarados no tipo NotificacaoCM.
type NotificacaoNoMapa = NotificacaoCM & {
  latitude?: number | null;
  longitude?: number | null;
  endereco?: string | null;
};

export default function CMMapScreen() {
  const [filter, setFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<NotificacaoCM[]>([]);
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

      // Usa o serviço autenticado da Coordenação Municipal.
      const lista = await listarNotificacoesCM();
      setNotificacoes(lista);

      const primeiraComCoords = (lista as NotificacaoNoMapa[]).find(
        (item) =>
          item.latitude != null &&
          item.longitude != null &&
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude)),
      );

      if (primeiraComCoords) {
        setRegion({
          latitude: Number(primeiraComCoords.latitude),
          longitude: Number(primeiraComCoords.longitude),
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        });
      }
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as notificações do município.",
      );
    } finally {
      setLoading(false);
    }
  }

  function getMarkerColor(categoria?: string, tipoEvento?: string) {
    const texto = `${categoria ?? ""} ${tipoEvento ?? ""}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    if (texto.includes("EPIZOOTIA") || texto.includes("MORTE DE ANIMAIS")) {
      return COLORS.epizootia;
    }

    if (texto.includes("DESASTRE")) {
      return COLORS.desastre;
    }

    if (texto.includes("DOENCA") || texto.includes("GRIPE")) {
      return COLORS.doenca;
    }

    return COLORS.doenca;
  }

  const notificacoesFiltradas = notificacoes.filter((item) => {
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

  function formatDate(dateStr: string) {
    if (!dateStr) return "";

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "EM ANDAMENTO":
        return "#1261A0";
      case "EM INVESTIGAÇÃO":
        return "#854F0B";
      case "VERÍDICO":
        return "#0D6847";
      case "NÃO VERÍDICO":
        return "#C62828";
      case "ENCERRADO":
        return "#718096";
      default:
        return COLORS.textGray;
    }
  }

  const notificacoesParaMapa = (
    notificacoesFiltradas as NotificacaoNoMapa[]
  ).map((item) => ({
    ...item,
    endereco: item.endereco ?? undefined,
    latitude: item.latitude != null ? Number(item.latitude) : undefined,
    longitude: item.longitude != null ? Number(item.longitude) : undefined,
  }));
  const mesesDisponiveis = Array.from(
    new Set(
      notificacoes
        .filter((item) => item.data_envio)
        .map((item) => {
          const date = new Date(item.data_envio);

          if (Number.isNaN(date.getTime())) return null;

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
            activeOpacity={0.8}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Mapa do Município</Text>
            <Text style={styles.headerSubtitle}>
              Ocorrências da Vigilância Municipal
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => fetchNotificacoes()}
            style={styles.refreshButton}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Feather name="refresh-cw" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {CATEGORIAS_FILTRO.map((categoria) => {
            const selecionado = filter === categoria;

            return (
              <TouchableOpacity
                key={categoria}
                style={[styles.chip, selecionado && styles.chipActive]}
                onPress={() => setFilter(categoria)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipText,
                    selecionado && styles.chipTextActive,
                  ]}
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
            <Feather name="calendar" size={18} color={COLORS.primaryHeader} />

            <Text style={styles.monthDropdownText}>
              {selectedMonth === "Todos os meses"
                ? "Todos os meses"
                : formatMonthLabel(selectedMonth)}
            </Text>

            <Feather
              name={monthDropdownOpen ? "chevron-up" : "chevron-down"}
              size={18}
              color={COLORS.textGray}
            />
          </TouchableOpacity>

          {monthDropdownOpen && (
            <View style={styles.monthDropdownOptions}>
              {["Todos os meses", ...mesesDisponiveis].map((mes) => {
                const selecionado = selectedMonth === mes;

                return (
                  <TouchableOpacity
                    key={mes}
                    style={[
                      styles.monthOption,
                      selecionado && styles.monthOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedMonth(mes);
                      setMonthDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        selecionado && styles.monthOptionTextSelected,
                      ]}
                    >
                      {mes === "Todos os meses" ? mes : formatMonthLabel(mes)}
                    </Text>

                    {selecionado && (
                      <Feather
                        name="check"
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

        <View style={styles.mapCard}>
          <View style={styles.mapContainer}>
            <WebMap
              region={region}
              notificacoes={notificacoesParaMapa}
              getMarkerColor={(categoria: string) => {
                const cat = categoria?.toUpperCase() ?? "";

                if (cat.includes("DOENÇA") || cat.includes("DOENCA")) {
                  return COLORS.doenca;
                }

                if (cat.includes("EPIZOOTIA")) {
                  return COLORS.epizootia;
                }

                if (cat.includes("DESASTRE")) {
                  return COLORS.desastre;
                }

                return COLORS.doenca;
              }}
            />
          </View>

          <View style={styles.legendContainer}>
            {[
              { label: "Doença", color: COLORS.doenca },
              { label: "Epizootia", color: COLORS.epizootia },
              { label: "Desastre", color: COLORS.desastre },
            ].map((item) => (
              <View key={item.label} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: item.color }]}
                />
                <Text style={styles.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OCORRÊNCIAS DO MUNICÍPIO</Text>
          <Text style={styles.countText}>{notificacoesFiltradas.length}</Text>
        </View>

        <View style={styles.listCard}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={COLORS.primaryHeader}
              style={{ padding: 24 }}
            />
          ) : notificacoesFiltradas.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma ocorrência encontrada para este filtro.
            </Text>
          ) : (
            notificacoesFiltradas.map((item, index) => {
              const color = getMarkerColor(item.categoria, item.tipo_evento);
              const isLast = index === notificacoesFiltradas.length - 1;

              return (
                <View
                  key={item.id}
                  style={[styles.listItem, !isLast && styles.listItemBorder]}
                >
                  <View style={[styles.listDot, { backgroundColor: color }]} />

                  <View style={styles.listInfo}>
                    <Text style={styles.itemTitle}>
                      {item.tipo_evento || item.categoria}
                    </Text>

                    <Text style={styles.itemSubtitle}>
                      {item.local_ocorrencia || "Local não informado"}
                    </Text>

                    <Text style={styles.itemSubtitle}>
                      {formatDate(item.data_envio)} ·{" "}
                      {item.pessoas_animais_infectados_afetados} afetados
                    </Text>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(item.status) + "18",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(item.status) },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.idText}>
                    #{String(item.id).padStart(4, "0")}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 30 }} />
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
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 3,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  filterScrollView: {
    marginVertical: 12,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },

  monthFilterContainer: {
    marginHorizontal: 16,
    marginTop: 0,
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
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: COLORS.primaryHeader,
    borderColor: COLORS.primaryHeader,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFFFFF",
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
    height: 260,
    width: "100%",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 10,
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
    fontSize: 12,
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
    alignItems: "flex-start",
    paddingVertical: 14,
    gap: 10,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  listDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  listInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textDark,
    marginBottom: 3,
  },
  itemSubtitle: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 3,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  idText: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  emptyText: {
    textAlign: "center",
    padding: 24,
    color: COLORS.textGray,
  },
});
