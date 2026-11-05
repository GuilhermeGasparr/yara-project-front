import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Platform } from "react-native";
import { Alert } from "react-native";
import { router } from "expo-router";

import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

import {
  listarNotificacoesVE,
  baixarRelatorioNotificacaoXlsxVE,
  baixarRelatorioXlsxVE,
} from "@/services/VeService";
import { baixarBlob } from "@/utils/downloadFile";
import { formatarDataOcorrencia } from "@/utils/datas";
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

import type { Notificacao } from "@/services/NotificationService";

function normalizar(valor?: string) {
  return (
    valor
      ?.trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") ?? ""
  );
}

function formatarStatus(status: string) {
  switch (normalizar(status)) {
    case "EM ANDAMENTO":
      return "Pendente";

    case "EM INVESTIGACAO":
      return "Em investigação";

    case "VERIDICO":
      return "Verídico";

    case "NAO VERIDICO":
      return "Não verídico";

    case "ENCERRADO":
      return "Encerrado";

    case "PENDENTE":
      return "Pendente";

    default:
      return status || "Não informado";
  }
}

function getStatusStyle(status: string) {
  switch (normalizar(status)) {
    case "EM ANDAMENTO":
      return {
        backgroundColor: "#E4F0FD",
        color: "#1261A0",
      };

    case "EM INVESTIGACAO":
      return {
        backgroundColor: "#FFF0D8",
        color: "#A15C00",
      };

    case "VERIDICO":
      return {
        backgroundColor: "#DDF3EC",
        color: "#007C68",
      };

    case "NAO VERIDICO":
      return {
        backgroundColor: "#FDE8E8",
        color: "#C62828",
      };

    case "ENCERRADO":
      return {
        backgroundColor: "#F0EEE9",
        color: "#77736A",
      };

    default:
      return {
        backgroundColor: Colors.gray50,
        color: Colors.gray600,
      };
  }
}

function getCategoriaStyle(categoria: string) {
  switch (normalizar(categoria)) {
    case "DOENCA":
      return {
        dot: Colors.red400,
        background: "#FDE8E8",
        text: "#C62828",
      };

    case "EPIZOOTIA":
      return {
        dot: "#BA7517",
        background: "#FFF0D8",
        text: "#A15C00",
      };

    case "DESASTRE":
      return {
        dot: "#378ADD",
        background: "#E4F0FD",
        text: "#1261A0",
      };

    default:
      return {
        dot: Colors.teal400,
        background: Colors.gray50,
        text: Colors.gray600,
      };
  }
}

function formatarAfetados(quantidade: number, categoria: string) {
  if (normalizar(categoria) === "EPIZOOTIA") {
    return `${quantidade} animais afetados`;
  }

  return `${quantidade} pessoas afetadas`;
}

interface NotificationCardProps {
  item: Notificacao;
  onPress: () => void;
}

function NotificationCard({ item, onPress }: NotificationCardProps) {
  const categoria = getCategoriaStyle(item.categoria);
  const status = getStatusStyle(item.status);

  const isPending = normalizar(item.status) === "EM ANDAMENTO";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.notificationCard,
        isPending && styles.notificationCardPending,
        pressed && styles.notificationCardPressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View
            style={[
              styles.categoryDot,
              {
                backgroundColor: categoria.dot,
              },
            ]}
          />

          <View style={styles.cardTitleContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.tipo_evento}
            </Text>

            <Text style={styles.cardMeta}>
              {formatarDataOcorrencia(item.data_ocorrencia, { comAno: true })} ·{" "}
              {item.municipio || "Município não informado"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: status.backgroundColor,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: status.color,
              },
            ]}
          >
            {formatarStatus(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: categoria.background,
            },
          ]}
        >
          <Text
            style={[
              styles.categoryBadgeText,
              {
                color: categoria.text,
              },
            ]}
          >
            {item.categoria}
          </Text>
        </View>

        <Text style={styles.affectedText}>
          {formatarAfetados(
            item.pessoas_animais_infectados_afetados,
            item.categoria,
          )}
        </Text>

        <Text style={styles.notificationId}>
          #{String(item.id).padStart(4, "0")}
        </Text>
      </View>
    </Pressable>
  );
}

