import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Colors, FontSize, Spacing } from "@/constants/theme";

interface Props {
  title: string;
  step: number;        // 1-based
  totalSteps: number;
  onBack?: () => void;
}

export function WizardHeader({ title, step, totalSteps, onBack }: Props) {
  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }

  return (
    <View>
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={12}>
          <View style={styles.backArrow} />
        </TouchableOpacity>
        <Text style={styles.topbarTitle} numberOfLines={1}>{title}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < step     && styles.dotDone,
              i === step - 1 && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Contador */}
      <Text style={styles.stepLabel}>Passo {step} de {totalSteps}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    backgroundColor: Colors.teal600,
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
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    width: 9,
    height: 9,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.white,
    transform: [{ rotate: "45deg" }, { translateX: 2 }],
  },
  topbarTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
  progressWrap: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 4,
    backgroundColor: Colors.white,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray100,
  },
  dotDone: {
    backgroundColor: Colors.teal600,
  },
  dotActive: {
    backgroundColor: Colors.teal200,
  },
  stepLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
});