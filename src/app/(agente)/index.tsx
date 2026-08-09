import { NotificationRow } from "@/components/NotificationRow";
import { QuickActionButton } from "@/components/QuickActionbutton";
import { StatsCard } from "@/components/StatsCard";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import {
  listarNotificacoes,
  Notificacao,
  NotificacaoStatus,
} from "@/services/NotificationService";
import { AgenteUser } from "@/types";
import { useRouter } from "expo-router";
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

function getSaudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia,";
  if (h < 18) return "Boa tarde,";
  return "Boa noite,";
}

function contarStatus(list: Notificacao[], status: NotificacaoStatus) {
  return list.filter((n) => n.status === status).length;
}

// ─── Ícones ───────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <View style={{ width: 22, height: 22, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: 2, height: 18, backgroundColor: Colors.white, borderRadius: 1 }} />
      <View style={{ position: "absolute", height: 2, width: 18, backgroundColor: Colors.white, borderRadius: 1 }} />
    </View>
  );
}

function CalendarIcon() {
  return (
    <View style={{ width: 20, height: 20, borderWidth: 1.8, borderColor: Colors.teal600, borderRadius: 4, alignItems: "center", justifyContent: "flex-end", paddingBottom: 2 }}>
      <View style={{ flexDirection: "row", gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 3, height: 3, backgroundColor: Colors.teal600, borderRadius: 1 }} />
        ))}
      </View>
    </View>
  );
}

function MapFoldIcon() {
  return (
    <View style={{ width: 20, height: 18, borderWidth: 1.8, borderColor: Colors.teal600, borderRadius: 3 }}>
      <View style={{ position: "absolute", top: 0, bottom: 0, left: 7, width: 1.5, backgroundColor: Colors.teal600 }} />
    </View>
  );
}

