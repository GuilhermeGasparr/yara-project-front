import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Colors } from "@/constants/theme";
import { ConfirmActionDialog } from "./ConfirmActionDialog";

interface Props {
  /** Número da notificação, exibido no texto de confirmação. */
  protocolo: number;
  /** Faz a exclusão. Se lançar erro, a mensagem aparece no diálogo. */
  onConfirm: () => Promise<void>;
  style?: StyleProp<ViewStyle>;
}

/**
 * Lixeira para o cabeçalho do detalhe da notificação.
 * O primeiro clique abre o diálogo de confirmação; só o clique em
 * "Excluir" chama `onConfirm`.
 */
export function DeleteNotificationButton({
  protocolo,
  onConfirm,
  style,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [dialogoAberto, setDialogoAberto] = useState(false);

  function abrirDialogo() {
    setHovered(false);
    setDialogoAberto(true);
  }

  return (
    <>
      <Pressable
        onPress={abrirDialogo}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Excluir notificação"
        style={({ pressed }) => [
          styles.button,
          (hovered || pressed) && styles.buttonActive,
          style,
        ]}
      >
        {({ pressed }) => (
          <Feather
            name="trash-2"
            size={19}
            color={hovered || pressed ? Colors.white : Colors.red400}
          />
        )}
      </Pressable>

      <ConfirmActionDialog
        visible={dialogoAberto}
        onClose={() => setDialogoAberto(false)}
        onConfirm={onConfirm}
        tone="danger"
        icon="trash-2"
        title="Excluir notificação?"
        message={`A notificação #${String(protocolo).padStart(4, "0")} será excluída permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  buttonActive: {
    backgroundColor: Colors.red400,
  },
});
