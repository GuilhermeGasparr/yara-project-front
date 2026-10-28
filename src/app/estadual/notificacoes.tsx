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
import { ExportHeaderButton } from "@/components/ExportHeaderButton";

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

function formatarData(data: string) {
  if (!data) return "Data não informada";

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return data;
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
              {formatarData(item.data_envio)} ·{" "}
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

export default function EstadualNotificationsScreen() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODOS");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");

  const [coadsFiltro, setCoadsFiltro] = useState("TODAS");
  const [mostrarOpcoesCoads, setMostrarOpcoesCoads] = useState(false);

  // Estados do Filtro por Mês
  const [mesFiltro, setMesFiltro] = useState("TODOS");
  const [mostrarOpcoesMes, setMostrarOpcoesMes] = useState(false);

  const [selectedNotification, setSelectedNotification] =
    useState<Notificacao | null>(null);

  const [exportandoTodas, setExportandoTodas] = useState(false);

  async function handleExportarTodas() {
    if (exportandoTodas) return;

    try {
      setExportandoTodas(true);

      const blob = await baixarRelatorioXlsxVE();

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

  const coadsDisponiveis = useMemo(() => {
    return [
      ...new Set(
        notificacoes
          .map((item) => item.coads?.trim())
          .filter((coads): coads is string => Boolean(coads)),
      ),
    ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [notificacoes]);

  // Meses disponíveis extraídos das notificações
  const mesesDisponiveis = useMemo(() => {
    const meses = new Map<string, string>();

    notificacoes.forEach((item) => {
      if (!item.data_envio) return;

      const data = new Date(item.data_envio);

      if (Number.isNaN(data.getTime())) return;

      const valor = `${data.getFullYear()}-${String(
        data.getMonth() + 1,
      ).padStart(2, "0")}`;

      const nome = data.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });

      meses.set(valor, nome.charAt(0).toUpperCase() + nome.slice(1));
    });

    return Array.from(meses, ([valor, nome]) => ({
      valor,
      nome,
    })).sort((a, b) => b.valor.localeCompare(a.valor));
  }, [notificacoes]);

  function normalizarStatusFiltro(status?: string) {
    const valor = normalizar(status);

    switch (valor) {
      case "PENDENTE":
      case "EM ANDAMENTO":
        return "PENDENTE";

      case "EM INVESTIGACAO":
        return "EM INVESTIGACAO";

      case "VERIDICO":
      case "CONFIRMADO":
        return "VERIDICO";

      case "NAO VERIDICO":
      case "DESCARTADO":
        return "NAO VERIDICO";

      case "ENCERRADO":
        return "ENCERRADO";

      default:
        return valor;
    }
  }

  const notificacoesFiltradas = useMemo(() => {
    const buscaNormalizada = normalizar(busca);

    return notificacoes.filter((item) => {
      const categoria = normalizar(item.categoria);
      const status = normalizarStatusFiltro(item.status);

      const textoBusca = normalizar(
        `${item.tipo_evento} ${item.municipio ?? ""} ${
          item.nome ?? ""
        } ${item.id}`,
      );

      const correspondeCoads =
        coadsFiltro === "TODAS" ||
        normalizar(item.coads) === normalizar(coadsFiltro);

      // Filtro por Mês
      let correspondeMes = true;
      if (mesFiltro !== "TODOS") {
        if (!item.data_envio) {
          correspondeMes = false;
        } else {
          const data = new Date(item.data_envio);
          if (Number.isNaN(data.getTime())) {
            correspondeMes = false;
          } else {
            const valorMes = `${data.getFullYear()}-${String(
              data.getMonth() + 1,
            ).padStart(2, "0")}`;
            correspondeMes = valorMes === mesFiltro;
          }
        }
      }

      const correspondeBusca =
        !buscaNormalizada || textoBusca.includes(buscaNormalizada);

      const correspondeCategoria =
        categoriaFiltro === "TODOS" ||
        categoria === normalizar(categoriaFiltro);

      const correspondeStatus =
        statusFiltro === "TODOS" ||
        status === normalizarStatusFiltro(statusFiltro);

      return (
        correspondeBusca &&
        correspondeCategoria &&
        correspondeStatus &&
        correspondeCoads &&
        correspondeMes
      );
    });
  }, [notificacoes, busca, categoriaFiltro, statusFiltro, coadsFiltro, mesFiltro]);

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

        {/* Filtro de COADS */}
        <View style={styles.coadsFilterContainer}>
          <Text style={styles.filterLabel}>COADS</Text>

          <Pressable
            style={[
              styles.coadsButton,
              coadsFiltro !== "TODAS" && styles.coadsButtonActive,
            ]}
            onPress={() => {
              setMostrarOpcoesCoads((anterior) => !anterior);
              setMostrarOpcoesMes(false);
            }}
          >
            <Text
              style={[
                styles.coadsButtonText,
                coadsFiltro !== "TODAS" && styles.coadsButtonTextActive,
              ]}
              numberOfLines={1}
            >
              {coadsFiltro === "TODAS" ? "Todas as COADS" : coadsFiltro}
            </Text>

            <Feather
              name={mostrarOpcoesCoads ? "chevron-up" : "chevron-down"}
              size={18}
              color={coadsFiltro !== "TODAS" ? Colors.white : Colors.teal600}
            />
          </Pressable>

          {mostrarOpcoesCoads && (
            <View style={styles.coadsDropdown}>
              <ScrollView
                nestedScrollEnabled
                style={styles.coadsDropdownScroll}
                keyboardShouldPersistTaps="handled"
              >
                {["TODAS", ...coadsDisponiveis].map((coads) => {
                  const selecionada = coadsFiltro === coads;

                  return (
                    <Pressable
                      key={coads}
                      style={[
                        styles.coadsOption,
                        selecionada && styles.coadsOptionSelected,
                      ]}
                      onPress={() => {
                        setCoadsFiltro(coads);
                        setMostrarOpcoesCoads(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.coadsOptionText,
                          selecionada && styles.coadsOptionTextSelected,
                        ]}
                      >
                        {coads === "TODAS" ? "Todas as COADS" : coads}
                      </Text>

                      {selecionada && (
                        <Feather
                          name="check"
                          size={16}
                          color={Colors.teal600}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Filtro de MÊS (Abaixo de COADS) */}
        <View style={styles.coadsFilterContainer}>
          <Text style={styles.filterLabel}>Mês</Text>

          <Pressable
            style={[
              styles.coadsButton,
              mesFiltro !== "TODOS" && styles.coadsButtonActive,
            ]}
            onPress={() => {
              setMostrarOpcoesMes((anterior) => !anterior);
              setMostrarOpcoesCoads(false);
            }}
          >
            <Text
              style={[
                styles.coadsButtonText,
                mesFiltro !== "TODOS" && styles.coadsButtonTextActive,
              ]}
              numberOfLines={1}
            >
              {mesFiltro === "TODOS"
                ? "Todos os meses"
                : mesesDisponiveis.find((m) => m.valor === mesFiltro)?.nome ||
                  mesFiltro}
            </Text>

            <Feather
              name={mostrarOpcoesMes ? "chevron-up" : "chevron-down"}
              size={18}
              color={mesFiltro !== "TODOS" ? Colors.white : Colors.teal600}
            />
          </Pressable>

          {mostrarOpcoesMes && (
            <View style={styles.coadsDropdown}>
              <ScrollView
                nestedScrollEnabled
                style={styles.coadsDropdownScroll}
                keyboardShouldPersistTaps="handled"
              >
                <Pressable
                  style={[
                    styles.coadsOption,
                    mesFiltro === "TODOS" && styles.coadsOptionSelected,
                  ]}
                  onPress={() => {
                    setMesFiltro("TODOS");
                    setMostrarOpcoesMes(false);
                  }}
                >
                  <Text
                    style={[
                      styles.coadsOptionText,
                      mesFiltro === "TODOS" && styles.coadsOptionTextSelected,
                    ]}
                  >
                    Todos os meses
                  </Text>

                  {mesFiltro === "TODOS" && (
                    <Feather name="check" size={16} color={Colors.teal600} />
                  )}
                </Pressable>

                {mesesDisponiveis.map((mes) => {
                  const selecionada = mesFiltro === mes.valor;

                  return (
                    <Pressable
                      key={mes.valor}
                      style={[
                        styles.coadsOption,
                        selecionada && styles.coadsOptionSelected,
                      ]}
                      onPress={() => {
                        setMesFiltro(mes.valor);
                        setMostrarOpcoesMes(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.coadsOptionText,
                          selecionada && styles.coadsOptionTextSelected,
                        ]}
                      >
                        {mes.nome}
                      </Text>

                      {selecionada && (
                        <Feather
                          name="check"
                          size={16}
                          color={Colors.teal600}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Categorias */}
        <Text style={styles.filterLabel}>Categoria</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {["TODOS", "DOENÇA", "EPIZOOTIA", "DESASTRE"].map((filtro) => {
            const active = categoriaFiltro === filtro;

            return (
              <TouchableOpacity
                key={filtro}
                onPress={() => setCategoriaFiltro(filtro)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {filtro === "TODOS" ? "Todos" : filtro}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status */}
        <Text style={styles.filterLabel}>Status</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {[
            "TODOS",
            "PENDENTE",
            "EM INVESTIGAÇÃO",
            "VERÍDICO",
            "NÃO VERÍDICO",
            "ENCERRADO",
          ].map((filtro) => {
            const active = statusFiltro === filtro;

            return (
              <TouchableOpacity
                key={filtro}
                onPress={() => setStatusFiltro(filtro)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {filtro === "TODOS"
                    ? "Todos"
                    : filtro === "PENDENTE"
                      ? "Pendentes"
                      : formatarStatus(filtro)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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

  filterRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },

  filterChipActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },

  filterChipText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gray600,
  },

  filterChipTextActive: {
    color: Colors.white,
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