interface DetailModalProps {
  item: Notificacao | null;
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

function NotificacaoDetailModal({ item, onClose }: DetailModalProps) {
  const [visible, setVisible] = useState(false);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const [exportando, setExportando] = useState(false);

  async function handleExportar() {
    if (!item || exportando) return;

    try {
      setExportando(true);

      const blob = await baixarRelatorioNotificacaoXlsxVE(item.id);

      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `notificacao_${item.id}.xlsx`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      } else {
        Alert.alert(
          "Relatório recebido",
          "A planilha foi gerada, mas o salvamento no dispositivo precisa ser implementado.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Erro ao exportar",
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o relatório.",
      );
    } finally {
      setExportando(false);
    }
  }

  useEffect(() => {
    if (!item) return;

    setVisible(true);

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 180,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 18,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
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

  if (!item || !visible) {
    return null;
  }

  const categoria = getCategoriaStyle(item.categoria);

  const dataFormatada = new Date(item.data_envio).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <View style={styles.modalRoot}>
        <Animated.View
          style={[
            styles.modalBackdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        />

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
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.detailCategoryRow}>
                <View
                  style={[
                    styles.detailDot,
                    {
                      backgroundColor: categoria.dot,
                    },
                  ]}
                />

                <Text style={styles.detailCategory}>{item.categoria}</Text>
              </View>

              <Text style={styles.detailTitle}>{item.tipo_evento}</Text>

              <Text style={styles.detailId}>
                Notificação #{String(item.id).padStart(4, "0")}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportar}
              disabled={exportando}
              activeOpacity={0.8}
            >
              {exportando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Feather name="download" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>

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
            <View style={styles.detailStatusRow}>
              <Text style={styles.detailSectionTitle}>Status</Text>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusStyle(item.status).backgroundColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: getStatusStyle(item.status).color,
                    },
                  ]}
                >
                  {formatarStatus(item.status)}
                </Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                Informações da ocorrência
              </Text>

              <DetailRow label="Tipo de evento" value={item.tipo_evento} />
              <DetailRow label="Categoria" value={item.categoria} />
              <DetailRow label="Data de envio" value={dataFormatada} />
              <DetailRow
                label="Data da ocorrência"
                value={formatarDataOcorrencia(item.data_ocorrencia, { comAno: true })}
              />
              <DetailRow label="Estado" value={item.estado ?? ""} />
              <DetailRow label="Município" value={item.municipio ?? ""} />
              <DetailRow
                label="Local da ocorrência"
                value={item.local_ocorrencia}
              />
              <DetailRow
                label="Pessoas / animais afetados"
                value={String(item.pessoas_animais_infectados_afetados)}
              />
            </View>

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

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Descrição detalhada</Text>

              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionText}>
                  {item.descricao || "Nenhuma descrição informada."}
                </Text>
              </View>
            </View>

            <View style={{ height: Spacing.xl }} />
          </ScrollView>

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

type DropdownAberto = "SUPERINTENDENCIA" | "COADS" | null;

interface DropdownFilterProps {
  label: string;
  todasLabel: string;
  valor: string;
  opcoes: string[];
  aberto: boolean;
  onToggle: () => void;
  onSelect: (valor: string) => void;
}

/** Lista suspensa com opção "Todas" (valor "TODAS"), usada em COADS e Superintendência. */
function DropdownFilter({
  label,
  todasLabel,
  valor,
  opcoes,
  aberto,
  onToggle,
  onSelect,
}: DropdownFilterProps) {
  const ativo = valor !== "TODAS";

  return (
    <View style={styles.coadsFilterContainer}>
      <Text style={styles.filterLabel}>{label}</Text>

      <Pressable
        style={[styles.coadsButton, ativo && styles.coadsButtonActive]}
        onPress={onToggle}
      >
        <Text
          style={[styles.coadsButtonText, ativo && styles.coadsButtonTextActive]}
          numberOfLines={1}
        >
          {ativo ? valor : todasLabel}
        </Text>

        <Feather
          name={aberto ? "chevron-up" : "chevron-down"}
          size={18}
          color={ativo ? Colors.white : Colors.teal600}
        />
      </Pressable>

      {aberto && (
        <View style={styles.coadsDropdown}>
          <ScrollView
            nestedScrollEnabled
            style={styles.coadsDropdownScroll}
            keyboardShouldPersistTaps="handled"
          >
            {["TODAS", ...opcoes].map((opcao) => {
              const selecionada = valor === opcao;

              return (
                <Pressable
                  key={opcao}
                  style={[
                    styles.coadsOption,
                    selecionada && styles.coadsOptionSelected,
                  ]}
                  onPress={() => onSelect(opcao)}
                >
                  <Text
                    style={[
                      styles.coadsOptionText,
                      selecionada && styles.coadsOptionTextSelected,
                    ]}
                  >
                    {opcao === "TODAS" ? todasLabel : opcao}
                  </Text>

                  {selecionada && (
                    <Feather name="check" size={16} color={Colors.teal600} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function EstadualNotificationsScreen() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODOS");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");

  const [superintendenciaFiltro, setSuperintendenciaFiltro] = useState("TODAS");
  const [coadsFiltro, setCoadsFiltro] = useState("TODAS");
  const [dropdownAberto, setDropdownAberto] = useState<DropdownAberto>(null);

  // Período (YYYY-MM-DD); vazio = sem limite
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [selectedNotification, setSelectedNotification] =
    useState<Notificacao | null>(null);

  const [exportandoTodas, setExportandoTodas] = useState(false);

  async function handleExportarTodas() {
    if (exportandoTodas) return;

    if (periodoInvalido(dataInicio, dataFim)) {
      Alert.alert(
        "Período inválido",
        "A data início não pode ser posterior à data fim.",
      );
      return;
    }

    try {
      setExportandoTodas(true);

      const blob = await baixarRelatorioXlsxVE({
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        categoria: valorFiltro(categoriaFiltro, "TODOS"),
        status: valorFiltro(statusFiltro, "TODOS"),
        coads: valorFiltro(coadsFiltro, "TODAS"),
        superintendencia: valorFiltro(superintendenciaFiltro, "TODAS"),
      });

      baixarBlob(blob, "notificacoes_estadual.xlsx");
    } catch (error) {
      Alert.alert(
        "Erro ao exportar",
        error instanceof Error
          ? error.message
          : "Não foi possível exportar as notificações.",
      );
    } finally {
      setExportandoTodas(false);
    }
  }

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await listarNotificacoesVE();

      setNotificacoes(data);
    } catch (error) {
      console.error("Erro ao carregar notificações VE:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const superintendenciasDisponiveis = useMemo(() => {
    return [
      ...new Set(
        notificacoes
          .map((item) => item.superintendencia?.trim())
          .filter((nome): nome is string => Boolean(nome)),
      ),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [notificacoes]);

  // Com uma superintendência escolhida, só as COADS dela aparecem
  const coadsPorSuperintendencia = useCallback(
    (superintendencia: string) => {
      return [
        ...new Set(
          notificacoes
            .filter(
              (item) =>
                superintendencia === "TODAS" ||
                normalizar(item.superintendencia) ===
                  normalizar(superintendencia),
            )
            .map((item) => item.coads?.trim())
            .filter((coads): coads is string => Boolean(coads)),
        ),
      ].sort((a, b) => a.localeCompare(b, "pt-BR"));
    },
    [notificacoes],
  );

  const coadsDisponiveis = useMemo(
    () => coadsPorSuperintendencia(superintendenciaFiltro),
    [coadsPorSuperintendencia, superintendenciaFiltro],
  );

  function selecionarSuperintendencia(superintendencia: string) {
    setSuperintendenciaFiltro(superintendencia);
    setDropdownAberto(null);

    // A COADS escolhida some da lista se não for da nova superintendência
    if (
      coadsFiltro !== "TODAS" &&
      !coadsPorSuperintendencia(superintendencia).includes(coadsFiltro)
    ) {
      setCoadsFiltro("TODAS");
    }
  }

  const notificacoesFiltradas = useMemo(() => {
    const buscaNormalizada = normalizar(busca);

    return notificacoes.filter((item) => {
      const textoBusca = normalizar(
        `${item.tipo_evento} ${item.municipio ?? ""} ${
          item.nome ?? ""
        } ${item.id}`,
      );

      const correspondeBusca =
        !buscaNormalizada || textoBusca.includes(buscaNormalizada);

      const correspondeSuperintendencia =
        superintendenciaFiltro === "TODAS" ||
        normalizar(item.superintendencia) ===
          normalizar(superintendenciaFiltro);

      const correspondeCoads =
        coadsFiltro === "TODAS" ||
        normalizar(item.coads) === normalizar(coadsFiltro);

      return (
        correspondeBusca &&
        correspondeCategoria(item.categoria, categoriaFiltro) &&
        correspondeStatus(item.status, statusFiltro) &&
        correspondeSuperintendencia &&
        correspondeCoads &&
        dentroDoPeriodo(item.data_ocorrencia, dataInicio, dataFim)
      );
    });
  }, [
    notificacoes,
    busca,
    categoriaFiltro,
    statusFiltro,
    superintendenciaFiltro,
    coadsFiltro,
    dataInicio,
    dataFim,
  ]);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
        >
          <View style={styles.backArrow} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerLabel}>Vigilância Estadual</Text>
          <Text style={styles.headerTitle}>Notificações</Text>
        </View>

        <ExportHeaderButton
          onPress={handleExportarTodas}
          loading={exportandoTodas}
        />
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
        {/* Busca */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por evento ou município..."
            placeholderTextColor={Colors.gray400}
            style={styles.searchInput}
          />

          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca("")}>
              <Text style={styles.clearSearch}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Superintendência */}
        <DropdownFilter
          label="Superintendência"
          todasLabel="Todas as superintendências"
          valor={superintendenciaFiltro}
          opcoes={superintendenciasDisponiveis}
          aberto={dropdownAberto === "SUPERINTENDENCIA"}
          onToggle={() =>
            setDropdownAberto((atual) =>
              atual === "SUPERINTENDENCIA" ? null : "SUPERINTENDENCIA",
            )
          }
          onSelect={selecionarSuperintendencia}
        />

        {/* COADS */}
        <DropdownFilter
          label="COADS"
          todasLabel="Todas as COADS"
          valor={coadsFiltro}
          opcoes={coadsDisponiveis}
          aberto={dropdownAberto === "COADS"}
          onToggle={() =>
            setDropdownAberto((atual) => (atual === "COADS" ? null : "COADS"))
          }
          onSelect={(coads) => {
            setCoadsFiltro(coads);
            setDropdownAberto(null);
          }}
        />

        {/* Período */}
        <DateRangeFilter
          inicio={dataInicio}
          fim={dataFim}
          onChange={(inicio, fim) => {
            setDataInicio(inicio);
            setDataFim(fim);
          }}
        />

        {/* Categorias */}
        <FilterChipGroup
          label="Categoria"
          options={CATEGORIAS_FILTRO}
          selected={categoriaFiltro}
          onSelect={setCategoriaFiltro}
        />

        {/* Status */}
        <FilterChipGroup
          label="Status"
          options={STATUS_FILTRO}
          selected={statusFiltro}
          onSelect={setStatusFiltro}
        />

        {/* Contador */}
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionLabel}>Registros</Text>

          <Text style={styles.resultCount}>{notificacoesFiltradas.length}</Text>
        </View>

        {/* Lista */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.teal400} />

            <Text style={styles.loadingText}>Carregando notificações...</Text>
          </View>
        ) : notificacoesFiltradas.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📋</Text>

            <Text style={styles.emptyTitle}>
              Nenhuma notificação encontrada
            </Text>

            <Text style={styles.emptyText}>
              Tente alterar os filtros ou a busca.
            </Text>
          </View>
        ) : (
          notificacoesFiltradas.map((item) => (
            <NotificationCard
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  header: {
    backgroundColor: Colors.teal600,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  backArrow: {
    width: 9,
    height: 9,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.white,
    transform: [{ rotate: "45deg" }, { translateX: 2 }],
  },

  headerLabel: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },

  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: Spacing.lg,
  },

  searchBox: {
    minHeight: 48,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.1)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },

  searchIcon: {
    fontSize: 22,
    color: Colors.gray400,
    marginRight: Spacing.sm,
  },

  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gray900,
  },

  clearSearch: {
    fontSize: 24,
    color: Colors.gray400,
    paddingLeft: Spacing.sm,
  },

  filterLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: "#0F6E56",
  },

  coadsFilterContainer: {
    marginBottom: Spacing.md,
    zIndex: 10,
  },

  coadsButton: {
    minHeight: 46,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.15)",
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },

  coadsButtonActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },

  coadsButtonText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.teal600,
  },

  coadsButtonTextActive: {
    color: Colors.white,
  },

  coadsDropdown: {
    marginTop: 6,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: Radius.md,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },

  coadsDropdownScroll: {
    maxHeight: 220,
  },

  coadsOption: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray100,
  },

  coadsOptionSelected: {
    backgroundColor: Colors.teal50,
  },

  coadsOptionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },

