/**
 * O backend grava notificações novas com status "PENDENTE", mas o app usa
 * "EM ANDAMENTO" para esse mesmo estado (contadores, filtros, badges, mapas).
 * Normalizamos na entrada dos dados para o app inteiro falar a mesma língua.
 */
const STATUS_PENDENTE_API = "PENDENTE";
const STATUS_PENDENTE_APP = "EM ANDAMENTO";

export function normalizarStatus<S extends string>(status: S): S {
  if (typeof status !== "string") return status;

  return (
    status.trim().toUpperCase() === STATUS_PENDENTE_API
      ? STATUS_PENDENTE_APP
      : status
  ) as S;
}

export function normalizarNotificacoes<T extends { status: string }>(
  lista: T[],
): T[] {
  return lista.map((notificacao) => ({
    ...notificacao,
    status: normalizarStatus(notificacao.status),
  }));
}
