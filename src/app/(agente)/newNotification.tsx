import { Step1Categoria } from "@/components/newNotification/Step1Category";
import { Step2Detalhes } from "@/components/newNotification/Step2Details";
import { Step3Audio } from "@/components/newNotification/Step3Audio";
import { Step4Anexos } from "@/components/newNotification/Step4Attachments";
import { Step5Revisao } from "@/components/newNotification/Step5Revision";
import { Step6Sucesso } from "@/components/newNotification/Step6Sucess";
import { WizardHeader } from "@/components/newNotification/WizardHeader";
import {
  WIZARD_INITIAL,
  WizardData,
} from "@/components/newNotification/constants";
import { Colors, Spacing } from "@/constants/theme";
import { criarNotificacao } from "@/services/NotificationService";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

const TOTAL_STEPS = 5; // passo 6 (sucesso) não conta na barra

const STEP_TITLES = [
  "Nova Notificação",
  "Detalhes",
  "Descrição",
  "Anexos",
  "Revisão",
];

export default function NewNotificationScreen() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(WIZARD_INITIAL);
  const [sending, setSending] = useState(false);
  const [notificacaoId, setNotificacaoId] = useState<number | null>(null);

  // ─── Atualização parcial do wizard ──────────────────────────────────────────

  function update(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  // ─── Navegação entre passos ──────────────────────────────────────────────────

  function next() {
    setStep((s) => s + 1);
  }

  function back() {
    if (step === 1) return; // WizardHeader já faz router.back() no passo 1 via hideBack=false
    setStep((s) => s - 1);
  }

  // ─── Envio ao backend ────────────────────────────────────────────────────────

  async function handleEnviar(rascunho: boolean) {
    if (!data.categoria || !data.tipo_evento || !data.local_ocorrencia) {
      Alert.alert(
        "Campos obrigatórios",
        "Preencha a categoria, tipo e local da ocorrência.",
      );
      return;
    }

    setSending(true);
    try {
      const nome = `${data.categoria} — ${data.tipo_evento} (${new Date().toLocaleDateString("pt-BR")})`;

      const resultado = await criarNotificacao({
        nome,
        tipo_evento: data.tipo_evento,
        categoria: data.categoria,
        pessoas_animais_infectados_afetados: parseInt(
          data.pessoas_animais || "0",
          10,
        ),
        local_ocorrencia: data.local_ocorrencia,
        continuidade_situacao: data.continuidade_situacao,
        descricao: data.descricao || data.transcricao || "Sem descrição.",
        status: "EM ANDAMENTO",
        rascunho,
        medias: data.medias,
      });

      // O backend retorna "Notificação X com id Y Criada com sucesso!"
      const match = resultado.response.match(/id (\d+)/);
      const id = match ? parseInt(match[1], 10) : 0;

      setNotificacaoId(id);
      setStep(6); // tela de sucesso
    } catch (err) {
      Alert.alert(
        "Erro ao enviar",
        err instanceof Error ? err.message : "Tente novamente.",
      );
    } finally {
      setSending(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  // Tela de sucesso não tem header nem scroll
  if (step === 6 && notificacaoId !== null) {
    return (
      <View style={styles.screen}>
        <Step6Sucesso notificacaoId={notificacaoId} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <WizardHeader
        title={STEP_TITLES[step - 1]}
        step={step}
        totalSteps={TOTAL_STEPS}
        onBack={back}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <Step1Categoria data={data} onChange={update} onNext={next} />
        )}
        {step === 2 && (
          <Step2Detalhes
            data={data}
            onChange={update}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <Step3Audio
            data={data}
            onChange={update}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <Step4Anexos
            data={data}
            onChange={update}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 5 && (
          <Step5Revisao
            data={data}
            onEnviar={() => handleEnviar(false)}
            onBack={back}
            loading={sending}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
});
