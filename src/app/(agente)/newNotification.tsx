import { Step1Categoria } from "@/components/newNotification/Step1Category";
import { Step2Detalhes } from "@/components/newNotification/Step2Details";
import { Step3Audio } from "@/components/newNotification/Step3Audio";
import { Step4Anexos } from "@/components/newNotification/Step4Attachments";
import { Step5Revisao } from "@/components/newNotification/Step5Revision";
import { Step6Sucesso } from "@/components/newNotification/Step6Sucess";
import { WizardHeader } from "@/components/newNotification/WizardHeader";
import { useFocusEffect, router } from "expo-router";
import { useCallback, useState } from "react";
import {
  WIZARD_INITIAL,
  WizardData,
} from "@/components/newNotification/constants";
import { Colors, Spacing } from "@/constants/theme";
import {
  criarNotificacao,
  listarNotificacoes,
} from "@/services/NotificationService";
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

  useFocusEffect(
    useCallback(() => {
      setStep(1);
      setData(WIZARD_INITIAL);
      setSending(false);
      setNotificacaoId(null);
    }, []),
  );
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
      const tipoEventoFinal = data.tipo_evento
        .trim()
        .toLowerCase()
        .includes("outro")
        ? data.outro_tipo_evento.trim()
        : data.tipo_evento;

      const localOcorrenciaFinal = data.local_ocorrencia
        .trim()
        .toLowerCase()
        .includes("outro")
        ? data.outro_local_ocorrencia.trim()
        : data.local_ocorrencia;

      const meioIdentificacaoFinal = data.meio_identificacao
        .trim()
        .toLowerCase()
        .includes("outro")
        ? data.outro_meio_identificacao.trim()
        : data.meio_identificacao;
      const nome = `${data.categoria} — ${tipoEventoFinal} (${new Date().toLocaleDateString("pt-BR")})`;

      console.log("TIPO EVENTO ORIGINAL:", data.tipo_evento);
      console.log("OUTRO TIPO EVENTO:", data.outro_tipo_evento);
      console.log("TIPO EVENTO ENVIADO:", tipoEventoFinal);

      if (!tipoEventoFinal) {
        Alert.alert("Campo obrigatório", "Especifique o tipo de ocorrência.");
        return;
      }

      if (!localOcorrenciaFinal) {
        Alert.alert("Campo obrigatório", "Especifique o local da ocorrência.");
        return;
      }

      if (!meioIdentificacaoFinal) {
        Alert.alert(
          "Campo obrigatório",
          "Especifique como a ocorrência foi identificada.",
        );
        return;
      }
      await criarNotificacao({
        nome,
        tipo_evento: tipoEventoFinal,
        categoria: data.categoria,
        pessoas_animais_infectados_afetados: parseInt(
          data.pessoas_animais || "0",
          10,
        ),
        local_ocorrencia: localOcorrenciaFinal,
        endereco: data.endereco,
        estado: data.estado,
        municipio: data.municipio,
        continuidade_situacao: data.continuidade_situacao,
        descricao: data.descricao || data.transcricao || "Sem descrição.",
        status: "EM ANDAMENTO",
        rascunho,
        medias: data.medias,
      });

      // Busca novamente as notificações do agente
      const notificacoes = await listarNotificacoes();

      // Procura a notificação que acabou de ser criada
      const notificacaoCriada = notificacoes
        .filter(
          (item) =>
            item.nome === nome &&
            item.tipo_evento === tipoEventoFinal &&
            item.categoria === data.categoria,
        )
        .sort(
          (a, b) =>
            new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime(),
        )[0];

      if (!notificacaoCriada) {
        throw new Error(
          "A notificação foi criada, mas não foi possível obter seu protocolo.",
        );
      }

      setNotificacaoId(notificacaoCriada.id);
      setStep(6);
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
        title="Nova notificação"
        step={step}
        totalSteps={6}
        onBack={() => {
          if (step > 1) {
            setStep((prev) => prev - 1);
          } else {
            router.back();
          }
        }}
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
