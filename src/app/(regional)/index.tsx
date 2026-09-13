import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RegionalOverview from "@/components/regional/RegionalOverview";
import { gerarDashboardRegional } from "@/utils/regionalDashboard";
import { router } from "expo-router";
import NotificationsByMunicipio from "../../components/regional/NotificationsByMunicipio";
import { useAuth } from "@/context/AuthContext";
import { listarNotificacoesRegionais } from "@/services/RegionalService";
import RegionalAlert from "@/components/regional/RegionalAlert";
import type { Notificacao } from "@/services/NotificationService";
import NotificationsByCategory from "@/components/regional/NotificationsByCategory";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

// ─── Configuração de status ──────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> =
  {
    "EM ANDAMENTO": {
      label: "Em andamento",
      bg: "#FAEEDA",
      color: "#854F0B",
    },

    RECEBIDO: {
      label: "Recebido",
      bg: "#E6F1FB",
      color: "#0C447C",
    },

    "EM INVESTIGAÇÃO": {
      label: "Em investigação",
      bg: "#FAEEDA",
      color: "#854F0B",
    },

    CONFIRMADO: {
      label: "Confirmado",
      bg: Colors.teal50,
      color: Colors.teal800,
    },

    DESCARTADO: {
      label: "Descartado",
      bg: Colors.gray50,
      color: Colors.gray600,
    },

    ENCERRADO: {
      label: "Encerrado",
      bg: Colors.gray50,
      color: Colors.gray400,
    },
  };

// ─── Componentes ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CFG[status] ?? {
    label: status,
    bg: Colors.gray50,
    color: Colors.gray600,
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

function StatsCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function NotificacaoCard({
  item,
  onPress,
}: {
  item: Notificacao;
  onPress: () => void;
}) {
  const categoriaColor =
    item.categoria === "DOENÇA"
      ? Colors.red400
      : item.categoria === "EPIZOOTIA"
        ? "#BA7517"
        : "#378ADD";

  const data = new Date(item.data_envio);

  const dataFormatada = Number.isNaN(data.getTime())
    ? item.data_envio
    : data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.notificationCard,
        {
          borderLeftColor: categoriaColor,
        },
      ]}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationTitleArea}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.tipo_evento}
          </Text>

          <Text style={styles.notificationMeta}>
            {item.municipio ?? "Município não informado"} · {dataFormatada}
          </Text>
        </View>

        <StatusBadge status={item.status} />
      </View>

      <View style={styles.notificationFooter}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: `${categoriaColor}18` },
          ]}
        >
          <Text style={[styles.categoryText, { color: categoriaColor }]}>
            {item.categoria}
          </Text>
        </View>

        <Text style={styles.notificationId}>
          #{String(item.id).padStart(4, "0")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function NotificacaoDetailModal({
  item,
  onClose,
}: {
  item: Notificacao | null;
  onClose: () => void;
}) {
  if (!item) return null;

  const data = new Date(item.data_envio);

  const dataFormatada = Number.isNaN(data.getTime())
    ? item.data_envio
    : data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const statusConfig = STATUS_CFG[item.status] ?? {
    label: item.status,
    bg: Colors.gray50,
    color: Colors.gray600,
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderInfo}>
            <Text style={styles.modalCategory}>{item.categoria}</Text>

            <Text style={styles.modalTitle}>{item.tipo_evento}</Text>

            <Text style={styles.modalProtocol}>
              Notificação #{String(item.id).padStart(4, "0")}
            </Text>
          </View>

          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalContent}
        >
          <View
            style={[styles.modalStatus, { backgroundColor: statusConfig.bg }]}
          >
            <Text
              style={[styles.modalStatusText, { color: statusConfig.color }]}
            >
              {statusConfig.label}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>
              Informações da notificação
            </Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Município</Text>
              <Text style={styles.detailValue}>
                {item.municipio ?? "Não informado"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Local</Text>
              <Text style={styles.detailValue}>
                {item.local_ocorrencia || "Não informado"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data</Text>
              <Text style={styles.detailValue}>{dataFormatada}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pessoas/animais afetados</Text>
              <Text style={styles.detailValue}>
                {item.pessoas_animais_infectados_afetados}
              </Text>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>
              Continuidade da situação
            </Text>

            <Text style={styles.detailDescription}>
              {item.continuidade_situacao || "Não informado"}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Descrição</Text>

            <Text style={styles.detailDescription}>
              {item.descricao || "Não informado"}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Origem</Text>

            <Text style={styles.detailDescription}>
              Agente responsável: #{item.acs_ace_id}
            </Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.modalFooterButton}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Text style={styles.modalFooterButtonText}>Fechar relatório</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Tela principal ──────────────────────────────────────────────────────────

export default function RegionalHomeScreen() {
  const { user } = useAuth();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<Notificacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dashboard = gerarDashboardRegional(notificacoes);
  const getInitials = (nome: string) => {
    return nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase();
  };
  const carregarNotificacoes = useCallback(async () => {
    try {
      setError(null);

      const data = await listarNotificacoesRegionais();

      setNotificacoes(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar notificações.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  // ─── Estatísticas calculadas a partir da API ───────────────────────────────

  const stats = useMemo(() => {
    return {
      total: notificacoes.length,

      investigacao: notificacoes.filter(
        (item) => item.status === "EM INVESTIGAÇÃO",
      ).length,

      confirmadas: notificacoes.filter((item) => item.status === "CONFIRMADO")
        .length,
    };
  }, [notificacoes]);

  // ─── Últimas notificações ─────────────────────────────────────────────────

  const ultimasNotificacoes = useMemo(() => {
    return [...notificacoes]
      .sort(
        (a, b) =>
          new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime(),
      )
      .slice(0, 4);
  }, [notificacoes]);

  // ─── Identidade do usuário ────────────────────────────────────────────────

  const nome = (user as any)?.nome ?? "Vigilância Regional";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

      {/* ─── Topbar ───────────────────────────────────────────────────────── */}

      <View style={styles.topbar}>
        <View style={styles.topbarInfo}>
          <Text style={styles.appLabel}>Vigilância Regional</Text>
          <Text style={styles.topbarTitle}>Olá, {nome}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/(regional)/profile")}
        >
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitials}>
              {getInitials(user?.nome ?? "")}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.teal600}
          />
        }
      >
        {/* ─── Erro ──────────────────────────────────────────────────────── */}

        {error && (
          <TouchableOpacity
            style={styles.errorBanner}
            onPress={carregarNotificacoes}
            activeOpacity={0.8}
          >
            <Text style={styles.errorTitle}>
              Não foi possível carregar os dados
            </Text>

            <Text style={styles.errorMessage}>{error}</Text>

            <Text style={styles.errorAction}>Toque para tentar novamente</Text>
          </TouchableOpacity>
        )}

        {/* ─── Estatísticas ──────────────────────────────────────────────── */}

        <RegionalOverview
          total={dashboard.total}
          emInvestigacao={dashboard.emInvestigacao}
          confirmadas={dashboard.confirmadas}
          municipiosAtivos={dashboard.municipiosAtivos}
        />
        <RegionalAlert
          emInvestigacao={dashboard.emInvestigacao}
          municipiosEmInvestigacao={dashboard.municipiosEmInvestigacao}
        />
        <NotificationsByMunicipio data={dashboard.porMunicipio} />
        <NotificationsByCategory
          data={dashboard.porCategoria}
          total={dashboard.total}
        />
        {/* ─── Conteúdo ──────────────────────────────────────────────────── */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notificações da regional</Text>

          <TouchableOpacity onPress={() => router.navigate("./notificacoes")}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.teal600} />

            <Text style={styles.loadingText}>Carregando notificações...</Text>
          </View>
        ) : ultimasNotificacoes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>

            <Text style={styles.emptyTitle}>
              Nenhuma notificação encontrada
            </Text>

            <Text style={styles.emptyText}>
              Ainda não existem notificações dos municípios desta regional.
            </Text>
          </View>
        ) : (
          ultimasNotificacoes.map((item) => (
            <NotificacaoCard
              key={item.id}
              item={item}
              onPress={() => setSelectedNotification(item)}
            />
          ))
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <NotificacaoDetailModal
        item={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  topbar: {
    backgroundColor: Colors.teal600,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  topbarInfo: {
    flex: 1,
  },

  appLabel: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },

  topbarTitle: {
    marginTop: 2,
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: -0.3,
  },

  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },

  profileIcon: {
    color: Colors.white,
    fontSize: 18,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.gray800,
    marginBottom: Spacing.sm,
  },

  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.teal600,
  },

  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray100,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.teal800,
  },

  statLabel: {
    marginTop: 3,
    fontSize: FontSize.xs,
    color: Colors.gray600,
    textAlign: "center",
  },

  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderLeftWidth: 3,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },

  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },

  notificationTitleArea: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray800,
  },

  notificationMeta: {
    marginTop: 4,
    fontSize: FontSize.xs,
    color: Colors.gray600,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },

  notificationFooter: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  categoryText: {
    fontSize: 10,
    fontWeight: "600",
  },

  notificationId: {
    fontSize: 11,
    color: Colors.gray400,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },

  loadingText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },

  emptyContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: Spacing.xl,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 30,
    marginBottom: Spacing.sm,
  },

  emptyTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray600,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    fontSize: FontSize.xs,
    color: Colors.gray600,
    textAlign: "center",
    lineHeight: 18,
  },

  errorBanner: {
    backgroundColor: "#FDECEC",
    borderLeftWidth: 3,
    borderLeftColor: Colors.red400,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  errorTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: "#A52A2A",
  },

  errorMessage: {
    marginTop: 3,
    fontSize: FontSize.xs,
    color: Colors.gray600,
  },
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
    maxHeight: "88%",
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
    fontWeight: "600",
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
  profileCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },

  profileInitials: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.white,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCloseText: {
    fontSize: 26,
    lineHeight: 28,
    color: Colors.gray600,
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
  errorAction: {
    marginTop: 6,
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.teal600,
  },
});
