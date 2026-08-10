import { getItem } from '@/utils/storage';

const BASE_URL = 'http://localhost:8000'; // Substitua pelo IP da sua máquina se rodar no celular físico

async function authHeader(): Promise<Record<string, string>> {
  const token = await getItem('sentinela_token');
  if (!token) throw new Error('Token de autenticação não encontrado.');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface NotificacaoUBS {
  id: number;
  nome: string;
  tipo_evento: string;
  categoria: string;
  data_envio: string;
  pessoas_animais_infectados_afetados: number;
  local_ocorrencia: string;
  descricao: string;
  status: string;
  acs_ace_id: number;
  rascunho: boolean;
}

export async function buscarNotificacoesUBS(): Promise<NotificacaoUBS[]> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/ubs/notificacoes`, { method: 'GET', headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Erro ao listar notificações.');
  return data.notificacoes as NotificacaoUBS[];
}

export async function validarNotificacaoAPI(id: number): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/ubs/notificacoes/${id}/validar`, { method: 'PATCH', headers });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail ?? 'Erro ao validar notificação.');
  }
}

export async function encaminharNotificacaoAPI(id: number): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/ubs/notificacoes/${id}/encaminhar`, { method: 'PATCH', headers });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail ?? 'Erro ao encaminhar notificação.');
  }
}

export async function obterDetalhesNotificacaoAPI(id: number): Promise<any> {
  const headers = await authHeader();
  const res = await fetch(`${BASE_URL}/ubs/notificacoes/${id}`, { method: 'GET', headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Erro ao obter detalhes da notificação.');
  return data;
}

export async function complementarNotificacaoAPI(id: number, informacaoExtra: string): Promise<void> {
  const headers = await authHeader();
  const res = await fetch(
    `${BASE_URL}/ubs/notificacoes/${id}/complementar?informacao_extra=${encodeURIComponent(informacaoExtra)}`,
    { method: 'PATCH', headers }
  );
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail ?? 'Erro ao complementar notificação.');
  }
}