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

export async function listarNotificacoesRegionais(): Promise<Notificacao[]> {
  const headers = await authHeader();

  const response = await fetch(`${BASE_URL}/vr/notificacoes`, {
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ?? "Erro ao carregar notificações da regional."
    );
  }

  return (data.notificacoes ?? []) as Notificacao[];
}

export interface DadosSuperintendencia {
  id: number;
  nome: string;
  municipio?: string;
  [key: string]: unknown;
}

export async function obterDadosSuperintendencia(): Promise<DadosSuperintendencia> {
  const headers = await authHeader();

  const response = await fetch(
    `${BASE_URL}/vr/dados_superintendencia`,
    {
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ?? "Erro ao carregar dados da superintendência."
    );
  }

  return data["Dados da Superintendência"] as DadosSuperintendencia;
}