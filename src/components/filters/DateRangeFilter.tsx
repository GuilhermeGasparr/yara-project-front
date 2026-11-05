import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DatePickerField from "@/components/DatePickerField";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { periodoInvalido } from "@/utils/filtros";

interface Props {
  /** Data inicial (YYYY-MM-DD); vazio = sem limite. */
  inicio: string;
  /** Data final (YYYY-MM-DD); vazio = sem limite. */
  fim: string;
  onChange: (inicio: string, fim: string) => void;
}

/** Filtro de período personalizado: data início e data fim (inclusivas). */
export function DateRangeFilter({ inicio, fim, onChange }: Props) {
  const temPeriodo = Boolean(inicio || fim);
  const invalido = periodoInvalido(inicio, fim);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Período</Text>

        {temPeriodo && (
          <TouchableOpacity
            onPress={() => onChange("", "")}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Text style={styles.clear}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Data início</Text>

          <DatePickerField
            value={inicio}
            onChange={(data) => onChange(data, fim)}
            placeholder="Início"
            maxDate={fim || undefined}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Data fim</Text>

          <DatePickerField
            value={fim}
            onChange={(data) => onChange(inicio, data)}
            placeholder="Fim"
            minDate={inicio || undefined}
          />
        </View>
      </View>

      {invalido && (
        <Text style={styles.error}>
          A data início não pode ser posterior à data fim.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },

  label: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  clear: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.teal600,
  },

  row: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  field: {
    flex: 1,
  },

  fieldLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
    marginBottom: 4,
  },

  error: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xs,
    color: "#C62828",
  },
});
