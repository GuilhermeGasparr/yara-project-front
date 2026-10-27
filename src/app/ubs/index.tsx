import { NotificationRow } from "@/components/NotificationRow";
import { QuickActionButton } from "@/components/QuickActionbutton";
import { StatsCard } from "@/components/StatsCard";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useFocusEffect } from "expo-router";
import {
  listarNotificacoes,
  Notificacao,
  baixarRelatorioNotificacaoPDF,
} from "@/services/NotificationService";
import { AgenteUser, UBSUser } from "@/types";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  listarNotificacoesUBS,
  NotificacaoUBS,
  baixarRelatorioPDFUBS,
  setEmInvestigacao,
  setVeridico,
  setNaoVeridico,
  setEncerrado,
} from "@/services/UbsService";
import { NotificacaoStatus } from "@/services/NotificationService";

function getSaudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia,";
  if (h < 18) return "Boa tarde,";
  return "Boa noite,";
}

function contarStatus(list: Notificacao[], status: NotificacaoStatus) {
  return list.filter((n) => n.status === status).length;
}

function getInitials(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

// ─── Ícones ───────────────────────────────────────────────────────────────────
function MapIcon() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Feather name="map" size={18} color={Colors.teal600} />
    </View>
  );
}
function PlusIcon() {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: 2,
          height: 18,
          backgroundColor: Colors.white,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          height: 2,
          width: 18,
          backgroundColor: Colors.white,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function UserPlusIcon() {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Feather name="user-plus" size={18} color={Colors.white} />
    </View>
  );
}

function CalendarIcon() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderWidth: 1.8,
        borderColor: Colors.teal600,
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 2,
      }}
    >
      <View style={{ flexDirection: "row", gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: 3,
              height: 3,
              backgroundColor: Colors.teal600,
              borderRadius: 1,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function MapFoldIcon() {
  return (
    <View
      style={{
        width: 20,
        height: 18,
        borderWidth: 1.8,
        borderColor: Colors.teal600,
        borderRadius: 3,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 7,
          width: 1.5,
          backgroundColor: Colors.teal600,
        }}
      />
    </View>
  );
}

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

    case "EM INVESTIGAÇÃO":
      return "Em investigação";

    default:
      return categoria;
  }
}

function formatarStatus(status: string) {
  switch (status) {
    case "EM ANDAMENTO":
      return "Pendente";

    case "EM INVESTIGAÇÃO":
      return "Em investigação";

    case "VERÍDICO":
      return "Verídico";

    case "NÃO VERÍDICO":
      return "Não verídico";

    case "ENCERRADO":
      return "Encerrado";

    default:
      return status;
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "EM INVESTIGAÇÃO":
      return {
        backgroundColor: "#FFF0D8",
        color: "#A15C00",
      };

    case "VERÍDICO":
      return {
        backgroundColor: "#DDF3EC",
        color: "#007C68",
      };

    case "NÃO VERÍDICO":
      return {
        backgroundColor: "#FDE8E8",
        color: "#C62828",
      };

    case "EM ANDAMENTO":
      return {
        backgroundColor: "#E4F0FD",
        color: "#1261A0",
      };

    case "ENCERRADO":
      return {
        backgroundColor: "#F0EEE9",
        color: "#77736A",
      };

    default:
      return {
        backgroundColor: Colors.gray100,
        color: Colors.gray600,
      };
  }
}

