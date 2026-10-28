import { Feather } from "@expo/vector-icons";
import { ComponentProps, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

type IconName = ComponentProps<typeof Feather>["name"];

interface Props {
  visible: boolean;
  /** Chamado ao cancelar e também depois que `onConfirm` termina com sucesso. */
  onClose: () => void;
  /** Executa a ação. Se lançar erro, a mensagem aparece no diálogo. */
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel: string;
  icon?: IconName;
  /** `danger` (vermelho) para ações destrutivas; `primary` (verde) para as demais. */
  tone?: "danger" | "primary";
}

const TONES = {
  danger: {
    iconBg: Colors.red50,
    iconColor: Colors.red600,
    confirmBg: Colors.red600,
  },
  primary: {
    iconBg: Colors.teal50,
    iconColor: Colors.teal600,
    confirmBg: Colors.teal600,
  },
} as const;

/**
 * Tela intermediária de confirmação. A ação só roda no clique em
 * `confirmLabel`; Cancelar, clicar fora e o botão voltar apenas fecham.
 * Erros aparecem dentro do diálogo (Alert.alert não faz nada no web).
 */
export function ConfirmActionDialog({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  icon = "alert-circle",
  tone = "primary",
}: Props) {
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const cores = TONES[tone];

  useEffect(() => {
    if (visible) setErro(null);
  }, [visible]);

  function cancelar() {
    if (executando) return;
    onClose();
  }

  async function confirmar() {
    if (executando) return;

    try {
      setExecutando(true);
      setErro(null);

      await onConfirm();

      onClose();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a ação.",
      );
    } finally {
      setExecutando(false);
    }
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={cancelar}
    >
      <Pressable style={styles.backdrop} onPress={cancelar}>
        {/* O Pressable interno impede que toques no card fechem o diálogo. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.iconCircle, { backgroundColor: cores.iconBg }]}>
            <Feather name={icon} size={24} color={cores.iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.message}>{message}</Text>

          {erro ? <Text style={styles.error}>{erro}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.cancelButton]}
              onPress={cancelar}
              disabled={executando}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: cores.confirmBg },
                executando && styles.confirmButtonLoading,
              ]}
              onPress={confirmar}
              disabled={executando}
            >
              {executando ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: FontSize.base,
    color: Colors.gray600,
    textAlign: "center",
    lineHeight: 20,
  },
  error: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.red600,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
    alignSelf: "stretch",
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: Colors.gray50,
  },
  cancelText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.gray600,
  },
  confirmButtonLoading: {
    opacity: 0.8,
  },
  confirmText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
});
