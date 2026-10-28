import { Feather } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Colors, FontSize } from "@/constants/theme";

interface Props {
  onPress: () => void;
  loading?: boolean;
}

/** Botão "Exportar XLSX" para o cabeçalho verde das telas de lista completa. */
export function ExportHeaderButton({ onPress, loading = false }: Props) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
      hitSlop={10}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.white} />
      ) : (
        <Feather name="download" size={22} color={Colors.white} />
      )}

      <Text style={styles.label}>Exportar XLSX</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    flexShrink: 0,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.white,
  },
});
