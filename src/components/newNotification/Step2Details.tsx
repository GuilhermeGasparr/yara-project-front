import { ScrollView, Text, View, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { PickerField, SegmentedPicker, TextField } from "./FormField";
import { WizardNavButtons } from "./WizardNavButtons";
import {
  CONTINUIDADE_OPTIONS,
  ESTADOS_BRASIL,
  LOCAIS_OCORRENCIA,
  MEIOS_IDENTIFICACAO,
  MUNICIPIOS_CEARA,
  TIPOS_POR_CATEGORIA,
  WizardData,
} from "./constants";

interface Props {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Detalhes({ data, onChange, onNext, onBack }: Props) {
  const tipos = data.categoria ? TIPOS_POR_CATEGORIA[data.categoria] : [];
  const categoriaLabel = data.categoria ?? "";

  const labelAfetados =
    data.categoria === "EPIZOOTIA"
      ? "Nº estimado de animais afetados"
      : "Nº estimado de pessoas afetadas";

  function handleNext() {
    if (
      !data.tipo_evento ||
      !data.local_ocorrencia ||
      !data.estado ||
      !data.municipio
    ) {
      return;
    }

    onNext();
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Especifique a ocorrência</Text>
      <Text style={styles.categoriaChip}>{categoriaLabel}</Text>

      <PickerField
        label="Tipo de ocorrência *"
        options={tipos}
        value={data.tipo_evento}
        onSelect={(v) => onChange({ tipo_evento: v })}
        placeholder="Selecione o tipo..."
        error={!data.tipo_evento ? "" : undefined}
      />
      <TextField
        label="Endereço da ocorrência (Ex: Rua das Flores, 45)"
        value={data.endereco}
        onChangeText={(v) => onChange({ endereco: v })}
        placeholder="Rua, número, bairro..."
      />
      <PickerField
        label="Estado"
        options={ESTADOS_BRASIL}
        value={data.estado}
        onSelect={(v) =>
          onChange({
            estado: v,
            municipio: "",
          })
        }
        placeholder="Selecione o estado..."
      />

      <PickerField
        label="Município"
        options={data.estado === "Ceará" ? MUNICIPIOS_CEARA : []}
        value={data.municipio}
        onSelect={(v) => onChange({ municipio: v })}
        placeholder={
          data.estado === "Ceará"
            ? "Selecione o município..."
            : "Selecione primeiro o Ceará..."
        }
      />
      <TextField
        label="Data aproximada"
        value={data.data_aproximada}
        onChangeText={(v) => onChange({ data_aproximada: v })}
        placeholder="Ex: 10/06/2025"
        keyboardType="default"
      />

      <TextField
        label={labelAfetados}
        value={data.pessoas_animais}
        onChangeText={(v) => onChange({ pessoas_animais: v })}
        placeholder="Ex: 15"
        keyboardType="numeric"
      />

      <PickerField
        label="Local da ocorrência *"
        options={LOCAIS_OCORRENCIA}
        value={data.local_ocorrencia}
        onSelect={(v) => onChange({ local_ocorrencia: v })}
        placeholder="Selecione o local..."
      />

      <PickerField
        label="Como foi identificado?"
        options={MEIOS_IDENTIFICACAO}
        value={data.meio_identificacao}
        onSelect={(v) => onChange({ meio_identificacao: v })}
        placeholder="Selecione..."
      />

      <SegmentedPicker
        label="A situação continua acontecendo?"
        options={CONTINUIDADE_OPTIONS}
        value={data.continuidade_situacao}
        onSelect={(v) => onChange({ continuidade_situacao: v })}
      />

      <WizardNavButtons onBack={onBack} onNext={handleNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  heading: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  categoriaChip: {
    alignSelf: "flex-start",
    backgroundColor: Colors.teal50,
    color: Colors.teal800,
    fontSize: FontSize.xs,
    fontWeight: "700",
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
});
