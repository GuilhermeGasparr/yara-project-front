import { AllNotificationsButton } from "@/components/AllNotificationsButton";
import { StatsCard } from "@/components/StatsCard";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import type { Notificacao } from "@/services/NotificationService";
import { listarNotificacoesVE } from "@/services/VeService";
import { gerarDashboardEstadual } from "@/utils/estadualDashboard";
import Feather from "@expo/vector-icons/Feather";
import { BarChart } from "react-native-gifted-charts";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
/* ============================================================================
 * Helpers
 * ========================================================================== */

function normalizar(valor?: string) {
  return (
    valor
      ?.trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") ?? ""
  );
}

function getInitials(nome: string) {
  return (
    nome
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join("")
      .toUpperCase() || "VE"
  );
}

/* ============================================================================
 * Configurações
 * ========================================================================== */

const CATEGORIA_CFG: Record<
  string,
  {
    label: string;
    color: string;
  }
> = {
  DOENCA: {
    label: "Doenças",
    color: "#C62828",
  },
  EPIZOOTIA: {
    label: "Epizootias",
    color: "#A15C00",
  },
  DESASTRE: {
    label: "Desastres",
    color: "#1261A0",
  },
};

/* ============================================================================
 * Cabeçalho de seção
 * ========================================================================== */

