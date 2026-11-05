import { Colors } from "@/constants/theme";

// ─── Configurações de status e categoria das notificações do CM ───────────────

export const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> =
  {
    "EM ANDAMENTO": {
      label: "Pendente",
      bg: "#E4F0FD",
      color: "#1261A0",
    },

    "EM INVESTIGAÇÃO": {
      label: "Em investigação",
      bg: "#FAEEDA",
      color: "#854F0B",
    },

    VERÍDICO: {
      label: "Verídico",
      bg: Colors.teal50,
      color: Colors.teal800,
    },

    "NÃO VERÍDICO": {
      label: "Não verídico",
      bg: "#FDE8E8",
      color: "#C62828",
    },

    ENCERRADO: {
      label: "Encerrado",
      bg: Colors.gray50,
      color: Colors.gray600,
    },
  };

export const CATEGORIA_COLOR: Record<string, string> = {
  DOENÇA: Colors.red400,
  EPIZOOTIA: "#BA7517",
  DESASTRE: "#378ADD",
};

export function rotuloStatus(status?: string): string {
  if (!status) return "";
  return STATUS_CFG[status]?.label ?? status;
}
