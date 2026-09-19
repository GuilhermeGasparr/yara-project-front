import { getItem } from "@/utils/storage";
import type { Notificacao } from "./NotificationService";

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
    throw new Error(
      data.detail ?? "Erro ao carregar notificações estaduais.",
    );
  }

  return (data["Notificações"] ?? []) as Notificacao[];
}