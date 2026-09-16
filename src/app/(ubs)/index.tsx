import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import {
  buscarDadosUBS,
  listarNotificacoesUBS,
  setEmInvestigacao,
  setEncerrado,
  setNaoVeridico,
  setVeridico,
  DadosUBS,
  NotificacaoStatus,
  NotificacaoUBS,
} from "@/services/UbsService";
import { UBSUser } from "@/types";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// ─── Configurações de status ───────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> =
  {
    "EM ANDAMENTO": {
      label: "Pendente",
      bg: "#E4F0FD",
      color: "#1261A0",
    },

    "EM INVESTIGAÇÃO": {
      label: "Em investigação",
      bg: "#FAEEDA",
      color: "#854F0B",
    },

    VERÍDICO: {
      label: "Verídico",
      bg: Colors.teal50,
      color: Colors.teal800,
    },

    "NÃO VERÍDICO": {
      label: "Não verídico",
      bg: "#FDE8E8",
      color: "#C62828",
    },

    ENCERRADO: {
      label: "Encerrado",
      bg: Colors.gray50,
      color: Colors.gray600,
    },
  };

const CATEGORIA_COLOR: Record<string, string> = {
  DOENÇA: Colors.red400,
  EPIZOOTIA: "#BA7517",
  DESASTRE: "#378ADD",
};

// ─── Componentes auxiliares ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: NotificacaoStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG["EM ANDAMENTO"];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function StatsCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

// ─── Card de notificação ──────────────────────────────────────────────────────

interface NotifCardProps {
  item: NotificacaoUBS;
  onPress: () => void;
}

function NotifCard({ item, onPress }: NotifCardProps) {
  const dotColor = CATEGORIA_COLOR[item.categoria] ?? Colors.teal400;
  const isPending = item.status === "EM ANDAMENTO";

  const dataFormatada = new Date(item.data_envio).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.notifCard,
        isPending && styles.notifCardPending,
        pressed && styles.notifCardPressed,
      ]}
    >
      {/* Header */}
      <View style={styles.notifHeader}>
        <View style={styles.notifTitleRow}>
          <View style={[styles.notifDot, { backgroundColor: dotColor }]} />

          <View style={{ flex: 1 }}>
            <Text style={styles.notifTitle} numberOfLines={1}>
              {item.tipo_evento}
            </Text>

            <Text style={styles.notifMeta}>
              {dataFormatada} · {item.local_ocorrencia}
            </Text>
          </View>
        </View>

        <StatusBadge status={item.status} />
      </View>

      {/* Info */}
      <Text style={styles.notifInfo}>
        {item.pessoas_animais_infectados_afetados} afetados · #
        {String(item.id).padStart(4, "0")}
      </Text>

      {/* Ações */}
    </Pressable>
  );
}

interface NotifDetailModalProps {
  item: NotificacaoUBS | null;
  onClose: () => void;
  onStatusChange: (id: number, novoStatus: NotificacaoStatus) => Promise<void>;
  loadingId: number | null;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>{value || "Não informado"}</Text>
    </View>
  );
}

