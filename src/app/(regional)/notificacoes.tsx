import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

import { listarNotificacoesRegionais } from "@/services/RegionalService";
import type { Notificacao } from "@/services/NotificationService";

const filtros = ["Todos", "DOENÇA", "EPIZOOTIA", "DESASTRE", "EM INVESTIGAÇÃO"];

export default function RegionalNotificationsScreen() {
  const { width } = useWindowDimensions();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [filtro, setFiltro] = useState("Todos");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [selectedNotification, setSelectedNotification] =
    useState<Notificacao | null>(null);

  const isSmallScreen = width < 380;
  const normalizar = (valor?: string) =>
    valor
      ?.trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  // ─── Carregar notificações da Regional ─────────────────────────────────────

  const carregarNotificacoes = useCallback(async () => {
    try {
      setErro(null);

      const dados = await listarNotificacoesRegionais();

      setNotificacoes(dados);
    } catch (error) {
      console.error("Erro ao carregar notificações da regional:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar notificações da regional.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  // ─── Filtros ──────────────────────────────────────────────────────────────

  const notificacoesFiltradas = notificacoes.filter((item) => {
  if (filtro === "Todos") {
    return true;
  }

  if (filtro === "EM INVESTIGAÇÃO") {
    return normalizar(item.status) === "EM INVESTIGACAO";
  }

  return normalizar(item.categoria) === normalizar(filtro);
});

  // ─── Card ──────────────────────────────────────────────────────────────────

  const renderNotificacao = ({ item }: { item: Notificacao }) => {
    const categoriaStyle = getCategoriaStyle(item.categoria);
    const statusStyle = getStatusStyle(item.status);

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => setSelectedNotification(item)}
      >
        {/* Título + Status */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.nome || item.tipo_evento}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusStyle.backgroundColor,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: statusStyle.color,
                },
              ]}
              numberOfLines={1}
            >
              {formatarStatus(item.status)}
            </Text>
          </View>
        </View>

        {/* Município + Data + Tipo */}
        <Text style={styles.metadata}>
          {item.municipio ?? "Município não informado"}
          {" • "}
          {formatarData(item.data_envio)}
        </Text>

        <Text style={styles.eventType}>{item.tipo_evento}</Text>

        {/* Local + afetados */}
        <Text style={styles.description} numberOfLines={2}>
          {formatarAfetados(
            item.pessoas_animais_infectados_afetados,
            item.categoria,
          )}
          {" • "}
          {item.local_ocorrencia || "Local não informado"}
        </Text>

        <View style={styles.divider} />

        {/* Categoria + ID */}
        <View style={styles.cardFooter}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: categoriaStyle.backgroundColor,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color: categoriaStyle.color,
                },
              ]}
            >
              {formatarCategoria(item.categoria)}
            </Text>
          </View>

          <View style={styles.cardIdContainer}>
            <Text style={styles.notificationId}>
              #{String(item.id).padStart(4, "0")}
            </Text>

            <Feather name="chevron-right" size={16} color={Colors.gray400} />
          </View>
        </View>
      </Pressable>
    );
  };

  // ─── Tela ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal800} />

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Feather name="arrow-left" size={19} color={Colors.white} />
        </Pressable>

        <Text style={styles.headerTitle}>Notificações da Regional</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* FILTROS */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filtros}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => {
            const selected = filtro === item;

            return (
              <Pressable
                onPress={() => setFiltro(item)}
                style={[
                  styles.filterButton,
                  selected && styles.filterButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextSelected,
                    isSmallScreen && styles.filterTextSmall,
                  ]}
                >
                  {formatarFiltro(item)}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* CONTEÚDO */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.teal600} />

          <Text style={styles.stateText}>Carregando notificações...</Text>
        </View>
      ) : erro ? (
        <View style={styles.centerState}>
          <Feather name="alert-circle" size={42} color={Colors.gray400} />

          <Text style={styles.emptyTitle}>Não foi possível carregar</Text>

          <Text style={styles.emptyText}>{erro}</Text>

          <Pressable style={styles.retryButton} onPress={carregarNotificacoes}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notificacoesFiltradas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotificacao}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: Spacing.md,
              }}
            />
          )}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            carregarNotificacoes();
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="inbox" size={42} color={Colors.gray400} />

              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>

              <Text style={styles.emptyText}>
                Não existem notificações para esse filtro na sua regional.
              </Text>
            </View>
          }
        />
      )}

      {/* DETALHES */}
      <NotificacaoDetailModal
        item={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE DETALHES
// ─────────────────────────────────────────────────────────────────────────────

function NotificacaoDetailModal({
  item,
  onClose,
}: {
  item: Notificacao | null;
  onClose: () => void;
}) {
  if (!item) {
    return null;
  }

  const statusStyle = getStatusStyle(item.status);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        {/* Cabeçalho */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderInfo}>
            <Text style={styles.modalCategory}>
              {formatarCategoria(item.categoria)}
            </Text>

            <Text style={styles.modalTitle}>
              {item.nome || item.tipo_evento}
            </Text>

            <Text style={styles.modalProtocol}>
              Notificação #{String(item.id).padStart(4, "0")}
            </Text>
          </View>

          <Pressable
            style={styles.modalCloseButton}
            onPress={onClose}
            hitSlop={8}
          >
            <Feather name="x" size={20} color={Colors.gray600} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalContent}
        >
          {/* Status */}
          <View
            style={[
              styles.modalStatus,
              {
                backgroundColor: statusStyle.backgroundColor,
              },
            ]}
          >
            <Text
              style={[
                styles.modalStatusText,
                {
                  color: statusStyle.color,
                },
              ]}
            >
              {formatarStatus(item.status)}
            </Text>
          </View>

          {/* Informações */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>
              Informações da notificação
            </Text>

            <DetailRow
              label="Município"
              value={item.municipio ?? "Não informado"}
            />

            <DetailRow
              label="Tipo de evento"
              value={item.tipo_evento || "Não informado"}
            />

            <DetailRow
              label="Categoria"
              value={formatarCategoria(item.categoria)}
            />

            <DetailRow
              label="Data de envio"
              value={formatarDataCompleta(item.data_envio)}
            />

            <DetailRow
              label="Local da ocorrência"
              value={item.local_ocorrencia || "Não informado"}
            />

            <DetailRow
              label="Pessoas/animais afetados"
              value={formatarAfetados(
                item.pessoas_animais_infectados_afetados,
                item.categoria,
              )}
            />
          </View>

          {/* Continuidade */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>
              Continuidade da situação
            </Text>

            <Text style={styles.detailDescription}>
              {item.continuidade_situacao || "Não informado"}
            </Text>
          </View>

          {/* Descrição */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Descrição</Text>

            <Text style={styles.detailDescription}>
              {item.descricao || "Não informado"}
            </Text>
          </View>

          {/* Endereço */}
          {item.endereco && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Endereço</Text>

              <Text style={styles.detailDescription}>{item.endereco}</Text>
            </View>
          )}

          {/* Origem */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Origem da notificação</Text>

            <Text style={styles.detailDescription}>
              Agente responsável: #{item.acs_ace_id}
            </Text>
          </View>
        </ScrollView>

        {/* Somente visualização */}
        <View style={styles.viewOnlyNotice}>
          <Feather name="eye" size={16} color={Colors.teal600} />

          <Text style={styles.viewOnlyText}>
            Visualização da notificação regional
          </Text>
        </View>

        <Pressable style={styles.modalFooterButton} onPress={onClose}>
          <Text style={styles.modalFooterButtonText}>Fechar relatório</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatarData(data: string) {
  if (!data) {
    return "Data não informada";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return data;
  }

  return (
    date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " • " +
    date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatarDataCompleta(data: string) {
  return formatarData(data);
}

function formatarAfetados(quantidade: number, categoria: string) {
  if (categoria === "EPIZOOTIA") {
    return `${quantidade} animais afetados`;
  }

  return `${quantidade} pessoas afetadas`;
}

function formatarCategoria(categoria: string) {
  switch (categoria) {
    case "DOENÇA":
      return "Doença";

    case "EPIZOOTIA":
      return "Epizootia";

    case "DESASTRE":
      return "Desastre";

    default:
      return categoria;
  }
}

function formatarFiltro(filtro: string) {
  if (filtro === "Todos") {
    return "Todos";
  }

  if (filtro === "EM INVESTIGAÇÃO") {
    return "Em investigação";
  }

  return formatarCategoria(filtro);
}

function formatarStatus(status: string) {
  switch (status) {
    case "EM INVESTIGAÇÃO":
      return "Em investigação";

    case "EM ANDAMENTO":
      return "Em andamento";

    case "RECEBIDO":
      return "Recebido";

    case "CONFIRMADO":
      return "Confirmado";

    case "DESCARTADO":
      return "Descartado";

    case "ENCERRADO":
      return "Encerrado";

    default:
      return status;
  }
}

function getCategoriaStyle(categoria: string) {
  switch (categoria) {
    case "DOENÇA":
      return {
        backgroundColor: "#FDE8E8",
        color: "#C62828",
      };

    case "EPIZOOTIA":
      return {
        backgroundColor: "#FFF0D8",
        color: "#A15C00",
      };

    case "DESASTRE":
      return {
        backgroundColor: "#E4F0FD",
        color: "#1261A0",
      };

    default:
      return {
        backgroundColor: Colors.gray100,
        color: Colors.gray600,
      };
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "EM INVESTIGAÇÃO":
      return {
        backgroundColor: "#FFF0D8",
        color: "#A15C00",
      };

    case "RECEBIDO":
      return {
        backgroundColor: "#E4F0FD",
        color: "#1261A0",
      };

    case "ENCERRADO":
      return {
        backgroundColor: "#F0EEE9",
        color: "#77736A",
      };

    case "CONFIRMADO":
      return {
        backgroundColor: "#DDF3EC",
        color: "#007C68",
      };

    case "EM ANDAMENTO":
      return {
        backgroundColor: "#E4F0FD",
        color: "#1261A0",
      };

    case "DESCARTADO":
      return {
        backgroundColor: "#FDE8E8",
        color: "#C62828",
      };

    default:
      return {
        backgroundColor: Colors.gray100,
        color: Colors.gray600,
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8F7",
  },

  // Header
  header: {
    height: 66,
    backgroundColor: Colors.teal800,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },

  headerPlaceholder: {
    width: 38,
  },

  // Filtros
  filterContainer: {
    backgroundColor: "#F4F8F7",
    paddingTop: Spacing.md,
    paddingBottom: 4,
  },

  filterContent: {
    paddingHorizontal: Spacing.md,
    gap: 10,
  },

  filterButton: {
    height: 36,
    paddingHorizontal: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D5E2DF",
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },

  filterButtonSelected: {
    backgroundColor: Colors.teal800,
    borderColor: Colors.teal800,
  },

  filterText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    fontWeight: "500",
  },

  filterTextSelected: {
    color: Colors.white,
    fontWeight: "700",
  },

  filterTextSmall: {
    fontSize: 12,
  },

  // Lista
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#D7E4E1",
    borderRadius: 15,
    padding: Spacing.md,
  },

  cardPressed: {
    opacity: 0.75,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  cardTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.gray900,
    lineHeight: 21,
  },

  statusBadge: {
    maxWidth: 135,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 15,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },

  metadata: {
    marginTop: 7,
    fontSize: FontSize.xs,
    color: Colors.gray600,
    lineHeight: 19,
  },

  eventType: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },

  description: {
    marginTop: 5,
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: "#D7E4E1",
    marginTop: 12,
    marginBottom: 12,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 15,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },

  cardIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  notificationId: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
  },

  // Estados
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  stateText: {
    marginTop: 12,
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 70,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.gray800,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    fontSize: FontSize.sm,
    color: Colors.gray600,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    backgroundColor: Colors.teal600,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },

  retryText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },

  // Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: "90%",
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  modalHeaderInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },

  modalCategory: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.teal600,
    textTransform: "uppercase",
  },

  modalTitle: {
    marginTop: 4,
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray800,
  },

  modalProtocol: {
    marginTop: 4,
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },

  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    paddingVertical: Spacing.md,
  },

  modalStatus: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: Spacing.md,
  },

  modalStatusText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
  },

  detailSection: {
    marginBottom: Spacing.lg,
  },

  detailSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray800,
    marginBottom: Spacing.sm,
  },

  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
    marginBottom: 2,
  },

  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.gray800,
    fontWeight: "500",
  },

  detailDescription: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },

  viewOnlyNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Colors.teal50,
    borderRadius: Radius.sm,
    paddingVertical: 9,
    marginBottom: Spacing.sm,
  },

  viewOnlyText: {
    fontSize: FontSize.xs,
    color: Colors.teal600,
    fontWeight: "600",
  },

  modalFooterButton: {
    backgroundColor: Colors.teal600,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },

  modalFooterButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
});
