import { getItem } from "@/utils/storage";
import { normalizarNotificacoes } from "@/utils/status";
import type { Notificacao } from "./NotificationService";

//const BASE_URL = "https://yara-project.onrender.com";
const BASE_URL = "http://localhost:8000";

async function authHeader(): Promise<Record<string, string>> {
  const token = await getItem("sentinela_token");

  if (!token) {
    throw new Error("Não autenticado.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function listarNotificacoesVE(): Promise<Notificacao[]> {
  const headers = await authHeader();

  const response = await fetch(`${BASE_URL}/ve/notificacoes`, {
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail ?? "Erro ao carregar notificações estaduais.");
  }

  return normalizarNotificacoes((data["Notificações"] ?? []) as Notificacao[]);
}

export async function baixarRelatorioXlsxVE(): Promise<Blob> {
  const headers = await authHeader();

  const response = await fetch(`${BASE_URL}/ve/exportar_relatorio/xlsx`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    let mensagem = "Erro ao baixar o relatório estadual.";

    try {
      const data = await response.json();
      mensagem = data.detail ?? mensagem;
    } catch {}

    throw new Error(mensagem);
  }

  return response.blob();
}

export async function baixarRelatorioNotificacaoXlsxVE(
  notificacaoId: number,
): Promise<Blob> {
  const headers = await authHeader();

  const response = await fetch(
    `${BASE_URL}/ve/notificacoes/${notificacaoId}/relatorio_xlsx`,
    {
      method: "GET",
      headers,
    },
  );

  if (!response.ok) {
    let mensagem = "Erro ao baixar o relatório da notificação.";

    try {
      const data = await response.json();
      mensagem = data.detail ?? mensagem;
    } catch {}

    throw new Error(mensagem);
  }

  return response.blob();
}