function NotifDetailModal({
  item,
  onClose,
  onStatusChange,
  loadingId,
}: NotifDetailModalProps) {
  const [visible, setVisible] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (item) {
      setVisible(true);

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
      ]).start();
    }
  }, [item]);

  function close() {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 30,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onClose();
    });
  }

  if (!item || !visible) return null;

  const dotColor = CATEGORIA_COLOR[item.categoria] ?? Colors.teal400;

  const dataFormatada = new Date(item.data_envio).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.modalBackdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        />

        {/* Clique fora fecha */}
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />

        <Animated.View
          style={[
            styles.detailModal,
            {
              opacity: backdropAnim,
              transform: [{ translateY }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.detailCategoryRow}>
                <View
                  style={[styles.detailDot, { backgroundColor: dotColor }]}
                />

                <Text style={styles.detailCategory}>{item.categoria}</Text>
              </View>

              <Text style={styles.detailTitle}>{item.tipo_evento}</Text>

              <Text style={styles.detailId}>
                Notificação #{String(item.id).padStart(4, "0")}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={close}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.detailScroll}
            contentContainerStyle={styles.detailContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status */}
            <View style={styles.detailStatusRow}>
              <Text style={styles.detailSectionTitle}>Status</Text>

              <StatusBadge status={item.status} />
            </View>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Alterar status</Text>

              <View style={styles.statusActionsGrid}>
                {[
                  {
                    label: "✓ Verídico",
                    status: "VERÍDICO" as NotificacaoStatus,
                    bg: Colors.teal50,
                    border: Colors.teal100,
                    color: Colors.teal800,
                  },
                  {
                    label: "⟳ Em investigação",
                    status: "EM INVESTIGAÇÃO" as NotificacaoStatus,
                    bg: "#FAEEDA",
                    border: "#FAC775",
                    color: "#854F0B",
                  },
                  {
                    label: "✗ Não verídico",
                    status: "NÃO VERÍDICO" as NotificacaoStatus,
                    bg: "#FDE8E8",
                    border: "#F7C1C1",
                    color: "#C62828",
                  },
                  {
                    label: "■ Encerrado",
                    status: "ENCERRADO" as NotificacaoStatus,
                    bg: "#F0EEE9",
                    border: "#D9D5CC",
                    color: Colors.gray600,
                  },
                ].map((acao) => {
                  const isActive = item.status === acao.status;
                  const isLoading = loadingId === item.id;

                  return (
                    <TouchableOpacity
                      key={acao.status}
                      style={[
                        styles.statusActionButton,
                        {
                          backgroundColor: acao.bg,
                          borderColor: acao.border,
                        },
                        isActive && styles.statusActionButtonActive,
                      ]}
                      onPress={() => onStatusChange(item.id, acao.status)}
                      disabled={isLoading || isActive}
                      activeOpacity={0.8}
                    >
                      {isLoading && !isActive ? (
                        <ActivityIndicator size="small" color={acao.color} />
                      ) : (
                        <Text
                          style={[
                            styles.statusActionText,
                            {
                              color: isActive ? Colors.white : acao.color,
                            },
                          ]}
                        >
                          {acao.label}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {/* Informações principais */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                Informações da ocorrência
              </Text>

              <DetailRow label="Tipo de evento" value={item.tipo_evento} />

              <DetailRow label="Categoria" value={item.categoria} />

              <DetailRow label="Data de envio" value={dataFormatada} />

              <DetailRow
                label="Local da ocorrência"
                value={item.local_ocorrencia}
              />

              <DetailRow
                label="Pessoas / animais afetados"
                value={String(item.pessoas_animais_infectados_afetados)}
              />
            </View>

            {/* Situação */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                Continuidade da situação
              </Text>

              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>
                  {item.continuidade_situacao || "Não informado."}
                </Text>
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Descrição detalhada</Text>

              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>
                  {item.descricao || "Nenhuma descrição informada."}
                </Text>
              </View>
            </View>

            {/* Agente */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Origem</Text>

              <DetailRow
                label="Agente responsável"
                value={item.acs_ace_nome ?? "Não informado"}
              />
            </View>

            <View style={{ height: Spacing.xl }} />
          </ScrollView>
          {/* Footer */}
          <View style={styles.detailFooter}>
            <TouchableOpacity
              style={styles.detailCloseButton}
              onPress={close}
              activeOpacity={0.85}
            >
              <Text style={styles.detailCloseButtonText}>Fechar relatório</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function UbsHomeScreen() {
  const { user } = useAuth();
  const ubsUser = user as UBSUser;

  const [notificacoes, setNotificacoes] = useState<NotificacaoUBS[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificacaoUBS | null>(null);

  // ─── Stats derivadas ─────────────────────────────────────────────────────────
  const [dadosUBS, setDadosUBS] = useState<DadosUBS | null>(null);

  useEffect(() => {
    async function carregarDadosUBS() {
      try {
        const dados = await buscarDadosUBS();
        setDadosUBS(dados);
      } catch (error) {
        console.error("Erro ao carregar dados da UBS:", error);
      }
    }

    carregarDadosUBS();
  }, []);
  const stats = useMemo(
    () => ({
      total: notificacoes.length,

      investigacao: notificacoes.filter((n) => n.status === "EM INVESTIGAÇÃO")
        .length,

      veridicos: notificacoes.filter((n) => n.status === "VERÍDICO").length,

      naoVeridicos: notificacoes.filter((n) => n.status === "NÃO VERÍDICO")
        .length,

      encerrados: notificacoes.filter((n) => n.status === "ENCERRADO").length,
    }),
    [notificacoes],
  );
  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await listarNotificacoesUBS();
      setNotificacoes(data);
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Não foi possível carregar.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Ações ───────────────────────────────────────────────────────────────────

  async function handleStatusChange(id: number, novoStatus: NotificacaoStatus) {
    setLoadingId(id);

    try {
      switch (novoStatus) {
        case "EM INVESTIGAÇÃO":
          await setEmInvestigacao(id);
          break;

        case "VERÍDICO":
          await setVeridico(id);
          break;

        case "NÃO VERÍDICO":
          await setNaoVeridico(id);
          break;

        case "ENCERRADO":
          await setEncerrado(id);
          break;

        case "EM ANDAMENTO":
          return;
      }

      setNotificacoes((prev) =>
        prev.map((notificacao) =>
          notificacao.id === id
            ? { ...notificacao, status: novoStatus }
            : notificacao,
        ),
      );

      setSelectedNotification((prev) =>
        prev && prev.id === id ? { ...prev, status: novoStatus } : prev,
      );
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error
          ? err.message
          : "Não foi possível alterar o status.",
      );
    } finally {
      setLoadingId(null);
    }
  }
  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appLabel}>Unidade de Saúde</Text>
          <Text style={styles.topbarTitle} numberOfLines={1}>
            {dadosUBS?.nome ?? "UBS"}
          </Text>
        </View>

        {/* Perfil */}
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push("/(ubs)/profile")}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <View style={styles.profileBtnInner}>
            <Text style={styles.profileBtnText}>
              {ubsUser?.nome ? ubsUser.nome[0].toUpperCase() : "U"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={Colors.teal400}
            colors={[Colors.teal600]}
          />
        }
      >

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatsCard value={stats.total} label="Total" />

          <StatsCard value={stats.investigacao} label="Em investigação" />

          <StatsCard value={stats.veridicos} label="Verídicas" />

          <StatsCard value={stats.naoVeridicos} label="Não verídicas" />

          <StatsCard value={stats.encerrados} label="Encerradas" />
        </View>
        {/* Lista */}
        <Text style={styles.sectionLabel}>Notificações do território</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.teal400} size="large" />
            <Text style={styles.loadingText}>Carregando notificações...</Text>
          </View>
        ) : notificacoes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>
              Nenhuma notificação recebida ainda.
            </Text>
          </View>
        ) : (
          notificacoes.map((item) => (
            <NotifCard
              key={item.id}
              item={item}
              onPress={() => setSelectedNotification(item)}
            />
          ))
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* FAB — criar agente */}
      <TouchableOpacity
        style={fabStyles.fab}
        onPress={() => router.push("/(ubs)/createAgent")}
        activeOpacity={0.88}
      >
        <Text style={fabStyles.fabIcon}>＋</Text>
        <Text style={fabStyles.fabLabel}>Novo agente</Text>
      </TouchableOpacity>

      <NotifDetailModal
        item={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onStatusChange={handleStatusChange}
        loadingId={loadingId}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  // Topbar
  topbar: {
    backgroundColor: Colors.teal600,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  appLabel: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  topbarTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: -0.3,
  },
  profileBtn: { paddingBottom: 2 },
  profileBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  profileBtnText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },

  // Scroll
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },

  // Alert banner
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#FAEEDA",
    borderLeftWidth: 3,
    borderLeftColor: "#BA7517",
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  alertIcon: { fontSize: 16, color: "#BA7517" },
  alertText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: "#854F0B",
    lineHeight: 20,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statNum: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.teal600,
    letterSpacing: -0.5,
  },
  statLbl: { fontSize: FontSize.xs, color: Colors.gray400, marginTop: 2 },

  // Section label
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },

  // Notif card
  notifCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  notifCardPending: {
    borderLeftWidth: 3,
    borderLeftColor: "#BA7517",
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    flex: 1,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  notifTitle: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.gray900,
  },
  notifMeta: { fontSize: FontSize.xs, color: Colors.gray400, marginTop: 2 },
  notifInfo: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginBottom: Spacing.md,
    marginLeft: 20,
  },

  // Badges
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: "600" },

  // Loading / empty
  loadingWrap: {
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.gray400 },
  emptyWrap: {
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: FontSize.sm, color: Colors.gray400 },

  notifCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5, 35, 29, 0.55)",
  },

  detailModal: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "88%",
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: "hidden",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  statusActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },

  statusActionButton: {
    flex: 1,
    minWidth: "47%",
    minHeight: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },

  statusActionButtonActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },

  statusActionText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },

  detailCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 5,
  },

  detailDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  detailCategory: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  detailTitle: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.gray900,
    marginTop: 2,
  },

  detailId: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginTop: 4,
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.gray50,
  },

  closeBtnText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: "300",
    color: Colors.gray600,
  },

  detailScroll: {
    flexGrow: 0,
  },

  detailContent: {
    padding: Spacing.lg,
  },

  detailStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },

  detailSection: {
    marginBottom: Spacing.lg,
  },

  detailSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
    gap: Spacing.md,
  },

  detailLabel: {
    flex: 0.9,
    fontSize: FontSize.sm,
    color: Colors.gray400,
  },

  detailValue: {
    flex: 1.4,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.gray900,
    textAlign: "right",
  },

  descriptionBox: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.06)",
  },

  descriptionText: {
    fontSize: FontSize.sm,
    lineHeight: 21,
    color: Colors.gray600,
  },

  detailFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray50,
  },

  detailCloseButton: {
    backgroundColor: Colors.teal600,
    borderRadius: Radius.md,
    paddingVertical: 13,
    alignItems: "center",
  },

  detailCloseButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
});

const fabStyles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    backgroundColor: Colors.teal600,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: Colors.teal800,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { fontSize: 18, color: "#fff", fontWeight: "300" },
  fabLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
