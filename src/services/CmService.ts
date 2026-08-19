import { getItem } from "@/utils/storage";

const BASE_URL = "https://confutable-marybeth-throatily.ngrok-free.dev";
const SKIP = { "ngrok-skip-browser-warning": "true" };

async function authHeader(): Promise<Record<string, string>> {
  const token = await getItem("sentinela_token");
  if (!token) throw new Error("Não autenticado.");
  return { ...SKIP, Authorization: `Bearer ${token}` };
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type StatusCM =
  | "RECEBIDO"
  | "EM INVESTIGAÇÃO"
  | "CONFIRMADO"
  | "DESCARTADO"
  | "ENCERRADO"
  | "VALIDADA"
  | "ENCAMINHADA"
  | "EM ANDAMENTO";

export interface NotificacaoCM {
  id: number;
  nome: string;
  tipo_evento: string;
  categoria: string;
  data_envio: string;
  pessoas_animais_infectados_afetados: number;
  local_ocorrencia: string;
  continuidade_situacao: string;
  descricao: string;
  acs_ace_id: number;
  status: StatusCM;
  rascunho: boolean;
}

export interface DashboardStats {
  total: number;
  em_investigacao: number;
  confirmados: number;
}

// ─── GET /cm/listar_notificacoes ──────────────────────────────────────────────

export async function listarNotificacoesCM(): Promise<NotificacaoCM[]> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/cm/listar_notificacoes`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Erro ao buscar notificações.");
  return (data.notificacoes ?? []) as NotificacaoCM[];
}

// ─── GET /cm/dashboard_stats ──────────────────────────────────────────────────

export async function buscarDashboardStats(): Promise<DashboardStats> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/cm/dashboard_stats`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Erro ao buscar estatísticas.");
  return data as DashboardStats;
}

// ─── PATCH status ─────────────────────────────────────────────────────────────

type StatusEndpoint =
  | "status_recebido"
  | "status_em_investigacao"
  | "status_confirmado"
  | "status_descartado"
  | "status_encerrado";

async function patchStatus(id: number, endpoint: StatusEndpoint): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/cm/notificacoes/${id}/${endpoint}`, {
    method: "PATCH",
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Erro ao atualizar status.");
}

export const setRecebido      = (id: number) => patchStatus(id, "status_recebido");
export const setEmInvestigacao = (id: number) => patchStatus(id, "status_em_investigacao");
export const setConfirmado    = (id: number) => patchStatus(id, "status_confirmado");
export const setDescartado    = (id: number) => patchStatus(id, "status_descartado");
export const setEncerrado     = (id: number) => patchStatus(id, "status_encerrado");

// ─── GET /cm/exportar_relatorio ───────────────────────────────────────────────

export async function exportarRelatorio(): Promise<unknown[]> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/cm/exportar_relatorio`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Erro ao exportar.");
  return data.relatorio ?? [];
}

export async function exportarRelatorioPDF(): Promise<Blob> {
  const headers = await authHeader();

  const res = await fetch(
    `${BASE_URL}/cm/exportar_relatorio/pdf`,
    {
      method: "GET",
      headers,
    }
  );

  if (!res.ok) {
    let message = "Erro ao gerar PDF.";

    try {
      const data = await res.json();
      message = data.detail ?? message;
    } catch {}

    throw new Error(message);
  }

  return await res.blob();
}


export async function baixarRelatorioNotificacaoPDF(
  notificacaoId: number
): Promise<Blob> {
  const headers = await authHeader();

  const res = await fetch(
    `${BASE_URL}/cm/notificacoes/${notificacaoId}/relatorio_pdf`,
    {
      method: "GET",
      headers,
    }
  );

  if (!res.ok) {
    let mensagem = "Erro ao gerar relatório.";

    try {
      const data = await res.json();
      mensagem = data.detail ?? mensagem;
    } catch {}

    throw new Error(mensagem);
  }

  return await res.blob();
}