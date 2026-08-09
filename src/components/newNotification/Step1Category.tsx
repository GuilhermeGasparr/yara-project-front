import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Categoria } from "@/services/NotificationService";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { WizardData } from "./constants";
import { WizardNavButtons } from "./WizardNavButtons";

interface Props {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  onNext: () => void;
}

interface CatOption {
  key: Categoria;
  label: string;
  emoji: string;
  bg: string;
  border: string;
  text: string;
}

const CATS: CatOption[] = [
  { key: "DOENÇA",    label: "Doença",    emoji: "🦠", bg: "#FCEBEB", border: "#F7C1C1", text: Colors.red600   },
  { key: "EPIZOOTIA", label: "Epizootia", emoji: "🐾", bg: "#FAEEDA", border: "#FAC775", text: "#854F0B"        },
  { key: "DESASTRE",  label: "Desastre",  emoji: "⚡", bg: "#E6F1FB", border: "#B5D4F4", text: "#185FA5"        },
];

export function Step1Categoria({ data, onChange, onNext }: Props) {
  function handleNext() {
    if (!data.categoria) return;
    onNext();
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Qual situação deseja comunicar?</Text>
      <Text style={styles.sub}>Selecione a categoria da ocorrência</Text>

      <View style={styles.grid}>
        {CATS.map((cat) => {
          const selected = data.categoria === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.card,
                { backgroundColor: cat.bg, borderColor: selected ? Colors.teal600 : cat.border },
                selected && styles.cardSelected,
              ]}
              onPress={() => onChange({ categoria: cat.key })}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, { color: selected ? Colors.teal600 : cat.text }]}>
                {cat.label}
              </Text>
              {selected && <View style={styles.checkDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {!data.categoria && (
        <Text style={styles.hint}>Selecione uma categoria para continuar</Text>
      )}

      <WizardNavButtons
        hideBack
        onNext={handleNext}
        nextLabel="Próximo →"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  heading: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: 4,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    marginBottom: Spacing.xl,
  },
  grid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 2,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
    position: "relative",
  },
  cardSelected: {
    borderColor: Colors.teal600,
    shadowColor: Colors.teal400,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  emoji: { fontSize: 28 },
  catLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  checkDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.teal600,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textAlign: "center",
    marginTop: Spacing.md,
  },
});