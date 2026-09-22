import { ScrollView, Text, View, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { PickerField, SegmentedPicker, TextField } from "./FormField";
import { WizardNavButtons } from "./WizardNavButtons";
import {
  CONTINUIDADE_OPTIONS,
  LOCAIS_OCORRENCIA,
  MEIOS_IDENTIFICACAO,
  MUNICIPIOS_CEARA,
  TIPOS_POR_CATEGORIA,
  WizardData,
} from "./constants";
import DatePickerField from "@/components/DatePickerField";
import { TouchableOpacity } from "react-native";
import { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import DateTimePicker from "@react-native-community/datetimepicker";
interface Props {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}
const isOutro = (value?: string) => {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();

  return (
    normalized === "outro" ||
    normalized === "outros" ||
    normalized.includes("outro")
  );
};

export function Step2Detalhes({ data, onChange, onNext, onBack }: Props) {
  const tipos = data.categoria ? TIPOS_POR_CATEGORIA[data.categoria] : [];
  const categoriaLabel = data.categoria ?? "";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [outroLocal, setOutroLocal] = useState("");
  const [outroTipoOcorrencia, setOutroTipoOcorrencia] = useState("");
  const [outroMeioIdentificacao, setOutroMeioIdentificacao] = useState("");
  const labelAfetados =
    data.categoria === "EPIZOOTIA"
      ? "Nº estimado de animais afetados"
      : "Nº estimado de pessoas afetadas";

  function handleNext() {
    const newErrors: Record<string, string> = {};

    if (!data.tipo_evento) {
      newErrors.tipo_evento = "Selecione o tipo de ocorrência.";
    }

    if (!data.endereco?.trim()) {
      newErrors.endereco = "Informe o endereço da ocorrência.";
    }

    if (!data.estado) {
      newErrors.estado = "Selecione o estado.";
    }

    if (!data.municipio) {
      newErrors.municipio = "Selecione o município.";
    }

    if (!data.data_aproximada) {
      newErrors.data_aproximada = "Informe a data aproximada.";
    }

    if (!data.pessoas_animais?.trim()) {
      newErrors.pessoas_animais = `Informe ${labelAfetados.toLowerCase()}.`;
    }

    if (!data.local_ocorrencia) {
      newErrors.local_ocorrencia = "Selecione o local da ocorrência.";
    }

    if (isOutro(data.local_ocorrencia) && !data.outro_local_ocorrencia.trim()) {
      newErrors.outroLocal = "Especifique o local da ocorrência.";
    }
    if (isOutro(data.tipo_evento) && !data.outro_tipo_evento?.trim()) {
      newErrors.outroTipoOcorrencia = "Especifique o tipo de ocorrência.";
    }
    if (!data.meio_identificacao) {
      newErrors.meio_identificacao =
        "Informe como a ocorrência foi identificada.";
    }

    if (
      isOutro(data.meio_identificacao) &&
      !data.outro_meio_identificacao.trim()
    ) {
      newErrors.outroMeioIdentificacao =
        "Especifique como a ocorrência foi identificada.";
    }

    if (!data.continuidade_situacao) {
      newErrors.continuidade_situacao =
        "Informe se a situação continua acontecendo.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
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
        onSelect={(v) => {
          onChange({ tipo_evento: v });

          setErrors((prev) => ({
            ...prev,
            tipo_evento: "",
            outroTipoOcorrencia: "",
          }));

          if (!isOutro(v)) {
            onChange({ outro_tipo_evento: "" });
          }
        }}
        placeholder="Selecione o tipo..."
        error={errors.tipo_evento}
      />

      {isOutro(data.tipo_evento) && (
        <TextField
          label="Especifique o tipo de ocorrência *"
          value={data.outro_tipo_evento}
          onChangeText={(v) => {
            onChange({ outro_tipo_evento: v });

            if (v.trim()) {
              setErrors((prev) => ({
                ...prev,
                outroTipoOcorrencia: "",
              }));
            }
          }}
          placeholder="Digite o tipo de ocorrência..."
          error={errors.outroTipoOcorrencia}
        />
      )}
      <TextField
        label="Endereço da ocorrência *"
        value={data.endereco}
        onChangeText={(v) => {
          onChange({ endereco: v });

          if (v.trim()) {
            setErrors((prev) => ({ ...prev, endereco: "" }));
          }
        }}
        placeholder="Rua, número, bairro..."
        error={errors.endereco}
      />

      <PickerField
        label="Município *"
        options={data.estado === "Ceará" ? MUNICIPIOS_CEARA : []}
        value={data.municipio}
        onSelect={(v) => {
          onChange({ municipio: v });

          setErrors((prev) => ({
            ...prev,
            municipio: "",
          }));
        }}
        placeholder={
          data.estado === "Ceará"
            ? "Selecione o município..."
            : "Selecione primeiro o Ceará..."
        }
        error={errors.municipio}
      />

      <Text style={styles.label}>Data Aproximada *</Text>
      <DatePickerField
        value={data.data_aproximada}
        onChange={(date) => {
          onChange({ data_aproximada: date });
          setErrors((prev) => ({ ...prev, data_aproximada: "" }));
        }}
        placeholder="Selecione uma data aproximada"
      />

      {errors.data_aproximada ? (
        <Text style={styles.errorText}>{errors.data_aproximada}</Text>
      ) : null}

      <TextField
        label={`${labelAfetados} *`}
        value={data.pessoas_animais}
        onChangeText={(v) => {
          onChange({ pessoas_animais: v });

          if (v.trim()) {
            setErrors((prev) => ({ ...prev, pessoas_animais: "" }));
          }
        }}
        placeholder="Ex: 15"
        keyboardType="numeric"
        error={errors.pessoas_animais}
      />

      <PickerField
        label="Local da ocorrência *"
        options={LOCAIS_OCORRENCIA}
        value={data.local_ocorrencia}
        onSelect={(v) => {
          onChange({ local_ocorrencia: v });

          setErrors((prev) => ({
            ...prev,
            local_ocorrencia: "",
            outroLocal: "",
          }));

          if (!isOutro(v)) {
            onChange({
              outro_local_ocorrencia: "",
            });
          }
        }}
        placeholder="Selecione o local..."
        error={errors.local_ocorrencia}
      />
      {isOutro(data.local_ocorrencia) && (
        <TextField
          label="Especifique o local *"
          value={data.outro_local_ocorrencia}
          onChangeText={(v) => {
            onChange({ outro_local_ocorrencia: v });

            if (v.trim()) {
              setErrors((prev) => ({
                ...prev,
                outroLocal: "",
              }));
            }
          }}
          placeholder="Digite o local..."
          error={errors.outroLocal}
        />
      )}

      <PickerField
        label="Como foi identificado? *"
        options={MEIOS_IDENTIFICACAO}
        value={data.meio_identificacao}
        onSelect={(v) => {
          onChange({ meio_identificacao: v });

          setErrors((prev) => ({
            ...prev,
            meio_identificacao: "",
            outroMeioIdentificacao: "",
          }));

          if (!isOutro(v)) {
            onChange({
              outro_meio_identificacao: "",
            });
          }
        }}
        placeholder="Selecione..."
        error={errors.meio_identificacao}
      />
      {isOutro(data.meio_identificacao) && (
        <TextField
          label="Especifique como foi identificado *"
          value={data.outro_meio_identificacao}
          onChangeText={(v) => {
            onChange({
              outro_meio_identificacao: v,
            });

            if (v.trim()) {
              setErrors((prev) => ({
                ...prev,
                outroMeioIdentificacao: "",
              }));
            }
          }}
          placeholder="Digite como foi identificado..."
          error={errors.outroMeioIdentificacao}
        />
      )}
      <SegmentedPicker
        label="A situação continua acontecendo? *"
        options={CONTINUIDADE_OPTIONS}
        value={data.continuidade_situacao}
        onSelect={(v) => {
          onChange({ continuidade_situacao: v });
          setErrors((prev) => ({
            ...prev,
            continuidade_situacao: "",
          }));
        }}
      />

      {errors.continuidade_situacao ? (
        <Text style={styles.errorText}>{errors.continuidade_situacao}</Text>
      ) : null}
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
  dateInput: {
    height: 40,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#D9E7E3",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: -4,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    color: "#17211E",
  },

  placeholder: {
    color: "#9CA3AF",
  },
});