function QuestionIcon() {
  return (
    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.8, borderColor: Colors.teal600, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 11, color: Colors.teal600, fontWeight: "700", lineHeight: 13 }}>?</Text>
    </View>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function AgenteHomeScreen() {
  const { user } = useAuth();
  const agente   = user as AgenteUser;

  // useRouter em vez de router importado — mais estável dentro de grupos de tabs
  const router = useRouter();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const stats = useMemo(() => ({
    total:        notificacoes.length,
    investigacao: contarStatus(notificacoes, "EM INVESTIGAÇÃO"),
    confirmados:  contarStatus(notificacoes, "CONFIRMADO"),
  }), [notificacoes]);

  const recentes = useMemo(
    () => [...notificacoes]
      .sort((a, b) => new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime())
      .slice(0, 3),
    [notificacoes],
  );

  const pendentes = notificacoes.filter((n) => n.status === "EM ANDAMENTO").length;

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await listarNotificacoes();
      setNotificacoes(data);
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Não foi possível carregar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Dentro de um grupo de Tabs, navigate com o nome relativo da rota
  // é mais confiável do que o caminho absoluto com o grupo entre parênteses
  function goTo(route: "newNotification" | "history" | "map" | "guide") {
    // @ts-ignore — Expo Router infere os tipos das rotas, mas dentro de grupos
    // de tabs o caminho relativo é aceito em runtime mesmo sem inferência correta
    router.navigate(route);
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

      {/* Topbar */}
      <View style={styles.topbar}>
        <View>
          <Text style={styles.appLabel}>Sentinela Saúde</Text>
          <Text style={styles.topbarTitle}>Início</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.75}>
          <View style={styles.bellIcon}>
            <View style={styles.bellTop} />
            <View style={styles.bellBottom} />
            <View style={styles.bellClapper} />
          </View>
          {pendentes > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{pendentes > 9 ? "9+" : pendentes}</Text>
            </View>
          )}
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
            {agente?.nome ?? "Agente"} · {agente?.cargo ?? "ACS"}
          </Text>
        </View>

        {/* Stats */}
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.teal400} />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <StatsCard value={stats.total}        label="Total notif." />
            <StatsCard value={stats.investigacao} label="Em investigação" />
            <StatsCard value={stats.confirmados}  label="Confirmados" />
          </View>
        )}

        {/* Ações rápidas */}
        <QuickActionButton
          label="Nova Notificação"
          sublabel="Registrar ocorrência agora"
          icon={<PlusIcon />}
          onPress={() => goTo("newNotification")}
          primary
          style={styles.primaryBtn}
        />

        <View style={styles.gridRow}>
          <QuickActionButton
            label="Histórico"
            sublabel="Minhas notificações"
            icon={<CalendarIcon />}
            onPress={() => goTo("history")}
            style={styles.gridItem}
          />
          <QuickActionButton
            label="Mapa"
            sublabel="Território"
            icon={<MapFoldIcon />}
            onPress={() => goTo("map")}
            style={styles.gridItem}
          />
        </View>

        <View style={styles.gridRow}>
          <QuickActionButton
            label="Guia"
            sublabel="Informações rápidas"
            icon={<QuestionIcon />}
            onPress={() => goTo("guide")}
            style={{ flex: 1 }}
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
                Toque em <Text style={{ fontWeight: "700" }}>Nova Notificação</Text> para começar.
              </Text>
            </View>
          ) : (
            recentes.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onPress={() => goTo("newNotification")}
              />
            ))
          )}
        </View>

        {recentes.length > 0 && (
          <TouchableOpacity
            style={styles.verTodasBtn}
            onPress={() => goTo("history")}
            activeOpacity={0.7}
          >
            <Text style={styles.verTodasText}>Ver todas as notificações →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  topbar: { backgroundColor: Colors.teal600, paddingTop: 52, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  appLabel:    { fontSize: FontSize.xs, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  topbarTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.white, letterSpacing: -0.3 },
  bellBtn:     { padding: Spacing.sm, position: "relative" },
  bellIcon:    { width: 22, height: 22, alignItems: "center", justifyContent: "center" },
  bellTop:     { width: 14, height: 12, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 2, borderColor: Colors.white, borderBottomWidth: 0 },
  bellBottom:  { width: 18, height: 2, backgroundColor: Colors.white, borderRadius: 1 },
  bellClapper: { width: 5, height: 4, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, borderWidth: 2, borderColor: Colors.white, borderTopWidth: 0, marginTop: 1 },
  bellBadge:   { position: "absolute", top: 2, right: 2, backgroundColor: Colors.red400, borderRadius: 9, minWidth: 17, height: 17, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.teal600 },
  bellBadgeText: { fontSize: 9, color: Colors.white, fontWeight: "700" },
  scroll:  { flex: 1 },
  content: { padding: Spacing.lg },
  greetingBlock: { marginBottom: Spacing.lg, gap: 2 },
  greetingSub:   { fontSize: FontSize.base, color: Colors.gray400 },
  greetingName:  { fontSize: FontSize.xl, fontWeight: "700", color: Colors.gray900, letterSpacing: -0.4 },
  statsRow:   { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  loadingRow: { height: 70, alignItems: "center", justifyContent: "center", marginBottom: Spacing.lg },
  primaryBtn: { marginBottom: Spacing.sm },
  gridRow:    { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  gridItem:   { flex: 1 },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: "700", color: Colors.gray400, textTransform: "uppercase", letterSpacing: 0.6, marginTop: Spacing.lg, marginBottom: Spacing.md },
  feedCard:   { backgroundColor: Colors.white, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, borderWidth: 1, borderColor: "rgba(15,110,86,0.08)", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  feedCenter: { paddingVertical: Spacing.xxl, alignItems: "center" },
  feedEmpty:  { fontSize: FontSize.sm, color: Colors.gray400, textAlign: "center", lineHeight: 20 },
  verTodasBtn:  { alignItems: "center", paddingVertical: Spacing.md },
  verTodasText: { fontSize: FontSize.sm, color: Colors.teal600, fontWeight: "600" },
});