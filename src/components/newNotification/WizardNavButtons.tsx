import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

interface Props {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  loading?: boolean;
  hideBack?: boolean;
}

export function WizardNavButtons({
  onBack,
  onNext,
  nextLabel = "Próximo →",
  loading = false,
  hideBack = false,
}: Props) {
  return (
    <View style={styles.row}>
      {!hideBack && (
        <TouchableOpacity style={styles.outline} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.outlineText}>← Voltar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.solid, hideBack && styles.fullWidth]}
        onPress={onNext}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={styles.solidText}>{nextLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  outline: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.teal600,
    alignItems: "center",
  },
  outlineText: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.teal600,
  },
  solid: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.sm,
    backgroundColor: Colors.teal600,
    alignItems: "center",
    minHeight: 46,
    justifyContent: "center",
  },
  fullWidth: {
    flex: 1,
  },
  solidText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
});