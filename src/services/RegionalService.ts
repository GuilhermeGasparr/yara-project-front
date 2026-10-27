import { getItem } from "@/utils/storage";
import type { Notificacao } from "./NotificationService";

const BASE_URL = "https://yara-project.onrender.com";
//const BASE_URL = "http://localhost:8000";


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
      data.detail ?? "Erro ao carregar notificações da regional.",
    );
  }

  return data as Notificacao[];
}
export interface DadosSuperintendencia {
  nome: string;
  coads?: string[];
}

export async function obterDadosSuperintendencia(): Promise<DadosSuperintendencia> {
  const headers = await authHeader();

  const response = await fetch(
    `${BASE_URL}/vr/dados_superintendencia_coads`,
    { headers },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ?? "Erro ao carregar dados da superintendência.",
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Nenhuma superintendência foi encontrada.");
  }

  return {
    nome: data[0].Superintendencia,
    coads: data.map(
      (item: { COADS: string }) => item.COADS,
    ),
  };
}


export async function exportarRelatorioRegionalPDF(): Promise<Blob> {
  const headers = await authHeader();

  const response = await fetch(
    `${BASE_URL}/vr/exportar_relatorio/pdf`,
    { headers },
  );

  if (!response.ok) {
    let mensagem = "Não foi possível gerar o PDF.";

    try {
      const data = await response.json();
      mensagem = data.detail ?? mensagem;
    } catch {
      // Mantém a mensagem padrão se a resposta não for JSON.
    }

    throw new Error(mensagem);
  }

  return response.blob();
}
