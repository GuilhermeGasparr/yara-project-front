import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Alert,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

import {
  listarNotificacoesUBS,
  NotificacaoUBS,
  NotificacaoStatus,
  baixarRelatorioNotificacaoXlsxUBS,
  baixarRelatorioXlsxUBS,
  deletarNotificacao,
  setEmInvestigacao,
  setVeridico,
  setNaoVeridico,
  setEncerrado,
} from "@/services/UbsService";
import { baixarBlob } from "@/utils/downloadFile";
import { formatarDataOcorrencia } from "@/utils/datas";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { DeleteNotificationButton } from "@/components/DeleteNotificationButton";
import { ExportHeaderButton } from "@/components/ExportHeaderButton";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { FilterChipGroup } from "@/components/filters/FilterChipGroup";
import {
  CATEGORIAS_FILTRO,
  STATUS_FILTRO,
  correspondeCategoria,
  correspondeStatus,
  dentroDoPeriodo,
  periodoInvalido,
  valorFiltro,
} from "@/utils/filtros";

export default function NotificacoesUBSScreen() {
  const [agenteFiltro, setAgenteFiltro] = useState<number | null>(null);
  const [notificacoes, setNotificacoes] = useState<NotificacaoUBS[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODOS");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");

  // Período (YYYY-MM-DD); vazio = sem limite
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificacaoUBS | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarOpcoesAgentes, setMostrarOpcoesAgentes] = useState(false);
  const [exportando, setExportando] = useState(false);

  async function handleExportarTodas() {
    if (exportando) return;

    if (periodoInvalido(dataInicio, dataFim)) {
      Alert.alert(
        "Período inválido",
        "A data início não pode ser posterior à data fim.",
      );
      return;
    }

    try {
      setExportando(true);

      const blob = await baixarRelatorioXlsxUBS({
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        categoria: valorFiltro(categoriaFiltro, "TODOS"),
        status: valorFiltro(statusFiltro, "TODOS"),
        agente_id: agenteFiltro,
      });

      baixarBlob(blob, "notificacoes_ubs.xlsx");
    } catch (error) {
      Alert.alert(
        "Erro ao exportar",
        error instanceof Error
          ? error.message
          : "Não foi possível exportar as notificações.",
      );
    } finally {
      setExportando(false);
    }
  }

  const handleStatusUpdated = useCallback(async (id: number) => {
    const dados = await listarNotificacoesUBS();

    setNotificacoes(dados);

    const atualizada = dados.find((notificacao) => notificacao.id === id);

    setSelectedNotification(atualizada ?? null);
  }, []);

  const handleDeleted = useCallback((id: number) => {
    setNotificacoes((prev) => prev.filter((n) => n.id !== id));
    setSelectedNotification(null);
  }, []);

  const carregarNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const dados = await listarNotificacoesUBS();
      setNotificacoes(dados);
    } catch (error) {
      console.error("Erro ao carregar notificações da UBS:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar notificações.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  const agentes = useMemo(() => {
    const mapa = new Map<number, string>();

    notificacoes.forEach((item) => {
      if (item.acs_ace_id != null) {
        mapa.set(
          item.acs_ace_id,
          item.acs_ace_nome?.trim() || `Agente #${item.acs_ace_id}`,
        );
      }
    });

    return Array.from(mapa, ([id, nome]) => ({ id, nome })).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [notificacoes]);

  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter(
      (item) =>
        correspondeCategoria(item.categoria, categoriaFiltro) &&
        correspondeStatus(item.status, statusFiltro) &&
        (agenteFiltro === null || Number(item.acs_ace_id) === agenteFiltro) &&
        dentroDoPeriodo(item.data_ocorrencia, dataInicio, dataFim),
    );
  }, [notificacoes, categoriaFiltro, statusFiltro, agenteFiltro, dataInicio, dataFim]);

  const renderNotificacao = ({ item }: { item: NotificacaoUBS }) => {
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
            {item.nome}
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

        {/* Data + tipo */}
        <Text style={styles.metadata}>
          {formatarDataOcorrencia(item.data_ocorrencia, { comAno: true })} • {item.tipo_evento}
        </Text>

        {/* Local + afetados */}
        <Text style={styles.description} numberOfLines={2}>
          {formatarAfetados(
            item.pessoas_animais_infectados_afetados,
            item.categoria,
          )}{" "}
          • {item.local_ocorrencia}
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
              {item.categoria}
            </Text>
          </View>

          <Text style={styles.notificationId}>#{item.id} →</Text>
        </View>
      </Pressable>
    );
  };

  const filtrosHeader = (
    <View style={styles.filtersBlock}>
      <View style={styles.agentFilterContainer}>
        <Pressable
          style={[
            styles.agentFilterButton,
            agenteFiltro !== null && styles.agentFilterButtonSelected,
          ]}
          onPress={() => setMostrarOpcoesAgentes((anterior) => !anterior)}
        >
          <Feather
            name="filter"
            size={16}
            color={agenteFiltro !== null ? Colors.white : Colors.teal800}
          />

          <Text
            style={[
              styles.agentFilterButtonText,
              agenteFiltro !== null && styles.agentFilterButtonTextSelected,
            ]}
            numberOfLines={1}
          >
            {agenteFiltro === null
              ? "Agentes"
              : (agentes.find((agente) => agente.id === agenteFiltro)?.nome ??
                "Agentes")}
          </Text>

          <Feather
            name={mostrarOpcoesAgentes ? "chevron-up" : "chevron-down"}
            size={16}
            color={agenteFiltro !== null ? Colors.white : Colors.teal800}
          />
        </Pressable>

        {mostrarOpcoesAgentes && (
          <View style={styles.agentDropdown}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
              {[
                { id: null as number | null, nome: "Todos os agentes" },
                ...agentes,
              ].map((agente) => {
                const selecionado = agenteFiltro === agente.id;

                return (
                  <Pressable
                    key={agente.id === null ? "todos" : agente.id.toString()}
                    style={[
                      styles.agentOption,
                      selecionado && styles.agentOptionSelected,
                    ]}
                    onPress={() => {
                      setAgenteFiltro(agente.id);
                      setMostrarOpcoesAgentes(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.agentOptionText,
                        selecionado && styles.agentOptionTextSelected,
                      ]}
                    >
                      {agente.nome}
                    </Text>

                    {selecionado && (
                      <Feather
                        name="check"
                        size={16}
                        color={Colors.teal800}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <DateRangeFilter
        inicio={dataInicio}
        fim={dataFim}
        onChange={(inicio, fim) => {
          setDataInicio(inicio);
          setDataFim(fim);
        }}
      />

      <FilterChipGroup
        label="Categoria"
        options={CATEGORIAS_FILTRO}
        selected={categoriaFiltro}
        onSelect={setCategoriaFiltro}
      />

      <FilterChipGroup
        label="Status"
        options={STATUS_FILTRO}
        selected={statusFiltro}
        onSelect={setStatusFiltro}
      />
    </View>
  );

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

        <Text style={styles.headerTitle}>Notificações da UBS</Text>

        <ExportHeaderButton
          onPress={handleExportarTodas}
          loading={exportando}
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
          ListHeaderComponent={filtrosHeader}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: Spacing.md,
              }}
            />
          )}
          refreshing={loading}
          onRefresh={carregarNotificacoes}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="inbox" size={42} color={Colors.gray400} />
              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptyText}>
                Não existem notificações para esse filtro.
              </Text>
            </View>
          }
        />
      )}

      <NotificacaoUBSDetailModal
        item={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onStatusUpdated={handleStatusUpdated}
        onDeleted={handleDeleted}
      />
    </SafeAreaView>
  );
}

