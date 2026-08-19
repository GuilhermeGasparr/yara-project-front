import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import {
  baixarRelatorioNotificacaoPDF,
  exportarRelatorioPDF,
  buscarDashboardStats,
  DashboardStats,
  listarNotificacoesCM,
  NotificacaoCM,
  setConfirmado,
  setDescartado,
  setEmInvestigacao,
  setEncerrado,
  setRecebido,
  StatusCM,
} from "@/services/CmService";
import { Feather } from "@expo/vector-icons";
// ─── Configurações de status ──────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> =
  {
    RECEBIDO: { label: "Recebido", bg: "#E6F1FB", color: "#0C447C" },
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
    VALIDADA: { label: "Validada", bg: Colors.teal50, color: Colors.teal600 },
    ENCAMINHADA: { label: "Encaminhada", bg: "#E6F1FB", color: "#185FA5" },
    "EM ANDAMENTO": { label: "Em andamento", bg: "#FAEEDA", color: "#854F0B" },
  };

const CATEGORIA_COLOR: Record<string, string> = {
  DOENÇA: Colors.red400,
  EPIZOOTIA: "#BA7517",
  DESASTRE: "#378ADD",
};

const FILTROS = [
  "TODOS",
  "RECEBIDO",
  "EM INVESTIGAÇÃO",
  "CONFIRMADO",
  "DESCARTADO",
  "ENCERRADO",
];

// ─── Badge de status ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusCM }) {
  const cfg = STATUS_CFG[status] ?? {
    label: status,
    bg: Colors.gray50,
    color: Colors.gray600,
  };
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Modal de detalhes + ações ────────────────────────────────────────────────

interface DetailModalProps {
  notif: NotificacaoCM | null;
  onClose: () => void;
  onStatusChange: (id: number, novoStatus: StatusCM) => Promise<void>;
  loadingId: number | null;
}

