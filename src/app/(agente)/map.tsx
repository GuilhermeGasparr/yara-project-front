import WebMap from "@/app/(agente)/WebMap";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  listarNotificacoes,
  Notificacao,
} from "@/services/NotificationService";
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
// Cores base do projeto
const COLORS = {
  primaryHeader: "#0D6847", // Verde do topo
  doenca: "#D9534F", // Vermelho / Rosa
  epizootia: "#C07D2B", // Laranja / Castanho
  desastre: "#337AB7", // Azul
  background: "#F5F7F6",
  cardBg: "#FFFFFF",
  textDark: "#2D3748",
  textGray: "#718096",
  chipSelected: "#0D6847",
};

const CATEGORIAS_FILTRO = ["Todos", "Doença", "Epizootia", "Desastre"];

export default function MapScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  // Região inicial do mapa
  const [region, setRegion] = useState({
    latitude: -3.7319,
    longitude: -38.5267,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  const fetchNotificacoes = async () => {
    try {
      setLoading(true);

      const lista = await listarNotificacoes();

      setNotificacoes(lista);
      console.log("NOTIFICAÇÕES DO MAPA:", lista);
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
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar notificações do mapa:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (categoria: string) => {
    const catUpper = categoria?.toUpperCase() || "";
    if (catUpper.includes("DOENÇA") || catUpper.includes("DOENCA"))
      return COLORS.doenca;
    if (catUpper.includes("EPIZOOTIA")) return COLORS.epizootia;
    if (catUpper.includes("DESASTRE")) return COLORS.desastre;
    return COLORS.doenca;
  };

  const filteredNotificacoes = notificacoes.filter((item) => {
    if (filter === "Todos") return true;
    return item.categoria?.toUpperCase().includes(filter.toUpperCase());
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryHeader}
      />

      {/* Header Superior */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mapa do Território</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filtros em Chips */}
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

        {/* Card do Mapa */}
        <View style={styles.mapCard}>
          <View style={styles.mapContainer}>
            <WebMap
              region={region}
              notificacoes={filteredNotificacoes}
              getMarkerColor={getMarkerColor}
            />
          </View>

          {/* Legenda do Mapa */}
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

        {/* Título da Lista */}
        <Text style={styles.sectionTitle}>OCORRÊNCIAS NO MAPA</Text>

        {/* Card com a Lista de Ocorrências */}
        <View style={styles.listCard}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primaryHeader}
              style={{ padding: 20 }}
            />
          ) : filteredNotificacoes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma ocorrência encontrada.</Text>
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
                      {item.tipo_evento} —{" "}
                      {item.endereco || item.local_ocorrencia}
                    </Text>

                    <Text style={styles.itemSubtitle}>
                      {formatDate(item.data_envio)} ·{" "}
                      {item.pessoas_animais_infectados_afetados} afetados
                    </Text>
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
    marginVertical: 12,
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

  map: StyleSheet.absoluteFill,

  customPin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  innerPinDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFF",
  },
  mapWatermark: {
    position: "absolute",
    alignSelf: "center",
    top: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  watermarkText: {
    fontSize: 11,
    color: "#718096",
    fontWeight: "500",
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textGray,
    marginHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
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
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: COLORS.textGray,
  },
});