function formatarDataCompleta(data: string) {
  if (!data) {
    return "Data não informada";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return data;
  }

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

function NotificacaoUBSDetailModal({
  item,
  onClose,
  onStatusUpdated,
  onDeleted,
}: {
  item: NotificacaoUBS | null;
  onClose: () => void;
  onStatusUpdated: (id: number) => Promise<void>;
  onDeleted: (id: number) => void;
}) {
  const [baixandoRelatorio, setBaixandoRelatorio] = useState(false);
  const [alterandoStatus, setAlterandoStatus] = useState(false);
  // Troca de status aguardando confirmação (guarda "de" e "para" para o texto).
  const [statusPendente, setStatusPendente] = useState<{
    de: string;
    para: NotificacaoStatus;
  } | null>(null);
  const [confirmarStatusAberto, setConfirmarStatusAberto] = useState(false);
  if (!item) return null;

  // Lança erro para o diálogo de confirmação exibir a mensagem.
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

      Alert.alert("Sucesso", "Status da notificação atualizado.");
    } finally {
      setAlterandoStatus(false);
    }
  }

  const notificacaoId = item.id;
  const statusStyle = getStatusStyle(item.status);
  async function handleBaixarRelatorio() {
    if (baixandoRelatorio) return;

    try {
      setBaixandoRelatorio(true);

      const blob = await baixarRelatorioNotificacaoXlsxUBS(notificacaoId);

      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `notificacao_${notificacaoId}.xlsx`;

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

          <DeleteNotificationButton
            protocolo={notificacaoId}
            style={{ marginRight: Spacing.sm }}
            onConfirm={async () => {
              await deletarNotificacao(notificacaoId);
              onDeleted(notificacaoId);
            }}
          />

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
                      onPress={() => {
                        setStatusPendente({
                          de: item.status,
                          para: acao.status as NotificacaoStatus,
                        });
                        setConfirmarStatusAberto(true);
                      }}
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
                  label="Data da ocorrência"
                  value={formatarDataOcorrencia(item.data_ocorrencia, { comAno: true })}
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

                {item.acs_ace_nome && (
                  <DetailRow
                    label="Responsável (ACS/ACE)"
                    value={item.acs_ace_nome}
                  />
                )}
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
            </>
          )}
        />

        <Pressable style={styles.modalFooterButton} onPress={onClose}>
          <Text style={styles.modalFooterButtonText}>Fechar relatório</Text>
        </Pressable>
      </View>

      <ConfirmActionDialog
        visible={confirmarStatusAberto}
        onClose={() => setConfirmarStatusAberto(false)}
        onConfirm={async () => {
          if (statusPendente) {
            await handleAlterarStatus(statusPendente.para);
          }
        }}
        icon="refresh-cw"
        title="Alterar status?"
        message={`O status da notificação #${String(notificacaoId).padStart(4, "0")} passará de "${formatarStatus(statusPendente?.de ?? "")}" para "${formatarStatus(statusPendente?.para ?? "")}".`}
        confirmLabel="Confirmar"
      />
    </View>
  );
}

