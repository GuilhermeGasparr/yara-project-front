import { StyleSheet, Text, View } from "react-native";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { WizardNavButtons } from "./WizardNavButtons";
import { WizardData } from "./constants";
import { useAuth } from "@/context/AuthContext";
import { AgenteUser } from "@/types";

interface Props {
  data: WizardData;
  onEnviar: () => void;
  onBack: () => void;
  loading: boolean;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewBlock}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value || "—"}</Text>
    </View>
  );
}

export function Step5Revisao({ data, onEnviar, onBack, loading }: Props) {
  const { user } = useAuth();
  const agente = user as AgenteUser;

  const agora = new Date();
  const dataHoraEnvio = agora.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Revisão</Text>
      <Text style={styles.sub}>
        Confira os dados antes de enviar. Após o envio, não será possível editar.
      </Text>

      <ReviewRow label="Profissional" value={`${agente?.nome ?? "—"} · ${agente?.cargo ?? "—"}`} />
      <ReviewRow label="Categoria"   value={data.categoria ?? "—"} />
      <ReviewRow label="Tipo de ocorrência" value={data.tipo_evento} />
      <ReviewRow label="Data aproximada"    value={data.data_aproximada} />
      <ReviewRow
        label="Afetados"
        value={data.pessoas_animais ? `${data.pessoas_animais} ${data.categoria === "EPIZOOTIA" ? "animais" : "pessoas"}` : "Não informado"}
      />
      <ReviewRow label="Local"          value={data.local_ocorrencia} />
      <ReviewRow label="Identificação"  value={data.meio_identificacao} />
      <ReviewRow label="Situação ativa" value={data.continuidade_situacao} />

      {/* Transcrição IA */}
      {!!data.transcricao && (
        <View style={styles.aiBlock}>
          <Text style={styles.aiLabel}>🤖 Transcrição do áudio</Text>
          <Text style={styles.aiText}>{data.transcricao}</Text>
        </View>
      )}

      {/* Descrição manual (se diferente da transcrição) */}
      {!!data.descricao && data.descricao !== data.transcricao && (
        <ReviewRow label="Descrição adicional" value={data.descricao} />
      )}

      {/* Anexos */}
      <ReviewRow
        label="Anexos"
        value={data.medias.length > 0 ? `${data.medias.length} arquivo(s)` : "Nenhum"}
      />

      {/* Dados automáticos */}
      <View style={[styles.reviewBlock, styles.autoBlock]}>
        <Text style={styles.reviewLabel}>🔒 Gerado automaticamente</Text>
        <Text style={styles.reviewValue}>Data/hora: {dataHoraEnvio}</Text>
        <Text style={styles.reviewValue}>Status inicial: EM ANDAMENTO</Text>
      </View>

      <WizardNavButtons
        onBack={onBack}
        onNext={onEnviar}
        nextLabel="Enviar ✓"
        loading={loading}
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
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  reviewBlock: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 2,
  },
  autoBlock: {
    backgroundColor: Colors.teal50,
    borderLeftWidth: 3,
    borderLeftColor: Colors.teal200,
  },
  reviewLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  reviewValue: {
    fontSize: FontSize.base,
    color: Colors.gray900,
    lineHeight: 22,
  },
  aiBlock: {
    backgroundColor: "#E6F1FB",
    borderLeftWidth: 3,
    borderLeftColor: "#378ADD",
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  aiLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: "#185FA5",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  aiText: {
    fontSize: FontSize.sm,
    color: Colors.gray800,
    lineHeight: 20,
    fontStyle: "italic",
  },
});