function formatarDataCompleta(data: string) {
  if (!data) return "Data não informada";

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) return data;

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function NotificacaoDetailModal({
  item,
  onClose,
  onStatusUpdated,
}: {
  item: Notificacao | null;
  onClose: () => void;
  onStatusUpdated: (id: number) => Promise<void>;
}) {
  const [baixandoRelatorio, setBaixandoRelatorio] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  if (!item) return null;

  const notificacaoId = item.id;
  const statusStyle = getStatusStyle(item.status);
  async function handleBaixarRelatorio() {
    if (baixandoRelatorio) return;

    try {
      setBaixandoRelatorio(true);

      const blob = await baixarRelatorioPDFUBS();

      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `relatorio_ubs_${notificacaoId}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return;
      }
    } catch (error) {
      Alert.alert(
        "Erro ao exportar",
        error instanceof Error
          ? error.message
          : "Não foi possível baixar o relatório.",
      );
    } finally {
      setBaixandoRelatorio(false);
    }
  }
  async function handleAlterarStatus(novoStatus: NotificacaoStatus) {
    const notificacao = item;

    if (!notificacao || alterandoStatus || notificacao.status === novoStatus) {
      return;
    }

    try {
      setAlterandoStatus(true);

      switch (novoStatus) {
        case "EM INVESTIGAÇÃO":
          await setEmInvestigacao(notificacao.id);
          break;

        case "VERÍDICO":
          await setVeridico(notificacao.id);
          break;

        case "NÃO VERÍDICO":
          await setNaoVeridico(notificacao.id);
          break;

        case "ENCERRADO":
          await setEncerrado(notificacao.id);
          break;
      }

      await onStatusUpdated(notificacao.id);

      Alert.alert("Sucesso", "Status atualizado com sucesso.");
    } catch (error) {
      Alert.alert(
        "Erro ao alterar status",
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o status.",
      );
    } finally {
      setAlterandoStatus(false);
    }
  }

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        {/* CABEÇALHO */}
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

          <TouchableOpacity
            onPress={handleBaixarRelatorio}
            style={styles.downloadModalBtn}
            disabled={baixandoRelatorio}
            activeOpacity={0.7}
          >
            {baixandoRelatorio ? (
              <ActivityIndicator size="small" color={Colors.teal600} />
            ) : (
              <Feather name="download" size={20} color={Colors.teal600} />
            )}
          </TouchableOpacity>

          <Pressable
            style={styles.modalCloseButton}
            onPress={onClose}
            hitSlop={10}
          >
            <Feather name="x" size={20} color={Colors.gray600} />
          </Pressable>
        </View>

        {/* CONTEÚDO */}
        <FlatList
          data={[1]}
          keyExtractor={() => "details"}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.modalContent}
          renderItem={() => (
            <>
              {/* STATUS */}
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

              {/* AÇÕES DE STATUS */}
              <Text style={styles.detailSectionLabel}>Alterar status</Text>
              <View style={styles.acoesGrid}>
                {(
                  [
                    {
                      label: "✓ Verídico",
                      status: "VERÍDICO",
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
                      label: "✗ Não verídico",
                      status: "NÃO VERÍDICO",
                      bg: "#FDE8E8",
                      border: "#F7C1C1",
                      color: "#C62828",
                    },
                    {
                      label: "■ Encerrado",
                      status: "ENCERRADO",
                      bg: "#F0EEE9",
                      border: "#D9D5CC",
                      color: Colors.gray600,
                    },
                  ] as const
                ).map((acao) => {
                  const isActive = item.status === acao.status;

                  return (
                    <TouchableOpacity
                      key={acao.status}
                      style={[
                        styles.acaoBtn,
                        {
                          backgroundColor: acao.bg,
                          borderColor: acao.border,
                        },
                        isActive && styles.acaoBtnActive,
                      ]}
                      onPress={() =>
                        handleAlterarStatus(acao.status as NotificacaoStatus)
                      }
                      disabled={alterandoStatus || isActive}
                      activeOpacity={0.8}
                    >
                      {alterandoStatus && !isActive ? (
                        <ActivityIndicator size="small" color={acao.color} />
                      ) : (
                        <Text
                          style={[
                            styles.acaoBtnText,
                            {
                              color: isActive ? Colors.white : acao.color,
                            },
                          ]}
                        >
                          {isActive
                            ? `✓ ${formatarStatus(acao.status)} (atual)`
                            : acao.label}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* INFORMAÇÕES */}
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
              {/* CONTINUIDADE */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Continuidade da situação
                </Text>

                <Text style={styles.detailDescription}>
                  {item.continuidade_situacao || "Não informado"}
                </Text>
              </View>
              {/* DESCRIÇÃO */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Descrição</Text>

                <Text style={styles.detailDescription}>
                  {item.descricao || "Não informado"}
                </Text>
              </View>
              {/* ENDEREÇO */}
              {item.endereco && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Endereço</Text>

                  <Text style={styles.detailDescription}>{item.endereco}</Text>
                </View>
              )}
              {/* LOCALIZAÇÃO */}
              {(item.latitude != null || item.longitude != null) && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Localização</Text>

                  <DetailRow
                    label="Latitude"
                    value={
                      item.latitude != null
                        ? String(item.latitude)
                        : "Não informado"
                    }
                  />

                  <DetailRow
                    label="Longitude"
                    value={
                      item.longitude != null
                        ? String(item.longitude)
                        : "Não informado"
                    }
                  />
                </View>
              )}
            </>
          )}
        />

        <Pressable style={styles.modalFooterButton} onPress={onClose}>
          <Text style={styles.modalFooterButtonText}>Fechar relatório</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BellIcon() {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Feather name="bell" size={18} color={Colors.teal600} />
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function UbsHomeScreen() {
  const { user } = useAuth();
  const ubs = user as UBSUser;
  const [notificacaoSelecionada, setNotificacaoSelecionada] =
    useState<Notificacao | null>(null);
  const router = useRouter();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(
    () => ({
      total: notificacoes.length,
      pendentes: contarStatus(notificacoes, "EM ANDAMENTO"),
      investigacao: contarStatus(notificacoes, "EM INVESTIGAÇÃO"),
      veridicos: contarStatus(notificacoes, "VERÍDICO"),
      naoVeridicos: contarStatus(notificacoes, "NÃO VERÍDICO"),
      encerradas: contarStatus(notificacoes, "ENCERRADO"),
    }),
    [notificacoes],
  );

  const recentes = useMemo(
    () =>
      [...notificacoes]
        .sort(
          (a, b) =>
            new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime(),
        )
        .slice(0, 3),
    [notificacoes],
  );

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await listarNotificacoesUBS();
      setNotificacoes(
        data.map((n) => ({
          ...n,
          endereco: n.endereco ?? undefined,
          latitude: n.latitude ?? undefined,
          longitude: n.longitude ?? undefined,
        })),
      );
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );
  const handleStatusUpdated = useCallback(async (id: number) => {
    const data = await listarNotificacoesUBS();
    setNotificacoes(
      data.map((n) => ({
        ...n,
        endereco: n.endereco ?? undefined,
        latitude: n.latitude ?? undefined,
        longitude: n.longitude ?? undefined,
      })),
    );

    const atualizada = data.find((n) => n.id === id);

    if (atualizada) {
      setNotificacaoSelecionada({
        ...atualizada,
        endereco: atualizada.endereco ?? undefined,
        latitude: atualizada.latitude ?? undefined,
        longitude: atualizada.longitude ?? undefined,
      });
    }
  }, []);
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

      {/* Topbar */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.appLabel}>Sentinela Saúde</Text>
          <Text style={styles.topbarTitle}>Início</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push("/ubs/profile")}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <View style={styles.profileBtnInner}>
            <Text style={styles.profileBtnText}>
              {user?.nome ? getInitials(user.nome) : "AG"}
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
        {/* Saudação */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingSub}>{getSaudacao()}</Text>
          <Text style={styles.greetingName}>
            {ubs?.nome ?? "Agente"} · {ubs?.municipio ?? "UBS"}
          </Text>
        </View>

        {/* Stats em duas colunas */}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.teal400} />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StatsCard
                value={stats.total}
                label="Total notif."
                accentColor="#374151"
                backgroundColor="#FFFFFF"
                borderColor="#E5E7EB"
              />
            </View>

            <View style={styles.statItem}>
              <StatsCard
                value={stats.pendentes}
                label="Pendentes"
                accentColor="#B91C1C"
                backgroundColor="#fad4d4"
                borderColor="#fba1a1"
              />
            </View>

            <View style={styles.statItem}>
              <StatsCard
                value={stats.investigacao}
                label="Em investigação"
                accentColor="#C2410C"
                backgroundColor="#f3d5b0"
                borderColor="#ffcd93"
              />
            </View>

            <View style={styles.statItem}>
              <StatsCard
                value={stats.veridicos}
                label="Verídicas"
                accentColor="#15803D"
                backgroundColor="#cafad8"
                borderColor="#88f9af"
              />
            </View>

            <View style={styles.statItem}>
              <StatsCard
                value={stats.naoVeridicos}
                label="Não verídicas"
                accentColor="#6002b9"
                backgroundColor="#e4b1ff"
                borderColor="#e07aff"
              />
            </View>

            <View style={styles.statItem}>
              <StatsCard
                value={stats.encerradas}
                label="Encerradas"
                accentColor="#082367"
                backgroundColor="#e1dfe9"
                borderColor="#aaa3ff"
              />
            </View>
          </View>
        )}

        {/* Ações rápidas */}
        <QuickActionButton
          label="Criar Agente"
          sublabel="Cadastrar novo ACS ou ACE"
          icon={<UserPlusIcon />}
          onPress={() => router.navigate("/ubs/createAgent")}
          primary
          style={styles.primaryBtn}
        />

        <View style={styles.gridRow}>
          <QuickActionButton
            label="Notificações"
            sublabel="Ver todas as ocorrências"
            icon={<BellIcon />}
            onPress={() => router.navigate("/ubs/notificacoes")}
            style={styles.gridItem}
          />
        </View>
        <View style={styles.gridRow}>
          <QuickActionButton
            label="Notificações"
            sublabel="Ver todas as ocorrências"
            icon={<BellIcon />}
            onPress={() => router.navigate("/ubs/notificacoes")}
            style={styles.gridItem}
          />

          <QuickActionButton
            label="Mapa"
            sublabel="Visualizar mapa de ocorrências"
            icon={<MapIcon />}
            onPress={() => router.navigate("/ubs/map")}
            style={styles.gridItem}
          />
        </View>
        {/* Feed */}
        <Text style={styles.sectionLabel}>Atualizações recentes</Text>

        <View style={styles.feedCard}>
          {loading ? (
            <View style={styles.feedCenter}>
              <ActivityIndicator color={Colors.teal400} />
            </View>
          ) : recentes.length === 0 ? (
            <View style={styles.feedCenter}>
              <Text style={styles.feedEmpty}>
                Nenhuma notificação ainda.{"\n"}
                Toque em <Text style={{ fontWeight: "700" }}>
                  Notificações
                </Text>{" "}
                para acompanhar.
              </Text>
            </View>
          ) : (
            recentes.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onPress={() => setNotificacaoSelecionada(item)}
              />
            ))
          )}
        </View>

        {recentes.length > 0 && (
          <TouchableOpacity
            style={styles.verTodasBtn}
            onPress={() => router.navigate("/ubs/notificacoes")}
            activeOpacity={0.7}
          >
            <Text style={styles.verTodasText}>Ver todas as notificações →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <NotificacaoDetailModal
        item={notificacaoSelecionada}
        onClose={() => setNotificacaoSelecionada(null)}
        onStatusUpdated={handleStatusUpdated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
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

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
    zIndex: 1000,
    elevation: 10,
  },

  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "85%",
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: "hidden",
    elevation: 8,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },

  modalHeaderInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },

  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
    marginBottom: 3,
  },

  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.gray900,
    lineHeight: 20,
  },
  modalCategory: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.teal600,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },

  detailSectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  acoesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  acaoBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    width: "48%",
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  acaoBtnActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },

  acaoBtnText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    textAlign: "center",
  },

  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },

  modalProtocol: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bg,
  },

  modalContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  modalStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },

  downloadModalBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF6F3",
    borderWidth: 1,
    borderColor: "#CDE8E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },

  modalStatusText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },

  detailSection: {
    marginBottom: Spacing.lg,
  },
  statusActionButton: {
    minHeight: 46,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },

  statusActionButtonSelected: {
    borderColor: Colors.teal600,
    backgroundColor: "#EAF6F3",
  },

  statusActionButtonDisabled: {
    opacity: 0.65,
  },

  statusActionText: {
    fontSize: FontSize.sm,
    color: Colors.gray900,
    fontWeight: "500",
  },

  statusActionTextSelected: {
    color: Colors.teal600,
    fontWeight: "700",
  },

  detailSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },

  detailDescription: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 22,
  },

  modalFooterButton: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.teal600,
  },

  modalFooterButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  greetingBlock: { marginBottom: Spacing.lg, gap: 2 },
  greetingSub: { fontSize: FontSize.base, color: Colors.gray400 },
  greetingName: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.gray900,
    letterSpacing: -0.4,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },

  statItem: {
    width: "31%",
  },

  loadingRow: {
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  primaryBtn: { marginBottom: Spacing.sm },
  gridRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  gridItem: { flex: 1 },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  feedCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  feedCenter: { paddingVertical: Spacing.xxl, alignItems: "center" },
  feedEmpty: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    textAlign: "center",
    lineHeight: 20,
  },
  verTodasBtn: { alignItems: "center", paddingVertical: Spacing.md },
  verTodasText: {
    fontSize: FontSize.sm,
    color: Colors.teal600,
    fontWeight: "600",
  },
  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  profileBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },

  profileBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
});