function SectionHeader({
  icon,
  title,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIcon}>
          <Feather name={icon} size={16} color={Colors.teal600} />
        </View>

        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * Alerta
 * ========================================================================== */

function AlertCard({
  title,
  description,
  icon = "alert-triangle",
}: {
  title: string;
  description: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={styles.alertCard}>
      <View style={styles.alertIcon}>
        <Feather name={icon} size={18} color="#A15C00" />
      </View>

      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{title}</Text>

        <Text style={styles.alertDescription}>{description}</Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * Município (Agora em formato de card vertical isolado)
 * ========================================================================== */

function MunicipioRow({
  municipio,
  quantidade,
  maiorQuantidade,
}: {
  municipio: string;
  quantidade: number;
  maiorQuantidade: number;
}) {
  const percentual =
    maiorQuantidade > 0 ? Math.min(1, quantidade / maiorQuantidade) : 0;

  return (
    <View style={styles.cardItem}>
      <View style={styles.municipioHeader}>
        <View style={styles.municipioNameRow}>
          <View style={styles.municipioIcon}>
            <Feather name="map-pin" size={14} color={Colors.teal600} />
          </View>

          <Text style={styles.municipioName} numberOfLines={1}>
            {municipio}
          </Text>
        </View>

        <Text style={styles.municipioValue}>{quantidade}</Text>
      </View>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${percentual * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

/* ============================================================================
 * Categoria (Agora em formato de card vertical isolado)
 * ========================================================================== */

function CategoriaBar({
  categoria,
  quantidade,
  total,
}: {
  categoria: string;
  quantidade: number;
  total: number;
}) {
  const chave = normalizar(categoria);
  const config = CATEGORIA_CFG[chave] ?? {
    label: categoria || "Não informado",
    color: Colors.gray600,
  };

  const percentual = total > 0 ? (quantidade / total) * 100 : 0;
  const alturaBarra = (Math.min(percentual, 100) / 100) * 110;

  return (
    <View style={styles.categoryColumn}>
      <Text style={styles.categoryPercentage}>{percentual.toFixed(1)}%</Text>

      <View style={styles.categoryBarTrack}>
        <View
          style={[
            styles.categoryBar,
            {
              height: alturaBarra,
              backgroundColor: config.color,
            },
          ]}
        />
      </View>

      <Text style={styles.categoryName} numberOfLines={1}>
        {config.label}
      </Text>

      <Text style={styles.categoryCount}>{quantidade} notificações</Text>
    </View>
  );
}
/* ============================================================================
 * Tela principal
 * ========================================================================== */

export default function EstadualHomeScreen() {
  const { user } = useAuth();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* --------------------------------------------------------------------------
   * Dashboard
   * ------------------------------------------------------------------------ */

  const dashboard = useMemo(
    () => gerarDashboardEstadual(notificacoes),
    [notificacoes],
  );

  /* --------------------------------------------------------------------------
   * Buscar dados
   * ------------------------------------------------------------------------ */

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
      console.error("Erro ao carregar notificações estaduais:", error);

      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as notificações.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* --------------------------------------------------------------------------
   * Municípios
   * ------------------------------------------------------------------------ */

  const municipios = useMemo(() => {
    const contador: Record<string, number> = {};

    notificacoes.forEach((notificacao) => {
      const municipio = notificacao.municipio?.trim() || "Não informado";

      contador[municipio] = (contador[municipio] ?? 0) + 1;
    });

    return Object.entries(contador)
      .map(([municipio, quantidade]) => ({
        municipio,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [notificacoes]);

  const municipiosExibidos = municipios.slice(0, 5);

  const maiorQuantidadeMunicipio = Math.max(
    municipiosExibidos[0]?.quantidade ?? 0,
    10,
  );

  /* --------------------------------------------------------------------------
   * Municípios em investigação
   * ------------------------------------------------------------------------ */

  const municipiosEmInvestigacao = useMemo(() => {
    return Array.from(
      new Set(
        notificacoes
          .filter(
            (notificacao) =>
              normalizar(notificacao.status) === "EM INVESTIGACAO",
          )
          .map(
            (notificacao) =>
              notificacao.municipio?.trim() || "Município não informado",
          ),
      ),
    );
  }, [notificacoes]);

  /* --------------------------------------------------------------------------
   * Alertas
   * ------------------------------------------------------------------------ */

  const temAlertas = dashboard.emInvestigacao > 0 || dashboard.pendentes > 0;
  const categoryData = [
    {
      key: "DOENCA",
      quantidade: dashboard.doencas,
    },
    {
      key: "EPIZOOTIA",
      quantidade: dashboard.epizootias,
    },
    {
      key: "DESASTRE",
      quantidade: dashboard.desastres,
    },
  ].map((item) => {
    const config = CATEGORIA_CFG[item.key];
    const percentual =
      dashboard.total > 0 ? (item.quantidade / dashboard.total) * 100 : 0;

    return {
      value: Number(percentual.toFixed(1)),
      label: config.label,
      frontColor: config.color,
      topLabelComponent: () => (
        <Text style={styles.chartTopLabel}>{percentual.toFixed(1)}%</Text>
      ),
    };
  });
  /* ==========================================================================
   * Render
   * ======================================================================== */

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

      {/* ---------------------------------------------------------------------
       * Header
       * ------------------------------------------------------------------- */}

      <View style={styles.topbar}>
        <View style={styles.topbarTextContainer}>
          <Text style={styles.appLabel}>Vigilância Estadual</Text>

          <Text style={styles.topbarTitle} numberOfLines={1}>
            Monitoramento do estado
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push("/estadual/perfil")}
          activeOpacity={0.8}
          hitSlop={8}
        >
          <View style={styles.profileButtonInner}>
            <Text style={styles.profileButtonText}>
              {user?.nome ? getInitials(user.nome) : "VE"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ---------------------------------------------------------------------
       * Conteúdo
       * ------------------------------------------------------------------- */}

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
        {/* ================================================================
         * Indicadores estaduais (Linha Vertical)
         * ============================================================ */}

        <View style={styles.statsSection}>
          <SectionHeader icon="bar-chart-2" title="Indicadores estaduais" />

          {loading ? (
            <View style={styles.loadingStats}>
              <ActivityIndicator size="small" color={Colors.teal600} />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <StatsCard
                  value={dashboard.total}
                  label="Total notif."
                  accentColor="#374151"
                  backgroundColor="#FFFFFF"
                  borderColor="#E5E7EB"
                />
              </View>

              <View style={styles.statItem}>
                <StatsCard
                  value={dashboard.pendentes}
                  label="Pendentes"
                  accentColor="#B91C1C"
                  backgroundColor="#fad4d4"
                  borderColor="#fba1a1"
                />
              </View>

              <View style={styles.statItem}>
                <StatsCard
                  value={dashboard.emInvestigacao}
                  label="Em investigação"
                  accentColor="#C2410C"
                  backgroundColor="#f3d5b0"
                  borderColor="#ffcd93"
                />
              </View>

              <View style={styles.statItem}>
                <StatsCard
                  value={dashboard.veridicos}
                  label="Verídicas"
                  accentColor="#15803D"
                  backgroundColor="#cafad8"
                  borderColor="#88f9af"
                />
              </View>

              <View style={styles.statItem}>
                <StatsCard
                  value={dashboard.naoVeridicos}
                  label="Não verídicas"
                  accentColor="#6002b9"
                  backgroundColor="#e4b1ff"
                  borderColor="#e07aff"
                />
              </View>

              <View style={styles.statItem}>
                <StatsCard
                  value={dashboard.encerrados}
                  label="Encerradas"
                  accentColor="#082367"
                  backgroundColor="#e1dfe9"
                  borderColor="#aaa3ff"
                />
              </View>
            </View>
          )}
        </View>

        {/* ================================================================
         * Abrangência territorial
         * ============================================================ */}

        <View style={styles.sectionSpacing}>
          <SectionHeader icon="map" title="Abrangência territorial" />

          <View style={styles.sectionCard}>
            <View style={styles.territoryRow}>
              <View style={styles.territoryItem}>
                <Text style={styles.territoryValue}>
                  {dashboard.municipiosAtivos}
                </Text>

                <Text style={styles.territoryLabel}>
                  municípios com registros
                </Text>
              </View>

              <View style={styles.territoryDivider} />

              <View style={styles.territoryItem}>
                <Text style={styles.territoryValue}>
                  {dashboard.municipiosEmInvestigacao}
                </Text>

                <Text style={styles.territoryLabel}>
                  municípios em investigação
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionSpacing}>
          <SectionHeader icon="map" title="Mapa do território" />

          <TouchableOpacity
            style={styles.mapShortcut}
            onPress={() => router.push("/estadual/map")}
            activeOpacity={0.85}
          >
            <View style={styles.mapShortcutIcon}>
              <Feather name="map" size={21} color={Colors.teal600} />
            </View>

            <View style={styles.mapShortcutContent}>
              <Text style={styles.mapShortcutTitle}>
                Visualizar mapa estadual
              </Text>

              <Text style={styles.mapShortcutDescription}>
                Consulte a distribuição geográfica das notificações registradas
                no estado.
              </Text>
            </View>

            <View style={styles.mapShortcutArrow}>
              <Feather name="chevron-right" size={20} color={Colors.gray400} />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionSpacing}>
          <SectionHeader icon="user-plus" title="Gerenciar contas" />

          <TouchableOpacity
            style={styles.mapShortcut}
            onPress={() => router.navigate("/estadual/createVR")}
            activeOpacity={0.85}
          >
            <View style={styles.mapShortcutIcon}>
              <Feather name="user-plus" size={21} color={Colors.teal600} />
            </View>

            <View style={styles.mapShortcutContent}>
              <Text style={styles.mapShortcutTitle}>
                Criar Conta Vigilância Regional
              </Text>

              <Text style={styles.mapShortcutDescription}>
                Cadastre um novo vigilante regional vinculado a uma
                superintendência.
              </Text>
            </View>

            <View style={styles.mapShortcutArrow}>
              <Feather name="chevron-right" size={20} color={Colors.gray400} />
            </View>
          </TouchableOpacity>
        </View>
        {/* ================================================================
         * Distribuição por categoria (Linha Vertical / Cards Separados)
         * ============================================================ */}

        <View style={styles.sectionSpacing}>
          <SectionHeader
            icon="bar-chart-2"
            title="Distribuição por categoria"
          />

          {loading ? (
            <View style={styles.loadingSmall}>
              <ActivityIndicator size="small" color={Colors.teal600} />
            </View>
          ) : (
            <View style={styles.categoryChart}>
              <BarChart
                data={categoryData}
                barWidth={28}
                noOfSections={4}
                maxValue={100}
                height={180}
                spacing={24}
                roundedTop
                hideRules={false}
                rulesColor="#E5E7EB"
                xAxisColor="#D9E7E3"
                yAxisColor="#D9E7E3"
                yAxisTextStyle={styles.chartAxisText}
                xAxisLabelTextStyle={styles.chartAxisText}
                xAxisLabelsVerticalShift={2}
                initialSpacing={16}
                endSpacing={16}
                isAnimated
              />

              <View style={styles.categoryLegend}>
                {[
                  {
                    key: "DOENCA",
                    quantidade: dashboard.doencas,
                  },
                  {
                    key: "EPIZOOTIA",
                    quantidade: dashboard.epizootias,
                  },
                  {
                    key: "DESASTRE",
                    quantidade: dashboard.desastres,
                  },
                ].map((item) => {
                  const config = CATEGORIA_CFG[item.key];

                  return (
                    <View key={item.key} style={styles.categoryLegendItem}>
                      <View
                        style={[
                          styles.categoryLegendDot,
                          { backgroundColor: config.color },
                        ]}
                      />

                      <Text style={styles.categoryLegendText}>
                        {config.label}: {item.quantidade}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* ================================================================
         * Alertas
         * ============================================================ */}

        <View style={styles.sectionSpacing}>
          <SectionHeader icon="alert-triangle" title="Alertas e atenção" />

          {loading ? (
            <View style={styles.loadingSmall}>
              <ActivityIndicator size="small" color={Colors.teal600} />
            </View>
          ) : !temAlertas ? (
            <View style={styles.noAlertCard}>
              <View style={styles.noAlertIcon}>
                <Feather name="check-circle" size={19} color={Colors.teal600} />
              </View>

              <View style={styles.noAlertContent}>
                <Text style={styles.noAlertTitle}>
                  Nenhuma situação requer atenção
                </Text>

                <Text style={styles.noAlertText}>
                  Não há notificações pendentes ou em investigação no momento.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.alertsContainer}>
              {dashboard.emInvestigacao > 0 ? (
                <AlertCard
                  title={`${dashboard.emInvestigacao} notificação${
                    dashboard.emInvestigacao === 1 ? "" : "ões"
                  } em investigação`}
                  description={
                    municipiosEmInvestigacao.length > 0
                      ? `Há ocorrências em investigação em ${
                          municipiosEmInvestigacao.length
                        } município${
                          municipiosEmInvestigacao.length === 1 ? "" : "s"
                        }.`
                      : "Existem notificações que estão sendo investigadas."
                  }
                />
              ) : null}

              {dashboard.pendentes > 0 ? (
                <AlertCard
                  icon="clock"
                  title={`${dashboard.pendentes} notificação${
                    dashboard.pendentes === 1 ? "" : "ões"
                  } pendente${dashboard.pendentes === 1 ? "" : "s"}`}
                  description="Existem registros que ainda estão no status inicial e merecem acompanhamento."
                />
              ) : null}
            </View>
          )}
        </View>

        {/* ================================================================
         * Municípios com maior atividade (Linha Vertical / Cards Separados)
         * ============================================================ */}

        <View style={styles.sectionSpacing}>
          <SectionHeader
            icon="map-pin"
            title="Municípios com maior atividade"
          />

          {loading ? (
            <View style={styles.loadingSmall}>
              <ActivityIndicator size="small" color={Colors.teal600} />
            </View>
          ) : municipiosExibidos.length === 0 ? (
            <View style={styles.emptySection}>
              <Feather name="map" size={25} color={Colors.gray400} />

              <Text style={styles.emptySectionText}>
                Ainda não há dados por município.
              </Text>
            </View>
          ) : (
            <View style={styles.verticalListContainer}>
              {municipiosExibidos.map((item) => (
                <MunicipioRow
                  key={item.municipio}
                  municipio={item.municipio}
                  quantidade={item.quantidade}
                  maiorQuantidade={maiorQuantidadeMunicipio}
                />
              ))}
            </View>
          )}
        </View>

        {!loading && notificacoes.length > 0 ? (
          <AllNotificationsButton
            onPress={() => router.push("/estadual/notificacoes")}
          />
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * Estilos
 * ========================================================================== */

const styles = StyleSheet.create({
  /* --------------------------------------------------------------------------
   * Tela
   * ------------------------------------------------------------------------ */

  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  /* --------------------------------------------------------------------------
   * Header
   * ------------------------------------------------------------------------ */

  topbar: {
    backgroundColor: Colors.teal600,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  topbarTextContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },

  appLabel: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "500",
    marginBottom: 2,
  },

  topbarTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: -0.3,
  },

  profileButton: {
    paddingBottom: 1,
  },

  profileButtonInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.32)",
  },

  profileButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.white,
  },

  /* --------------------------------------------------------------------------
   * Seções
   * ------------------------------------------------------------------------ */

  sectionSpacing: {
    marginTop: Spacing.lg,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.teal50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray900,
  },

  /* --------------------------------------------------------------------------
   * Indicadores
   * ------------------------------------------------------------------------ */

  statsSection: {
    marginBottom: 2,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },

  statItem: {
    width: "31%",
  },

  loadingStats: {
    minHeight: 170,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
  },

  /* --------------------------------------------------------------------------
   * Cards / Listas Verticais Separadas
   * ------------------------------------------------------------------------ */

  verticalListContainer: {
    gap: Spacing.sm,
  },

  cardItem: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  /* --------------------------------------------------------------------------
   * Território
   * ------------------------------------------------------------------------ */

  territoryRow: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },

  territoryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },

  territoryDivider: {
    width: 1,
    backgroundColor: Colors.gray100,
    marginVertical: 4,
  },

  territoryValue: {
    fontSize: 25,
    fontWeight: "700",
    color: Colors.teal600,
  },

  territoryLabel: {
    marginTop: 3,
    fontSize: FontSize.xs,
    lineHeight: 16,
    color: Colors.gray600,
    textAlign: "center",
  },

  /* --------------------------------------------------------------------------
   * Categorias
   * ------------------------------------------------------------------------ */

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  categoryNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  categoryDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 8,
  },

  categoryValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray800,
  },

  categoryProgressBackground: {
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.gray50,
    overflow: "hidden",
  },

  categoryProgress: {
    height: "100%",
    borderRadius: 4,
  },

  /* --------------------------------------------------------------------------
   * Alertas
   * ------------------------------------------------------------------------ */

  alertsContainer: {
    gap: Spacing.sm,
  },

  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E8",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#F0D9A8",
    padding: Spacing.md,
  },

  chartTopLabel: {
    color: Colors.gray800,
    fontSize: FontSize.xs,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },

  chartAxisText: {
    color: Colors.gray600,
    fontSize: FontSize.xs,
  },

  alertIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F6E4BC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },

  alertContent: {
    flex: 1,
  },

  alertTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: 3,
  },

  mapShortcut: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },

  mapShortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.teal50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },

  mapShortcutContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },

  mapShortcutTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray900,
  },

  mapShortcutDescription: {
    marginTop: 3,
    fontSize: FontSize.xs,
    lineHeight: 17,
    color: Colors.gray600,
  },

  categoryChart: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  categoryLegend: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
    width: "100%",
    alignSelf: "stretch",
  },

  categoryLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    width: "100%",
  },

  categoryLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },

  categoryLegendText: {
    color: Colors.gray800,
    fontSize: FontSize.sm,
    flex: 1,
    flexShrink: 1,
  },

  categoryColumn: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },

  categoryPercentage: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },

  categoryBarTrack: {
    height: 110,
    width: 38,
    maxWidth: "70%",
    backgroundColor: Colors.gray50,
    borderRadius: Radius.sm,
    overflow: "hidden",
    justifyContent: "flex-end",
  },

  categoryBar: {
    width: "100%",
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
  },

  categoryName: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gray800,
    textAlign: "center",
    marginTop: Spacing.sm,
  },

  categoryCount: {
    fontSize: 10,
    color: Colors.gray600,
    textAlign: "center",
    marginTop: 3,
  },
  mapShortcutArrow: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  alertDescription: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    color: Colors.gray600,
  },

  noAlertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
    padding: Spacing.md,
  },

  noAlertIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.teal50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },

  noAlertContent: {
    flex: 1,
  },

  noAlertTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray900,
  },

  noAlertText: {
    fontSize: FontSize.xs,
    lineHeight: 17,
    color: Colors.gray600,
    marginTop: 2,
  },

  /* --------------------------------------------------------------------------
   * Municípios
   * ------------------------------------------------------------------------ */

  municipioHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  municipioNameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  municipioIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.teal50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  municipioName: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.gray900,
  },

  municipioValue: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.teal600,
    marginLeft: Spacing.sm,
  },

  progressBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.gray50,
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.teal400,
  },

  loadingSmall: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
  },

  emptySection: {
    minHeight: 110,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.08)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },

  emptySectionText: {
    marginTop: 8,
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textAlign: "center",
  },

  /* --------------------------------------------------------------------------
   * Botão de notificações
   * ------------------------------------------------------------------------ */

  bottomSpace: {
    height: Spacing.xxl,
  },
});
