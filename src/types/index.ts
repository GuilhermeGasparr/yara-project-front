export type UserRole = 'agente' | 'ubs';

export interface AgenteUser {
  role: 'agente';
  id: number;
  nome: string;
  email: string;
  cargo: string;
  ubs_atuante: number;
}

export interface UBSUser {
  role: 'ubs';
  id: number;
  nome: string;
  email: string;
  ubs: string;
  municipio: string;
}

export type AuthUser = AgenteUser | UBSUser;

export interface LoginPayload {
  email: string;
  senha: string;
  tipo_login: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}