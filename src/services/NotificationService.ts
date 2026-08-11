import { getItem } from "@/utils/storage";
import { Platform } from "react-native";
const BASE_URL = "http://localhost:8000";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type NotificacaoStatus =
  | "EM ANDAMENTO"
  | "RECEBIDO"
  | "EM INVESTIGAÇÃO"
  | "CONFIRMADO"
  | "DESCARTADO"
  | "ENCERRADO";

export type Categoria = "DOENÇA" | "EPIZOOTIA" | "DESASTRE";

export interface Notificacao {
  id: number;
  nome: string;
  tipo_evento: string;
  categoria: Categoria;
  data_envio: string;
  pessoas_animais_infectados_afetados: number;
  local_ocorrencia: string;
  endereco?: string; // <--- ADICIONADO
  latitude?: number; // <--- ADICIONADO
  longitude?: number; // <--- ADICIONADO
  continuidade_situacao: string;
  descricao: string;
  acs_ace_id: number;
  status: NotificacaoStatus;
  rascunho: boolean;
}

export interface CriarNotificacaoPayload {
  nome: string;
  tipo_evento: string;
  categoria: Categoria;
  pessoas_animais_infectados_afetados: number;
  local_ocorrencia: string;
  endereco?: string;
  estado?: string;
  municipio?: string;
  latitude?: number;
  longitude?: number;
  continuidade_situacao: string;
  descricao: string;
  status: NotificacaoStatus;
  rascunho: boolean;
  medias?: { uri: string; name: string; type: string }[];
}

// ─── Helper para obter o token armazenado ─────────────────────────────────────

async function authHeader(): Promise<Record<string, string>> {
  const token = await getItem("sentinela_token");
  if (!token) throw new Error("Não autenticado.");
  return { Authorization: `Bearer ${token}` };
}

// ─── Listar notificações do agente logado ─────────────────────────────────────
// GET /agentes/listar_notificacoes

export async function listarNotificacoes(): Promise<Notificacao[]> {
  const headers = await authHeader();

  const res = await fetch(`${BASE_URL}/agentes/listar_notificacoes`, {
    headers,
  });
  const data = await res.json();

  if (!res.ok) throw new Error(data.detail ?? "Erro ao carregar notificações.");

  // O backend retorna { "Notificações": [...] }
  return data["Notificações"] as Notificacao[];
}

// ─── Criar notificação ────────────────────────────────────────────────────────
// POST /agentes/criar_notificacao  (multipart/form-data)

export async function criarNotificacao(
  payload: CriarNotificacaoPayload,
): Promise<{ response: string }> {
  const headers = await authHeader();

  const form = new FormData();

  form.append("nome", payload.nome);
  form.append("tipo_evento", payload.tipo_evento);
  form.append("categoria", payload.categoria);

  form.append(
    "pessoas_animais_infectados_afetados",
    String(payload.pessoas_animais_infectados_afetados),
  );

  form.append("local_ocorrencia", payload.local_ocorrencia);

  // Novos campos enviados ao FormData
  if (payload.endereco) {
    form.append("endereco", payload.endereco);
  }
  if (payload.estado) {
    form.append("estado", payload.estado);
  }
  if (payload.municipio) {
    form.append("municipio", payload.municipio);
  }
  if (payload.latitude !== undefined && payload.latitude !== null) {
    form.append("latitude", String(payload.latitude));
  }
  if (payload.longitude !== undefined && payload.longitude !== null) {
    form.append("longitude", String(payload.longitude));
  }

  form.append("continuidade_situacao", payload.continuidade_situacao);
  form.append("descricao", payload.descricao);
  form.append("status", payload.status);
  form.append("rascunho", String(payload.rascunho));

  for (const media of payload.medias ?? []) {
    if (Platform.OS === "web") {
      const response = await fetch(media.uri);
      const blob = await response.blob();

      form.append("medias", blob, media.name);
    } else {
      form.append("medias", {
        uri: media.uri,
        name: media.name,
        type: media.type,
      } as any);
    }
  }

  const res = await fetch(`${BASE_URL}/agentes/criar_notificacao`, {
    method: "POST",
    headers,
    body: form,
  });

  const data = await res.json();

  console.log("STATUS CRIAÇÃO:", res.status);
  console.log("RESPOSTA CRIAÇÃO:", data);

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao criar notificação.");
  }

  return data;
}

// ─── Transcrever áudio ────────────────────────────────────────────────────────
// POST /agentes/transcricao_audio

export async function transcreverAudio(
  audioUri: string,
  filename: string,
): Promise<string> {
  const headers = await authHeader();

  const form = new FormData();

  if (Platform.OS === "web") {
    // No navegador, transforma a URI em um Blob real
    const response = await fetch(audioUri);
    const blob = await response.blob();

    form.append("audio", blob, filename);
  } else {
    // Android / iOS: React Native aceita o objeto de arquivo
    form.append("audio", {
      uri: audioUri,
      name: filename,
      type: "audio/m4a",
    } as any);
  }

  const res = await fetch(`${BASE_URL}/agentes/transcricao_audio`, {
    method: "POST",
    headers,
    body: form,
  });

  const data = await res.json();

  console.log("STATUS TRANSCRIÇÃO:", res.status);
  console.log("RESPOSTA TRANSCRIÇÃO:", data);

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro na transcrição.");
  }

  return data.texto_transcrito as string;
}
