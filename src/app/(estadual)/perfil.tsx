import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";
import {
  Colors,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";

import { VEUser } from "@/types";

function getInitials(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>
        {value || "—"}
      </Text>
    </View>
  );
}

export default function EstadualProfileScreen() {
  const { user, signOut } = useAuth();

  const ve = user as VEUser;

  async function doLogout() {
    await signOut();

    if (router.canDismiss()) {
      router.dismissAll();
    }

    router.replace("/");
  }

  function handleSignOut() {
    if (Platform.OS === "web") {
      if (
        confirm(
          "Tem certeza que deseja encerrar a sessão?",
        )
      ) {
        doLogout();
      }

      return;
    }

    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja encerrar a sessão?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sair",
          style: "destructive",
          onPress: doLogout,
        },
      ],
    );
  }

  const initials = ve?.nome
    ? getInitials(ve.nome)
    : "VE";

  return (
    <View style={styles.screen}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.topbar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <View style={styles.backArrow} />
          </TouchableOpacity>

          <Text style={styles.topbarTitle}>
            Perfil
          </Text>
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </View>

          <Text style={styles.name}>
            {ve?.nome ?? "Vigilância Estadual"}
          </Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              Vigilância Estadual
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Informações do usuário */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            Informações do usuário
          </Text>

          <InfoRow
            label="Nome"
            value={ve?.nome ?? "—"}
          />

          <InfoRow
            label="CPF"
            value={ve?.cpf ?? "—"}
          />

          <InfoRow
            label="Cargo"
            value={
              "Vigilante Estadual"
            }
          />
        </View>

        {/* Configurações */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            Configurações
          </Text>

          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
          >
            <Text style={styles.actionText}>
              Alterar senha
            </Text>

            <View style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleSignOut}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutText}>
            Sair da conta
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          Sentinela Saúde · v1.0
        </Text>

        <View
          style={{
            height: Spacing.xxl,
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Hero
  hero: {
    backgroundColor: Colors.teal600,
    paddingBottom: Spacing.xxl,
  },

  topbar: {
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor:
      "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  backArrow: {
    width: 9,
    height: 9,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.white,
    transform: [
      {
        rotate: "45deg",
      },
      {
        translateX: 2,
      },
    ],
  },

  topbarTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },

  avatarWrap: {
    alignItems: "center",
    paddingTop: Spacing.sm,
    gap: 8,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor:
      "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor:
      "rgba(255,255,255,0.4)",
    marginBottom: 4,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.white,
  },

  name: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },

  roleBadge: {
    backgroundColor:
      "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  roleBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: "600",
  },

  // Scroll
  scroll: {
    flex: 1,
    marginTop: -Spacing.lg,
  },

  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor:
      "rgba(15,110,86,0.08)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },

  // Info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },

  infoLabel: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
  },

  infoValue: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.gray900,
    textAlign: "right",
    flex: 1,
    marginLeft: Spacing.md,
  },

  // Action rows
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },

  actionText: {
    fontSize: FontSize.base,
    color: Colors.gray900,
  },

  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: Colors.gray200,
    transform: [
      {
        rotate: "45deg",
      },
    ],
  },

  // Logout
  logoutBtn: {
    backgroundColor: Colors.red50,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.red400,
    marginBottom: Spacing.md,
  },

  logoutText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.red600,
  },

  version: {
    textAlign: "center",
    fontSize: FontSize.xs,
    color: Colors.gray200,
  },
});