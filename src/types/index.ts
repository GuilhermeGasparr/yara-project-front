export type UserRole = "agente" | "ubs" | "cm";

export interface AgenteUser {
  role: "agente";
  id: number;
  nome: string;
  email: string;
  cargo: string;
  ubs_atuante: number;
}

export interface UBSUser {
  role: "ubs";
  id: number;
  nome: string;
  email: string;
  ubs: string;
  municipio: string;
}

export interface CMUser {
  role: "cm";
  id: number;
  nome: string;
  email: string;
  cargo: string;
  municipio: string;
}

export type AuthUser = AgenteUser | UBSUser | CMUser;

export interface LoginPayload {
  email: string;
  senha: string;
  tipo_login?: string;
}

export interface LoginUsuario {
  id: number;
  nome: string;
  email: string;
  cargo?: string;
  ubs?: string | number;
  municipio?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: LoginUsuario;
}

export interface ApiError {
  detail: string;
}