export type UserRole = "agente" | "ubs" | "cm";

export interface AgenteUser {
  role: "agente";
  id: number;
  nome: string;
  cpf: string;
  cargo: string;
  ubs_atuante: number;
}

export interface UBSUser {
  role: "ubs";
  id: number;
  nome: string;
  cpf: string;
  ubs: number;
  municipio: string;
}

export interface CMUser {
  role: "cm";
  id: number;
  nome: string;
  cpf: string;
  cargo: string;
  municipio: string;
}

export type AuthUser = AgenteUser | UBSUser | CMUser;

export interface LoginPayload {
  cpf: string;
  senha: string;
  tipo_login?: "ACS/ACE" | "UBS" | "CM";
}

export interface LoginUsuario {
  id: number;
  nome: string;
  cpf: string;
  cargo?: string;
  ubs?: number;
  ubs_atuante?: number;
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