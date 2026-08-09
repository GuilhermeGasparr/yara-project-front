import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { transcreverAudio } from "@/services/NotificationService";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { WizardNavButtons } from "./WizardNavButtons";
import { WizardData } from "./constants";

interface Props {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type RecordState = "idle" | "recording" | "transcribing" | "done";

const DICAS_POR_CATEGORIA: Record<string, string[]> = {
  DOENÇA: [
    "Quantas pessoas foram afetadas?",
    "Quais sintomas foram observados?",
    "Quando começou?",
    "O local ainda tem pessoas doentes?",
  ],
  EPIZOOTIA: [
    "Quantos animais foram afetados?",
    "Quais sintomas apresentaram?",
    "Quando começou?",
    "Alguma pessoa teve contato com o animal?",
  ],
  DESASTRE: [
    "O que aconteceu?",
    "Quantas pessoas foram afetadas?",
    "Há risco atual?",
    "Existe necessidade de ajuda urgente?",
  ],
};

export function Step3Audio({ data, onChange, onNext, onBack }: Props) {
  const [state, setState] = useState<RecordState>("idle");
  const recordingRef    = useRef<Audio.Recording | null>(null);
  const pulseAnim       = useRef(new Animated.Value(1)).current;

  const dicas = DICAS_POR_CATEGORIA[data.categoria ?? "DOENÇA"];

  // ─── Animação de pulso durante gravação ─────────────────────────────────────

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }

  function stopPulse() {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }

  // ─── Gravação ───────────────────────────────────────────────────────────────

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("Permissão negada", "Habilite o microfone nas configurações do dispositivo.");
        return;
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setState("recording");
      startPulse();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível iniciar a gravação.");
    }
  }

  async function stopRecording() {
    stopPulse();
    setState("transcribing");

    try {
      const recording = recordingRef.current;
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error("URI do áudio não encontrado.");

      // Envia para o backend transcrever via Whisper
      const texto = await transcreverAudio(uri, "audio.m4a");
      onChange({ transcricao: texto, descricao: texto });
      setState("done");
    } catch (e) {
      Alert.alert("Erro na transcrição", e instanceof Error ? e.message : "Tente novamente.");
      setState("idle");
    }
  }

  function handleMicPress() {
    if (state === "idle" || state === "done") startRecording();
    else if (state === "recording") stopRecording();
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Descreva o que aconteceu</Text>

      {/* Dicas */}
      <View style={styles.dicasBox}>
        <Text style={styles.dicasTitle}>🎤 Dicas para a gravação:</Text>
        {dicas.map((d, i) => (
          <Text key={i} style={styles.dica}>• {d}</Text>
        ))}
      </View>

      {/* Botão de gravação */}
      <Animated.View style={[styles.micWrap, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[
            styles.micBtn,
            state === "recording"   && styles.micBtnRecording,
            state === "transcribing" && styles.micBtnLoading,
          ]}
          onPress={handleMicPress}
          activeOpacity={0.85}
          disabled={state === "transcribing"}
        >
          {state === "transcribing" ? (
            <ActivityIndicator color={Colors.white} size="large" />
          ) : (
            <Text style={styles.micIcon}>
              {state === "recording" ? "⏹" : state === "done" ? "🔄" : "🎤"}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.micLabel}>
        {state === "idle"        && "Toque para gravar"}
        {state === "recording"   && "Gravando... toque para parar"}
        {state === "transcribing" && "Transcrevendo com IA..."}
        {state === "done"        && "Áudio transcrito ✓ — toque para regravar"}
      </Text>

      {/* Transcrição */}
      {state === "done" && data.transcricao !== "" && (
        <View style={styles.transcricaoBox}>
          <Text style={styles.transcricaoLabel}>🤖 Transcrição por IA</Text>
          <Text style={styles.transcricaoText}>{data.transcricao}</Text>
        </View>
      )}

      {/* Texto manual */}
      <Text style={styles.ouLabel}>Ou descreva por escrito</Text>
      <TextInput
        style={styles.textarea}
        value={data.descricao}
        onChangeText={(v) => onChange({ descricao: v })}
        placeholder="Descreva detalhes adicionais aqui..."
        placeholderTextColor={Colors.gray200}
        multiline
        textAlignVertical="top"
        numberOfLines={4}
      />

      <WizardNavButtons onBack={onBack} onNext={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  heading: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: Spacing.md,
  },
  dicasBox: {
    backgroundColor: Colors.teal50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: 4,
  },
  dicasTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.teal800,
    marginBottom: 4,
  },
  dica: {
    fontSize: FontSize.sm,
    color: Colors.teal600,
    lineHeight: 20,
  },
  micWrap: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.teal600,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.teal800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  micBtnRecording: {
    backgroundColor: Colors.red400,
  },
  micBtnLoading: {
    backgroundColor: Colors.gray400,
  },
  micIcon: {
    fontSize: 32,
  },
  micLabel: {
    textAlign: "center",
    fontSize: FontSize.sm,
    color: Colors.gray400,
    marginBottom: Spacing.lg,
  },
  transcricaoBox: {
    backgroundColor: "#E6F1FB",
    borderLeftWidth: 3,
    borderLeftColor: "#378ADD",
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  transcricaoLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: "#185FA5",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  transcricaoText: {
    fontSize: FontSize.sm,
    color: Colors.gray800,
    lineHeight: 20,
    fontStyle: "italic",
  },
  ouLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: Colors.gray100,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.gray900,
    backgroundColor: Colors.white,
    minHeight: 96,
  },
});