import { getItem } from "@/utils/storage";
import { normalizarNotificacoes } from "@/utils/status";

//const BASE_URL = "https://yara-project.onrender.com";
const BASE_URL = "http://localhost:8000";

const BASE_HEADERS: Record<string, string> = {
  "ngrok-skip-browser-warning": "true",
};

async function authHeader(): Promise<Record<string, string>> {
  const token = await getItem("sentinela_token");
  if (!token) throw new Error("Não autenticado.");
  return { ...BASE_HEADERS, Authorization: `Bearer ${token}` };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type NotificacaoStatus =
  | "EM ANDAMENTO"
  | "EM INVESTIGAÇÃO"
  | "VERÍDICO"
  | "NÃO VERÍDICO"
  | "ENCERRADO";

export type Categoria = "DOENÇA" | "EPIZOOTIA" | "DESASTRE";

export interface NotificacaoUBS {
  id: number;
  nome: string;
  tipo_evento: string;
  categoria: Categoria;
  data_envio: string;
  data_ocorrencia: string;
  pessoas_animais_infectados_afetados: number;
  local_ocorrencia: string;
  endereco?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  municipio?: string;
  estado?: string;
  continuidade_situacao: string;
  descricao: string;
  acs_ace_id: number;
  acs_ace_nome?: string;
  status: NotificacaoStatus;
  rascunho: boolean;
}

// ─── GET /ubs/notificacoes ────────────────────────────────────────────────────

export async function listarNotificacoesUBS(): Promise<NotificacaoUBS[]> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/ubs/notificacoes`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Erro ao buscar notificações.");
  return normalizarNotificacoes(data.notificacoes as NotificacaoUBS[]);
}

// ─── PATCH /ubs/notificacoes/:id/validar ──────────────────────────────────────

export async function validarNotificacao(id: number): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/ubs/notificacoes/${id}/validar`, {
    method: "PATCH",
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Erro ao validar.");
}

export async function baixarRelatorioXlsxUBS(): Promise<Blob> {
  const headers = await authHeader();

  const res = await fetch(`${BASE_URL}/ubs/exportar_relatorio/xlsx`, {
    headers,
  });

  if (!res.ok) {
    let mensagem = "Erro ao baixar o relatório.";

    try {
      const data = await res.json();
      mensagem = data.detail ?? mensagem;
    } catch {
      // Mantém a mensagem padrão se a resposta não for JSON.
    }

    throw new Error(mensagem);
  }

  return res.blob();
}

export async function baixarRelatorioNotificacaoXlsxUBS(
  notificacaoId: number,
): Promise<Blob> {
  const headers = await authHeader();

  const res = await fetch(
    `${BASE_URL}/ubs/notificacoes/${notificacaoId}/relatorio_xlsx`,
    { headers },
  );

  if (!res.ok) {
    let mensagem = "Erro ao baixar o relatório da notificação.";

    try {
      const data = await res.json();
      mensagem = data.detail ?? mensagem;
    } catch {
      // Mantém a mensagem padrão se a resposta não for JSON.
    }

    throw new Error(mensagem);
  }

  return res.blob();
}

// ─── PATCH /ubs/notificacoes/:id/encaminhar ───────────────────────────────────

export async function encaminharNotificacao(id: number): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/ubs/notificacoes/${id}/encaminhar`, {
    method: "PATCH",
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Erro ao encaminhar.");
}

// ─── PATCH /ubs/notificacoes/:id/complementar ─────────────────────────────────

export async function complementarNotificacao(
  id: number,
  informacao_extra: string,
): Promise<void> {
  const headers = await authHeader();
  const url = `${BASE_URL}/ubs/notificacoes/${id}/complementar?informacao_extra=${encodeURIComponent(informacao_extra)}`;
  const res = await fetch(url, { method: "PATCH", headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Erro ao complementar.");
}

export interface DadosUBS {
  id: number;
  nome: string;
  // adicione outros campos se existirem no seu model Dados_UBS
}
export async function setEmInvestigacao(id: number): Promise<void> {
  const headers = await authHeader();

  const res = await fetch(
    `${BASE_URL}/ubs/notificacoes/${id}/status_em_investigacao`,
    {
      method: "PATCH",
      headers,
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao alterar status.");
  }
}

export async function setVeridico(id: number): Promise<void> {
  const headers = await authHeader();

  const res = await fetch(
    `${BASE_URL}/ubs/notificacoes/${id}/status_veridico`,
    {
      method: "PATCH",
      headers,
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao alterar status.");
  }
}

export async function setNaoVeridico(id: number): Promise<void> {
  const headers = await authHeader();

  const res = await fetch(
    `${BASE_URL}/ubs/notificacoes/${id}/status_nao_veridico`,
    {
      method: "PATCH",
      headers,
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao alterar status.");
  }
}

export async function setEncerrado(id: number): Promise<void> {
  const headers = await authHeader();

  const res = await fetch(
    `${BASE_URL}/ubs/notificacoes/${id}/status_encerrado`,
    {
      method: "PATCH",
      headers,
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao alterar status.");
  }
}

// ─── DELETE /ubs/notificacoes/:id/deletar ─────────────────────────────────────

export async function deletarNotificacao(id: number): Promise<void> {
  const headers = await authHeader();

  const res = await fetch(`${BASE_URL}/ubs/notificacoes/${id}/deletar`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    let mensagem = "Erro ao excluir a notificação.";

    try {
      const data = await res.json();
      mensagem = data.detail ?? mensagem;
    } catch {
      // Mantém a mensagem padrão se a resposta não for JSON.
    }

    throw new Error(mensagem);
  }
}

export async function buscarDadosUBS(): Promise<DadosUBS> {
  const headers = await authHeader();

  const res = await fetch(`${BASE_URL}/ubs/dados_ubs`, {
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao buscar dados da UBS.");
  }

  return data["Dados da UBS"] as DadosUBS;
}
