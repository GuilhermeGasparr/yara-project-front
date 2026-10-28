import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

interface Props {
  onPress: () => void;
}

/** Botão "Visualizar todas as notificações" exibido abaixo da lista da home. */
export function AllNotificationsButton({ onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Feather name="list" size={18} color={Colors.teal600} />

      <Text style={styles.text}>Visualizar todas as notificações</Text>

      <Feather name="arrow-right" size={17} color={Colors.teal600} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: Spacing.lg,
    minHeight: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  text: {
    marginHorizontal: 9,
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.teal600,
  },
});