/* =========================================================
   HELPERS
========================================================= */

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

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8F7",
  },

  header: {
    height: 66,
    backgroundColor: Colors.teal800,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
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

  filtersBlock: {
    marginBottom: Spacing.md,
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

  agentFilterContainer: {
    paddingBottom: Spacing.md,
    position: "relative",
    zIndex: 10,
  },

  agentFilterButton: {
    alignSelf: "flex-start",
    minHeight: 38,
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D5E2DF",
    backgroundColor: Colors.white,
  },

  agentFilterButtonSelected: {
    backgroundColor: Colors.teal800,
    borderColor: Colors.teal800,
  },

  agentFilterButtonText: {
    color: Colors.teal800,
    fontSize: FontSize.sm,
    fontWeight: "600",
    flexShrink: 1,
  },

  agentFilterButtonTextSelected: {
    color: Colors.white,
  },

  agentDropdown: {
    marginTop: 6,
    alignSelf: "flex-start",
    width: 260,
    maxWidth: "100%",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#D5E2DF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },

  agentOption: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5EEEB",
  },

  monthFilterButtonSelected: {
    backgroundColor: Colors.teal800,
    borderColor: Colors.teal800,
  },

  monthFilterButtonText: {
    color: Colors.teal800,
    fontSize: FontSize.sm,
    fontWeight: "600",
    flexShrink: 1,
  },

  monthFilterButtonTextSelected: {
    color: Colors.white,
  },
  agentOptionSelected: {
    backgroundColor: "#E8F5F1",
  },

  agentOptionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gray600,
    marginRight: 8,
  },

  agentOptionTextSelected: {
    color: Colors.teal800,
    fontWeight: "700",
  },

  agentFilterTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.gray600,
    marginBottom: Spacing.sm,
  },

  agentModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },

  agentDropdownList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    maxHeight: "65%",
    overflow: "hidden",
  },

  agentDropdownHeader: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.gray800,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },

  agentDropdownOption: {
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  agentDropdownOptionText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.gray800,
    marginRight: Spacing.sm,
  },

  agentDropdownOptionSelected: {
    fontWeight: "600",
    color: Colors.gray600,
  },

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

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2EBE8",
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
    color: Colors.gray900,
  },

  modalProtocol: {
    marginTop: 4,
    fontSize: FontSize.xs,
    color: Colors.gray600,
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },

  modalContent: {
    paddingVertical: Spacing.md,
    paddingBottom: 10,
  },

  modalStatus: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: Spacing.md,
  },

  modalStatusText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },

  detailSection: {
    marginBottom: Spacing.lg,
  },

  detailSectionTitle: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: 10,
  },

  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3F1",
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

  detailDescription: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 21,
  },

  modalFooterButton: {
    height: 46,
    borderRadius: Radius.sm,
    backgroundColor: Colors.teal800,
    alignItems: "center",
    justifyContent: "center",
  },

  modalFooterButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "700",
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

  statusActions: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },

  statusActionButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: "#CDE8E1",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  statusActionButtonSelected: {
    backgroundColor: "#EAF6F3",
    borderColor: Colors.teal600,
  },

  statusActionText: {
    color: Colors.teal800,
    fontSize: FontSize.sm,
    fontWeight: "600",
    textAlign: "center",
  },

  statusActionTextSelected: {
    color: Colors.teal600,
    fontWeight: "700",
  },

  statusActionDisabled: {
    opacity: 0.6,
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

  notificationId: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
  },

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
});
