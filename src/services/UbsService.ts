import { getItem } from "@/utils/storage";

const BASE_URL = "https://yara-project.onrender.com";

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
  | "VALIDADA"
  | "ENCAMINHADA"
  | "COMPLEMENTADA"
  | "EM INVESTIGAÇÃO"
  | "CONFIRMADO"
  | "DESCARTADO"
  | "ENCERRADO";

export type Categoria = "DOENÇA" | "EPIZOOTIA" | "DESASTRE";

export interface NotificacaoUBS {
  id: number;
  nome: string;
  tipo_evento: string;
  categoria: Categoria;
  data_envio: string;
  pessoas_animais_infectados_afetados: number;
  local_ocorrencia: string;
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
  return data.notificacoes as NotificacaoUBS[];
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
  informacao_extra: string
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