  coadsOptionTextSelected: {
    color: Colors.teal600,
    fontWeight: "700",
  },

  exportButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  resultCount: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.teal50,
    color: Colors.teal600,
    fontSize: FontSize.xs,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
  },

  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  notificationCardPending: {
    borderLeftWidth: 3,
    borderLeftColor: "#BA7517",
  },

  notificationCardPressed: {
    transform: [
      {
        scale: 0.985,
      },
    ],
    opacity: 0.92,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: Spacing.sm,
  },

  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },

  cardTitleContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.gray900,
  },

  cardMeta: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  affectedText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },

  notificationId: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gray400,
  },

  loadingWrap: {
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.md,
  },

  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
  },

  emptyWrap: {
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },

  emptyEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },

  emptyTitle: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.gray900,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    fontSize: FontSize.sm,
    color: Colors.gray400,
    textAlign: "center",
  },

  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(5,35,29,0.55)",
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
    borderBottomColor: Colors.gray100,
  },

  detailCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  detailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  detailCategory: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray600,
    textTransform: "uppercase",
  },

  detailTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
  },

  detailId: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginTop: 2,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  closeBtnText: {
    fontSize: 20,
    color: Colors.gray600,
    fontWeight: "600",
    lineHeight: 20,
  },

  detailScroll: {
    flex: 1,
  },

  detailContent: {
    padding: Spacing.lg,
  },

  detailStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },

  detailSection: {
    marginBottom: Spacing.lg,
  },

  detailSectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray100,
  },

  detailLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },

  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.gray900,
    maxWidth: "60%",
    textAlign: "right",
  },

  descriptionBox: {
    backgroundColor: Colors.gray50,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },

  descriptionText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },

  detailFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.white,
  },

  detailCloseButton: {
    backgroundColor: Colors.teal600,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: "center",
  },

  detailCloseButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
});