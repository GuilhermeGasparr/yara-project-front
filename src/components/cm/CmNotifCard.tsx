import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { NotificacaoCM, StatusCM } from "@/services/CmService";
import { CATEGORIA_COLOR, STATUS_CFG } from "@/components/cm/cmNotificacao";
import { formatarDataOcorrencia } from "@/utils/datas";

// ─── Badge de status ──────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: StatusCM }) {
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

// ─── Card de notificação ──────────────────────────────────────────────────────

interface NotifCardProps {
  item: NotificacaoCM;
  onPress: () => void;
}

export function CmNotifCard({ item, onPress }: NotifCardProps) {
  const dotColor = CATEGORIA_COLOR[item.categoria] ?? Colors.teal400;
  const data = formatarDataOcorrencia(item.data_ocorrencia);

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

const s = StyleSheet.create({
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
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 10, fontWeight: "600" },
});
