import { LoginPayload, LoginResponse } from "@/types";

// Troque pelo IP da sua máquina ao rodar no dispositivo físico
// Ex: 'http://192.168.x.x:8000'
const BASE_URL = "http://localhost:8000";

/**
 * Faz login enviando email + senha como form-data (padrão OAuth2 do FastAPI)
 * e retorna o access_token JWT.
 */
export async function loginRequest(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const form = new URLSearchParams();
  form.append("username", payload.email); // FastAPI OAuth2 espera 'username'
  form.append("password", payload.senha);

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao autenticar. Tente novamente.");
  }

  return data as LoginResponse;
}

/**
 * Busca o perfil do usuário autenticado.
 * O backend deve retornar { role, ...fields } para distinguir Agente de UBS.
 */
export async function fetchMe(token: string) {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Sessão inválida.");
  }

  return data;
}
