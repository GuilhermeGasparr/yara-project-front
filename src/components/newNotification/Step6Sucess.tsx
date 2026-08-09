import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

interface Props {
  notificacaoId: number;
}

export function Step6Sucesso({ notificacaoId }: Props) {
  return (
    <View style={styles.wrap}>
      {/* Ícone de sucesso */}
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>✓</Text>
      </View>

      <Text style={styles.title}>Enviado com sucesso!</Text>
      <Text style={styles.sub}>
        Sua notificação foi recebida e será analisada pela Unidade de Saúde.
      </Text>

      {/* Protocolo */}
      <View style={styles.protocoloBox}>
        <Text style={styles.protocoloLabel}>Número de protocolo</Text>
        <Text style={styles.protocolo}>#{String(notificacaoId).padStart(7, "0")}</Text>
      </View>

      {/* Status card */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status inicial</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>EM ANDAMENTO</Text>
          </View>
        </View>
        <Text style={styles.statusInfo}>
          A Unidade de Saúde irá validar e encaminhar à Coordenação Municipal de Vigilância.
        </Text>
      </View>

      {/* Botões */}
      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => router.replace("/(agente)")}
        activeOpacity={0.85}
      >
        <Text style={styles.btnPrimaryText}>Voltar ao início</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnOutline}
        onPress={() => router.replace("/(agente)/history")}
        activeOpacity={0.8}
      >
        <Text style={styles.btnOutlineText}>Ver minhas notificações</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.teal50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.teal200,
  },
  icon: {
    fontSize: 40,
    color: Colors.teal600,
    fontWeight: "700",
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.gray900,
    textAlign: "center",
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    textAlign: "center",
    lineHeight: 22,
  },
  protocoloBox: {
    alignItems: "center",
    backgroundColor: Colors.teal50,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: "100%",
  },
  protocoloLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginBottom: 4,
  },
  protocolo: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.teal600,
    letterSpacing: 1,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    width: "100%",
    gap: Spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
  },
  badge: {
    backgroundColor: Colors.teal50,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.teal800,
  },
  statusInfo: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },
  btnPrimary: {
    width: "100%",
    backgroundColor: Colors.teal600,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimaryText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
  btnOutline: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: Colors.teal600,
    borderRadius: Radius.sm,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnOutlineText: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.teal600,
  },
});