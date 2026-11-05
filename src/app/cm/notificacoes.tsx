import { useEffect, useMemo, useState } from "react";
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
import { router } from "expo-router";

import { Colors, FontSize, Spacing } from "@/constants/theme";
import { exportarRelatorioXlsx } from "@/services/CmService";
import { useCmNotificacoes } from "@/hooks/useCmNotificacoes";
import { baixarBlob } from "@/utils/downloadFile";
import {
  CATEGORIAS_FILTRO,
  STATUS_FILTRO,
  correspondeCategoria,
  correspondeStatus,
  dentroDoPeriodo,
  periodoInvalido,
  valorFiltro,
} from "@/utils/filtros";
import { ExportHeaderButton } from "@/components/ExportHeaderButton";
import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { FilterChipGroup } from "@/components/filters/FilterChipGroup";
import { CmNotifCard } from "@/components/cm/CmNotifCard";
import { CmNotificacaoDetailModal } from "@/components/cm/CmNotificacaoDetailModal";

export default function CmNotificacoesScreen() {
  const {
    notificacoes,
    loading,
    refreshing,
    selectedNotif,
    setSelectedNotif,
    loadingId,
    fetchData,
    handleStatusChange,
    handleDelete,
  } = useCmNotificacoes();

  const [categoriaFiltro, setCategoriaFiltro] = useState("TODOS");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");

  // Período (YYYY-MM-DD); vazio = sem limite
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter(
      (item) =>
        correspondeCategoria(item.categoria, categoriaFiltro) &&
        correspondeStatus(item.status, statusFiltro) &&
        dentroDoPeriodo(item.data_ocorrencia, dataInicio, dataFim),
    );
  }, [notificacoes, categoriaFiltro, statusFiltro, dataInicio, dataFim]);

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

      const blob = await exportarRelatorioXlsx({
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        categoria: valorFiltro(categoriaFiltro, "TODOS"),
        status: valorFiltro(statusFiltro, "TODOS"),
      });

      baixarBlob(blob, "notificacoes_municipio.xlsx");
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

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

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
          <Text style={styles.headerLabel}>Coordenação Municipal</Text>
          <Text style={styles.headerTitle}>Notificações</Text>
        </View>

        <ExportHeaderButton
          onPress={handleExportarTodas}
          loading={exportando}
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
              Tente alterar os filtros.
            </Text>
          </View>
        ) : (
          notificacoesFiltradas.map((item) => (
            <CmNotifCard
              key={item.id}
              item={item}
              onPress={() => setSelectedNotif(item)}
            />
          ))
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      <CmNotificacaoDetailModal
        notif={selectedNotif}
        onClose={() => setSelectedNotif(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        loadingId={loadingId}
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
});
