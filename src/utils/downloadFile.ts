import { Alert, Platform } from "react-native";

/**
 * Entrega um arquivo recebido do backend ao usuário.
 * Web: dispara o download pelo navegador.
 * Mobile: o salvamento nativo ainda não existe, então só avisa.
 */
export function baixarBlob(blob: Blob, nomeArquivo: string): void {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = nomeArquivo;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  Alert.alert(
    "Relatório recebido",
    "A planilha foi recebida, mas o salvamento no dispositivo ainda precisa ser implementado.",
  );
}
