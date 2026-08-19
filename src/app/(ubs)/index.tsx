import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import {
  buscarDadosUBS,
  complementarNotificacao,
  DadosUBS,
  encaminharNotificacao,
  listarNotificacoesUBS,
  NotificacaoStatus,
  NotificacaoUBS,
  validarNotificacao,
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
    "EM ANDAMENTO": { label: "Pendente", bg: "#FAEEDA", color: "#854F0B" },
    VALIDADA: { label: "Validada", bg: Colors.teal50, color: Colors.teal800 },
    ENCAMINHADA: { label: "Encaminhada", bg: "#E6F1FB", color: "#0C447C" },
    COMPLEMENTADA: { label: "Complementada", bg: "#EEEDFE", color: "#534AB7" },
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
    ENCERRADO: { label: "Encerrado", bg: Colors.gray50, color: Colors.gray400 },
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

// ─── Modal de complementar ────────────────────────────────────────────────────

interface ComplementarModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (texto: string) => Promise<void>;
}

function ComplementarModal({
  visible,
  onClose,
  onConfirm,
}: ComplementarModalProps) {
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!texto.trim()) return;
    setLoading(true);
    await onConfirm(texto.trim());
    setLoading(false);
    setTexto("");
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Complementar notificação</Text>
          <Text style={styles.modalSub}>
            Adicione informações ao registro. O texto será anexado à descrição
            original.
          </Text>
          <TextInput
            style={styles.modalInput}
            value={texto}
            onChangeText={setTexto}
            placeholder="Descreva o complemento..."
            placeholderTextColor={Colors.gray200}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.modalBtns}>
            <TouchableOpacity
              style={styles.modalBtnOutline}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.modalBtnOutlineText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalBtnSolid,
                !texto.trim() && styles.modalBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={loading || !texto.trim()}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.modalBtnSolidText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Card de notificação ──────────────────────────────────────────────────────

interface NotifCardProps {
  item: NotificacaoUBS;
  onValidar: () => void;
  onEncaminhar: () => void;
  onComplementar: () => void;
  onPress: () => void;
  loadingId: number | null;
}

function NotifCard({
  item,
  onValidar,
  onEncaminhar,
  onComplementar,
  onPress,
  loadingId,
}: NotifCardProps) {
  const dotColor = CATEGORIA_COLOR[item.categoria] ?? Colors.teal400;

  const isPending =
    item.status === "EM ANDAMENTO" || item.status === "COMPLEMENTADA";

  const isLoading = loadingId === item.id;

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
      {isPending && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnValidar]}
            onPress={onValidar}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.teal800} size="small" />
            ) : (
              <Text style={[styles.actionBtnText, { color: Colors.teal800 }]}>
                ✓ Validar
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnEncaminhar]}
            onPress={onEncaminhar}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: "#0C447C" }]}>
              ↗ Encaminhar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnComplementar]}
            onPress={onComplementar}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: Colors.gray600 }]}>
              Complementar
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Pressable>
  );
}

interface NotifDetailModalProps {
  item: NotificacaoUBS | null;
  onClose: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={styles.detailValue}>{value || "Não informado"}</Text>
    </View>
  );
}

function NotifDetailModal({ item, onClose }: NotifDetailModalProps) {
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
  const [complementarTarget, setComplementarTarget] =
    useState<NotificacaoUBS | null>(null);
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
      recebidas: notificacoes.length,
      pendentes: notificacoes.filter((n) => n.status === "EM ANDAMENTO").length,
      encaminhadas: notificacoes.filter((n) => n.status === "ENCAMINHADA")
        .length,
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

  async function handleValidar(id: number) {
    setLoadingId(id);
    try {
      await validarNotificacao(id);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "VALIDADA" } : n)),
      );
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Tente novamente.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleEncaminhar(id: number) {
    setLoadingId(id);
    try {
      await encaminharNotificacao(id);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "ENCAMINHADA" } : n)),
      );
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Tente novamente.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function handleComplementar(texto: string) {
    if (!complementarTarget) return;
    const id = complementarTarget.id;
    try {
      await complementarNotificacao(id, texto);
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "COMPLEMENTADA" } : n)),
      );
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Tente novamente.",
      );
    } finally {
      setComplementarTarget(null);
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
        {/* Banner de pendentes */}
        {stats.pendentes > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertIcon}>⚠</Text>
            <Text style={styles.alertText}>
              <Text style={{ fontWeight: "700" }}>
                {stats.pendentes} notificaç
                {stats.pendentes === 1 ? "ão" : "ões"}
              </Text>{" "}
              aguarda{stats.pendentes === 1 ? "" : "m"} validação da unidade.
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatsCard value={stats.recebidas} label="Recebidas" />
          <StatsCard value={stats.pendentes} label="Pendentes" />
          <StatsCard value={stats.encaminhadas} label="Encaminhadas" />
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
              loadingId={loadingId}
              onValidar={() => handleValidar(item.id)}
              onEncaminhar={() => handleEncaminhar(item.id)}
              onComplementar={() => setComplementarTarget(item)}
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

      {/* Modal de complementar */}
      <ComplementarModal
        visible={!!complementarTarget}
        onClose={() => setComplementarTarget(null)}
        onConfirm={handleComplementar}
      />
      <NotifDetailModal
        item={selectedNotification}
        onClose={() => setSelectedNotification(null)}
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

  // Action buttons
  actionsRow: { flexDirection: "row", gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 36,
  },
  actionBtnText: { fontSize: 11, fontWeight: "600" },
  actionBtnValidar: {
    backgroundColor: Colors.teal50,
    borderColor: Colors.teal100,
  },
  actionBtnEncaminhar: { backgroundColor: "#E6F1FB", borderColor: "#B5D4F4" },
  actionBtnComplementar: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray100,
  },

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

  // Modal complementar
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
  },
  modalSub: { fontSize: FontSize.sm, color: Colors.gray400, lineHeight: 20 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: Colors.gray100,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.gray900,
    minHeight: 100,
    backgroundColor: Colors.bg,
  },
  modalBtns: { flexDirection: "row", gap: Spacing.md },
  modalBtnOutline: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.teal600,
    alignItems: "center",
  },
  modalBtnOutlineText: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.teal600,
  },
  modalBtnSolid: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.sm,
    backgroundColor: Colors.teal600,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  modalBtnSolidText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
  modalBtnDisabled: { opacity: 0.4 },
  notifCardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.92,
  },

  notifCardHovered: {
    transform: [{ translateY: -2 }],
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // ─── Detail modal ────────────────────────────────────────────────────────────

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
