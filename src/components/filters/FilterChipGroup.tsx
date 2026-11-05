import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import type { OpcaoFiltro } from "@/utils/filtros";

interface Props {
  label: string;
  options: OpcaoFiltro[];
  selected: string;
  onSelect: (value: string) => void;
}

/** Rótulo + linha horizontal de chips (formato dos filtros do Vigilante Estadual). */
export function FilterChipGroup({ label, options, selected, onSelect }: Props) {
  return (
    <>
      <Text style={styles.filterLabel}>{label}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {options.map((opcao) => {
          const active = selected === opcao.value;

          return (
            <TouchableOpacity
              key={opcao.value}
              onPress={() => onSelect(opcao.value)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {opcao.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  filterLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },

  filterRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },

  filterChipActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },

  filterChipText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gray600,
  },

  filterChipTextActive: {
    color: Colors.white,
  },
});
