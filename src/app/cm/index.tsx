import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useCmNotificacoes } from "@/hooks/useCmNotificacoes";
import { StatsCard } from "@/components/StatsCard";
import { AllNotificationsButton } from "@/components/AllNotificationsButton";
import { CmNotifCard } from "@/components/cm/CmNotifCard";
import { CmNotificacaoDetailModal } from "@/components/cm/CmNotificacaoDetailModal";

// ─── Tela principal ───────────────────────────────────────────────────────────

export default function CMScreen() {
  const { user } = useAuth();

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

  // Recarrega ao voltar da tela de notificações, onde o status pode mudar
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const stats = useMemo(
    () => ({
      total: notificacoes.length,
      pendentes: notificacoes.filter((n) => n.status === "EM ANDAMENTO")
        .length,
      investigacao: notificacoes.filter((n) => n.status === "EM INVESTIGAÇÃO")
        .length,
      veridicos: notificacoes.filter((n) => n.status === "VERÍDICO").length,
      naoVeridicos: notificacoes.filter((n) => n.status === "NÃO VERÍDICO")
        .length,
      encerradas: notificacoes.filter((n) => n.status === "ENCERRADO").length,
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

  const municipio = (user as any)?.municipio ?? "Município";
  const nome = (user as any)?.nome ?? "Vigilante Municipal";

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

      {/* Topbar */}
      <View style={s.topbar}>
        <View style={{ flex: 1 }}>
          <Text style={s.topbarSub}>Vigilância Municipal</Text>

          <Text style={s.topbarTitle} numberOfLines={1}>
            {municipio}
          </Text>
        </View>

        <TouchableOpacity
          style={s.avatarBtn}
          onPress={() => router.push("/cm/profile")}
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
        {loading ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color={Colors.teal400} />
          </View>
        ) : (
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <StatsCard
                value={stats.total}
                label="Total notif."
                accentColor="#374151"
                backgroundColor="#FFFFFF"
                borderColor="#E5E7EB"
              />
            </View>

            <View style={s.statItem}>
              <StatsCard
                value={stats.pendentes}
                label="Pendentes"
                accentColor="#B91C1C"
                backgroundColor="#fad4d4"
                borderColor="#fba1a1"
              />
            </View>

            <View style={s.statItem}>
              <StatsCard
                value={stats.investigacao}
                label="Em investigação"
                accentColor="#C2410C"
                backgroundColor="#f3d5b0"
                borderColor="#ffcd93"
              />
            </View>

            <View style={s.statItem}>
              <StatsCard
                value={stats.veridicos}
                label="Verídicas"
                accentColor="#15803D"
                backgroundColor="#cafad8"
                borderColor="#88f9af"
              />
            </View>

            <View style={s.statItem}>
              <StatsCard
                value={stats.naoVeridicos}
                label="Não verídicas"
                accentColor="#6002b9"
                backgroundColor="#e4b1ff"
                borderColor="#e07aff"
              />
            </View>

            <View style={s.statItem}>
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

        {/* Criar conta UBS */}
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => router.push("/cm/createUbs")}
          activeOpacity={0.8}
        >
          <View style={s.primaryBtnInner}>
            <Feather name="user-plus" size={22} color={Colors.white} />

            <View style={{ flex: 1 }}>
              <Text style={s.primaryBtnLabel}>Criar UBS</Text>
              <Text style={s.primaryBtnSub}>
                Cadastrar novo usuário de UBS
              </Text>
            </View>

            <Feather name="chevron-right" size={20} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* Acesso ao mapa */}
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() => router.push("/cm/map")}
          activeOpacity={0.8}
        >
          <View style={s.primaryBtnInner}>
            <Feather name="map" size={22} color={Colors.white} />

            <View style={{ flex: 1 }}>
              <Text style={s.primaryBtnLabel}>Mapa</Text>
              <Text style={s.primaryBtnSub}>
                Visualizar notificações no mapa do município
              </Text>
            </View>

            <Feather name="chevron-right" size={20} color={Colors.white} />
          </View>
        </TouchableOpacity>

        {/* Atualizações recentes */}
        <Text style={s.sectionLabel}>Atualizações recentes</Text>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={Colors.teal400} size="large" />
            <Text style={s.loadingText}>Carregando notificações...</Text>
          </View>
        ) : recentes.length === 0 ? (
          <View style={s.emptyWrap}>
            <Text style={s.emptyEmoji}>📋</Text>
            <Text style={s.emptyText}>Nenhuma notificação ainda.</Text>
          </View>
        ) : (
          recentes.map((item) => (
            <CmNotifCard
              key={item.id}
              item={item}
              onPress={() => setSelectedNotif(item)}
            />
          ))
        )}

        {!loading && recentes.length > 0 && (
          <AllNotificationsButton
            onPress={() => router.navigate("/cm/notificacoes")}
          />
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Modal de detalhes */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
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
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  primaryBtn: {
    backgroundColor: Colors.teal600,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  primaryBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  primaryBtnLabel: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
  primaryBtnSub: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.8)",
    marginTop: 1,
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
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },
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
});
