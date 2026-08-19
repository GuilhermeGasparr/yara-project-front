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
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { CMUser } from "@/types";

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
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const cm = user as CMUser;

  async function doLogout() {
    await signOut();

    if (router.canDismiss()) {
      router.dismissAll();
    }

    router.replace("/");
  }

  function handleSignOut() {
    if (Platform.OS === "web") {
      if (confirm("Tem certeza que deseja encerrar a sessão?")) {
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
      ]
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>Perfil</Text>
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {cm?.nome ? getInitials(cm.nome) : "CM"}
            </Text>
          </View>

          <Text style={styles.name}>
            {cm?.nome ?? "Coordenador Municipal"}
          </Text>

          <Text style={styles.cargo}>
            {cm?.cargo ?? "Coordenador Municipal"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            Informações da conta
          </Text>

          <InfoRow
            label="Nome completo"
            value={cm?.nome ?? "—"}
          />

          <InfoRow
            label="Cargo"
            value={cm?.cargo ?? "—"}
          />

          <InfoRow
            label="E-mail"
            value={cm?.email ?? "—"}
          />

          <InfoRow
            label="Município"
            value={cm?.municipio ?? "—"}
          />
        </View>

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

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  hero: {
    backgroundColor: Colors.teal600,
    paddingBottom: Spacing.xxl,
  },

  topbar: {
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },

  topbarTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },

  avatarWrap: {
    alignItems: "center",
    paddingTop: Spacing.sm,
    gap: 6,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.4)",
    marginBottom: 4,
  },

  avatarText: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.white,
  },

  name: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },

  cargo: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.75)",
  },

  scroll: {
    flex: 1,
    marginTop: -Spacing.lg,
  },

  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  card: {
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

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.md,
  },

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