function DetailModal({
  notif,
  onClose,
  onStatusChange,
  loadingId,
}: DetailModalProps) {
  if (!notif) return null;
  const [baixandoRelatorio, setBaixandoRelatorio] = useState(false);

  async function handleBaixarRelatorio() {
    if (!notif) return;

    try {
      setBaixandoRelatorio(true);

      const blob = await baixarRelatorioNotificacaoPDF(notif.id);

      // Expo Web / navegador
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `notificacao_${notif.id}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        return;
      }

      Alert.alert("Relatório gerado", "O relatório foi gerado com sucesso.");
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível baixar o relatório.",
      );
    } finally {
      setBaixandoRelatorio(false);
    }
  }
  const dotColor = CATEGORIA_COLOR[notif.categoria] ?? Colors.teal400;
  const isLoading = loadingId === notif.id;

  const dataFormatada = new Date(notif.data_envio).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const acoes: {
    label: string;
    status: StatusCM;
    bg: string;
    border: string;
    color: string;
  }[] = [
    {
      label: "✓ Confirmado",
      status: "CONFIRMADO",
      bg: Colors.teal50,
      border: Colors.teal100,
      color: Colors.teal800,
    },
    {
      label: "⟳ Em investigação",
      status: "EM INVESTIGAÇÃO",
      bg: "#FAEEDA",
      border: "#FAC775",
      color: "#854F0B",
    },
    {
      label: "✗ Descartado",
      status: "DESCARTADO",
      bg: Colors.gray50,
      border: Colors.gray100,
      color: Colors.gray600,
    },
    {
      label: "■ Encerrado",
      status: "ENCERRADO",
      bg: "#FCEBEB",
      border: "#F7C1C1",
      color: Colors.red600,
    },
  ];

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.modalContainer}>
        {/* Handle + Header */}
        <View style={s.modalHeader}>
          <View style={s.dragHandle} />
          <View style={s.modalTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle} numberOfLines={2}>
                {notif.tipo_evento}
              </Text>

              <View style={s.modalMeta}>
                <View style={[s.modalDot, { backgroundColor: dotColor }]} />

                <Text style={s.modalMetaText}>
                  {notif.categoria} · #{String(notif.id).padStart(4, "0")}
                </Text>
              </View>
            </View>

            <StatusBadge status={notif.status} />

            {/* DOWNLOAD */}
            <TouchableOpacity
              onPress={handleBaixarRelatorio}
              style={s.downloadModalBtn}
              disabled={baixandoRelatorio}
              activeOpacity={0.7}
            >
              {baixandoRelatorio ? (
                <ActivityIndicator size="small" color={Colors.teal600} />
              ) : (
                <Feather name="download" size={20} color={Colors.teal600} />
              )}
            </TouchableOpacity>

            {/* FECHAR */}
            <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={12}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={s.modalScroll}
          contentContainerStyle={s.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dados da ocorrência */}
          <Text style={s.detailSectionLabel}>Dados da ocorrência</Text>
          <View style={s.detailCard}>
            <DetailRow label="Data/hora envio" value={dataFormatada} />
            <DetailRow label="Local" value={notif.local_ocorrencia} />
            <DetailRow
              label="Afetados"
              value={`${notif.pessoas_animais_infectados_afetados}`}
            />
            <DetailRow
              label="Situação ativa"
              value={notif.continuidade_situacao}
            />
            <DetailRow
              label="Protocolo"
              value={`#${String(notif.id).padStart(7, "0")}`}
            />
          </View>

          {/* Descrição */}
          {!!notif.descricao && (
            <>
              <Text style={s.detailSectionLabel}>Descrição</Text>
              <View style={[s.detailCard, s.descricaoCard]}>
                <Text style={s.descricaoText}>{notif.descricao}</Text>
              </View>
            </>
          )}

          {/* Ações de status */}
          <Text style={s.detailSectionLabel}>Alterar status</Text>
          <View style={s.acoesGrid}>
            {acoes.map((acao) => {
              const isActive = notif.status === acao.status;
              return (
                <TouchableOpacity
                  key={acao.status}
                  style={[
                    s.acaoBtn,
                    { backgroundColor: acao.bg, borderColor: acao.border },
                    isActive && s.acaoBtnActive,
                  ]}
                  onPress={() => onStatusChange(notif.id, acao.status)}
                  disabled={isLoading || isActive}
                  activeOpacity={0.8}
                >
                  {isLoading && !isActive ? (
                    <ActivityIndicator size="small" color={acao.color} />
                  ) : (
                    <Text
                      style={[
                        s.acaoBtnText,
                        { color: isActive ? Colors.white : acao.color },
                      ]}
                    >
                      {acao.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value || "—"}</Text>
    </View>
  );
}

// ─── Card de notificação ──────────────────────────────────────────────────────

interface NotifCardProps {
  item: NotificacaoCM;
  onPress: () => void;
}

function NotifCard({ item, onPress }: NotifCardProps) {
  const dotColor = CATEGORIA_COLOR[item.categoria] ?? Colors.teal400;
  const data = new Date(item.data_envio).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.82}>
      <View style={s.cardHeader}>
        <View style={s.cardTitleRow}>
          <View style={[s.dot, { backgroundColor: dotColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle} numberOfLines={1}>
              {item.tipo_evento}
            </Text>
            <Text style={s.cardMeta}>
              {data} · {item.local_ocorrencia}
            </Text>
          </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
      <Text style={s.cardInfo}>
        {item.pessoas_animais_infectados_afetados} afetados · #
        {String(item.id).padStart(4, "0")}
      </Text>
      <View style={s.cardFooter}>
        <View
          style={[
            s.catBadge,
            { backgroundColor: CATEGORIA_COLOR[item.categoria] + "18" },
          ]}
        >
          <Text
            style={[
              s.catBadgeText,
              { color: CATEGORIA_COLOR[item.categoria] ?? Colors.teal600 },
            ]}
          >
            {item.categoria}
          </Text>
        </View>
        <Text style={s.verDetalhe}>Ver detalhes →</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function CMScreen() {
  const { user, signOut } = useAuth();

  const [notificacoes, setNotificacoes] = useState<NotificacaoCM[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    em_investigacao: 0,
    confirmados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtro, setFiltro] = useState("TODOS");
  const [selectedNotif, setSelectedNotif] = useState<NotificacaoCM | null>(
    null,
  );
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  async function handleDownloadRelatorio() {
    try {
      const blob = await exportarRelatorioPDF();

      Alert.alert("Relatório gerado", "O relatório foi gerado com sucesso.");

      // Aqui entra o salvamento do arquivo no dispositivo.
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error
          ? err.message
          : "Não foi possível gerar o relatório.",
      );
    }
  }

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const [notifs, statsData] = await Promise.all([
        listarNotificacoesCM(),
        buscarDashboardStats(),
      ]);
      setNotificacoes(notifs);
      setStats(statsData);
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Falha ao carregar dados.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Filtro ──────────────────────────────────────────────────────────────────

  const notifFiltradas = useMemo(() => {
    if (filtro === "TODOS") return notificacoes;
    // "RECEBIDO" no filtro mostra TODAS que chegaram (qualquer status)
    if (filtro === "RECEBIDO") return notificacoes;
    return notificacoes.filter((n) => n.status === filtro);
  }, [notificacoes, filtro]);

  // ─── Ação de status ──────────────────────────────────────────────────────────

  async function handleStatusChange(id: number, novoStatus: StatusCM) {
    setLoadingId(id);
    try {
      const fnMap: Record<
        StatusCM,
        ((id: number) => Promise<void>) | undefined
      > = {
        RECEBIDO: setRecebido,
        "EM INVESTIGAÇÃO": setEmInvestigacao,
        CONFIRMADO: setConfirmado,
        DESCARTADO: setDescartado,
        ENCERRADO: setEncerrado,
        VALIDADA: undefined,
        ENCAMINHADA: undefined,
        "EM ANDAMENTO": undefined,
      };
      const fn = fnMap[novoStatus];
      if (!fn) return;
      await fn(id);

      // Atualiza localmente — reflete na tela do ACS pois o status é o mesmo campo no banco
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: novoStatus } : n)),
      );
      // Atualiza modal aberto
      setSelectedNotif((prev) =>
        prev && prev.id === id ? { ...prev, status: novoStatus } : prev,
      );

      // Recarrega stats
      buscarDashboardStats()
        .then(setStats)
        .catch(() => {});
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Tente novamente.",
      );
    } finally {
      setLoadingId(null);
    }
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async function handleProfile() {
    router.push("/(cm)/profile");
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const municipio = (user as any)?.municipio ?? "Município";
  const nome = (user as any)?.nome ?? "Coordenador";

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

      {/* Topbar */}
      <View style={s.topbar}>
        <View style={{ flex: 1 }}>
          <Text style={s.topbarSub}>Coordenação Municipal</Text>

          <Text style={s.topbarTitle} numberOfLines={1}>
            {municipio}
          </Text>
        </View>

        {/* Download do relatório */}
      

        {/* Perfil */}
        <TouchableOpacity
          style={s.avatarBtn}
          onPress={handleProfile}
          activeOpacity={0.8}
        >
          <Text style={s.avatarText}>{nome[0]?.toUpperCase() ?? "C"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
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
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{stats.total}</Text>
            <Text style={s.statLbl}>Total mês</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: "#BA7517" }]}>
              {stats.em_investigacao}
            </Text>
            <Text style={s.statLbl}>Investigação</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: Colors.teal600 }]}>
              {stats.confirmados}
            </Text>
            <Text style={s.statLbl}>Confirmados</Text>
          </View>
        </View>

        {/* Banner de alerta quando há notificações em investigação */}
        {stats.em_investigacao > 0 && (
          <View style={s.alertBanner}>
            <Text style={s.alertIcon}>⚠</Text>
            <Text style={s.alertText}>
              <Text style={{ fontWeight: "700" }}>
                {stats.em_investigacao} ocorrência
                {stats.em_investigacao > 1 ? "s" : ""}
              </Text>{" "}
              em investigação no município.
            </Text>
          </View>
        )}

        {/* Filtros */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroll}
        >
          {FILTROS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, filtro === f && s.filterChipActive]}
              onPress={() => setFiltro(f)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.filterChipText,
                  filtro === f && s.filterChipTextActive,
                ]}
              >
                {f === "TODOS" ? "Todos" : (STATUS_CFG[f]?.label ?? f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Lista */}
        <Text style={s.sectionLabel}>
          Notificações — todo o município
          {filtro !== "TODOS"
            ? ` · ${STATUS_CFG[filtro]?.label ?? filtro}`
            : ""}
        </Text>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={Colors.teal400} size="large" />
            <Text style={s.loadingText}>Carregando notificações...</Text>
          </View>
        ) : notifFiltradas.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyText}>Nenhuma notificação encontrada.</Text>
          </View>
        ) : (
          notifFiltradas.map((item) => (
            <NotifCard
              key={item.id}
              item={item}
              onPress={() => setSelectedNotif(item)}
            />
          ))
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Modal de detalhes */}
      <DetailModal
        notif={selectedNotif}
        onClose={() => setSelectedNotif(null)}
        onStatusChange={handleStatusChange}
        loadingId={loadingId}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
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
  topbarSub: {
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
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  avatarText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },

  // Scroll
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },

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

  // Filtros
  filterScroll: { marginBottom: Spacing.lg },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(15,110,86,0.15)",
    backgroundColor: Colors.white,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },
  filterChipText: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    fontWeight: "500",
  },
  filterChipTextActive: { color: Colors.white, fontWeight: "700" },

  // Section label
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },

  // Card
  card: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    flex: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.gray900,
  },
  cardMeta: { fontSize: FontSize.xs, color: Colors.gray400, marginTop: 2 },
  cardInfo: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginBottom: Spacing.sm,
    marginLeft: 20,
  },
  downloadModalBtn: {
  width: 40,
  height: 40,
  borderRadius: 20,
  alignItems: "center",
  justifyContent: "center",
  marginLeft: Spacing.sm,
},
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.gray50,
    paddingTop: Spacing.sm,
  },
  catBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
  },
  catBadgeText: { fontSize: 10, fontWeight: "600" },
  verDetalhe: {
    fontSize: FontSize.xs,
    color: Colors.teal600,
    fontWeight: "600",
  },

  // Status badge
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

  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray100,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  modalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    flexShrink: 0,
  },
  modalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
  },
  modalMetaText: { fontSize: FontSize.xs, color: Colors.gray400 },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontSize: 14, color: Colors.gray600, fontWeight: "600" },
  modalScroll: { flex: 1 },
  modalContent: { padding: Spacing.lg },

  detailSectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  detailCard: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  downloadBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.white,
  },
  detailLabel: { fontSize: FontSize.sm, color: Colors.gray400 },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.gray900,
    textAlign: "right",
    flex: 1,
    marginLeft: Spacing.md,
  },
  descricaoCard: { padding: Spacing.md },
  descricaoText: {
    fontSize: FontSize.sm,
    color: Colors.gray600 ?? Colors.gray600,
    lineHeight: 22,
  },

  acoesGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  acaoBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: "47%",
    alignItems: "center",
    justifyContent: "center",
  },
  acaoBtnActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },
  acaoBtnText: { fontSize: FontSize.sm, fontWeight: "600" },
});
