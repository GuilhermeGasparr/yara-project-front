import { getItem } from "@/utils/storage";
import type { Notificacao } from "./NotificationService";

const BASE_URL = "https://yara-project.onrender.com";

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
    throw new Error(
      data.detail ?? "Erro ao carregar notificações estaduais.",
    );
  }

  return (data["Notificações"] ?? []) as Notificacao[];
}

export async function baixarRelatorioPDFVE(): Promise<Blob> {
const headers = await authHeader();

const response = await fetch(`${BASE_URL}/ve/exportar_relatorio/pdf`, {
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