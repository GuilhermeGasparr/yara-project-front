import { LoginPayload, LoginResponse } from "@/types";

// 1. Troque pelo link gerado pelo Ngrok que está no seu terminal
const BASE_URL = "https://confutable-marybeth-throatily.ngrok-free.dev";

/**
 * Faz login enviando email + senha como form-data (padrão OAuth2 do FastAPI)
 * e retorna o access_token JWT.
 */
export async function loginRequest(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const form = new URLSearchParams();
  form.append("username", payload.email);
  form.append("password", payload.senha);
  form.append("tipo_login", payload.tipo_login);
  
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/x-www-form-urlencoded",
      // 2. Adicione esta linha para pular o aviso do Ngrok nas chamadas POST
      "ngrok-skip-browser-warning": "true" 
    },
    body: form.toString(),
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao autenticar. Tente novamente.");
  }
  
  return data as LoginResponse;
}

