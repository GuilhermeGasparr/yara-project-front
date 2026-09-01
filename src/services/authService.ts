import { LoginPayload, LoginResponse, AuthUser } from "@/types";

const BASE_URL = "https://yara-project.onrender.com";

const BASE_HEADERS: Record<string, string> = {
  "ngrok-skip-browser-warning": "true",
};

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");

    return JSON.parse(atob(base64));
  } catch {
    throw new Error("Token inválido ou corrompido.");
  }
}

export function buildUserFromToken(
  token: string,
  extras?: Record<string, unknown>,
): AuthUser {
  const payload = decodeJwtPayload(token);

  const tipo = payload["tipo"] as string;
  const id = parseInt(payload["sub"] as string, 10);

  const exp = payload["exp"] as number;

  if (exp && Date.now() / 1000 > exp) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  // =========================
  // ACS / ACE
  // =========================
  if (tipo === "ACS/ACE") {
    return {
      role: "agente",
      id,
      nome: (extras?.["nome"] as string) ?? "",
      cpf: (extras?.["cpf"] as string) ?? "",
      cargo: (extras?.["cargo"] as string) ?? "ACS",
      ubs_atuante: (extras?.["ubs_atuante"] as number) ?? 0,
    };
  }

  // =========================
  // UBS
  // =========================
  if (tipo === "UBS") {
    return {
      role: "ubs",
      id,
      nome: (extras?.["nome"] as string) ?? "",
      cpf: (extras?.["cpf"] as string) ?? "",
      ubs: (extras?.["ubs"] as number) ?? 0,
      municipio: (extras?.["municipio"] as string) ?? "",
    };
  }

  // =========================
  // Coordenador Municipal
  // =========================
  if (tipo === "CM") {
    return {
      role: "cm",
      id,
      nome: (extras?.["nome"] as string) ?? "",
      cpf: (extras?.["cpf"] as string) ?? "",
      cargo: (extras?.["cargo"] as string) ?? "Coordenador Municipal",
      municipio: (extras?.["municipio"] as string) ?? "",
    };
  }

  throw new Error(`Tipo de usuário desconhecido: ${tipo}`);
}

export async function loginRequest(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const form = new URLSearchParams();

  form.append("username", payload.cpf);
  form.append("password", payload.senha);
  form.append("tipo_login", payload.tipo_login ?? "");

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail ?? "Erro ao autenticar. Tente novamente.");
  }

  return {
    access_token: data.access_token,
    token_type: data.type_token,
    usuario: data.usuario,
  };
}
