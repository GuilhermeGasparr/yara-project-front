import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatarDataOcorrencia } from "@/utils/datas";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

import type {NotificacaoCM} from "@/services/CmService";
function normalizar(valor?: string) {
  return (
    valor
      ?.trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") ?? ""
  );
}

// ─── Configuração de status (mesmas cores da Regional) ───────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> =
  {
    "EM ANDAMENTO": { label: "Pendente", bg: "#fad4d4", color: "#B91C1C" },
    PENDENTE: { label: "Pendente", bg: "#fad4d4", color: "#B91C1C" },
    "EM INVESTIGACAO": {
      label: "Em investigação",
      bg: "#f3d5b0",
      color: "#C2410C",
    },
    VERIDICO: { label: "Verídico", bg: Colors.teal50, color: Colors.teal800 },
    "NAO VERIDICO": {
      label: "Não verídico",
      bg: "#e4b1ff",
      color: "#6002b9",
    },
    ENCERRADO: { label: "Encerrado", bg: "#e1dfe9", color: "#082367" },
  };

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CFG[normalizar(status)] ?? {
    label: status,
    bg: Colors.gray50,
    color: Colors.gray600,
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

export function CmNotifCard({
  item,
  onPress,
}: {
  item: NotificacaoCM;
  onPress: () => void;
}) {
  const categoriaNorm = normalizar(item.categoria);
  const categoriaColor =
    categoriaNorm === "DOENCA"
      ? Colors.red400
      : categoriaNorm === "EPIZOOTIA"
        ? "#BA7517"
        : "#378ADD";

  const dataFormatada = formatarDataOcorrencia(item.data_ocorrencia);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.notificationCard, { borderLeftColor: categoriaColor }]}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationTitleArea}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {item.tipo_evento}
          </Text>

          <Text style={styles.notificationMeta}>
            {item.endereco ?? "Endereço não informado"} · {dataFormatada}
          </Text>
        </View>

        <StatusBadge status={item.status} />
      </View>

      <View style={styles.notificationFooter}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: `${categoriaColor}18` },
          ]}
        >
          <Text style={[styles.categoryText, { color: categoriaColor }]}>
            {item.categoria}
          </Text>
        </View>

        <Text style={styles.notificationId}>
          #{String(item.id).padStart(4, "0")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderLeftWidth: 3,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },

  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },

  notificationTitleArea: {
    flex: 1,
  },

  notificationTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray800,
  },

  notificationMeta: {
    marginTop: 4,
    fontSize: FontSize.xs,
    color: Colors.gray600,
  },

  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },

  notificationFooter: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  categoryText: {
    fontSize: 10,
    fontWeight: "600",
  },

  notificationId: {
    fontSize: 11,
    color: Colors.gray400,
  },
});