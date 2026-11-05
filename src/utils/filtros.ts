/**
 * Utilidades de filtro compartilhadas pelas telas de notificações e mapas.
 * O período usa a data da ocorrência, igual ao backend (backend/filtros.py).
 */

export function normalizar(valor?: string | null): string {
  return (valor ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// ─── Categoria e status ───────────────────────────────────────────────────────

export interface OpcaoFiltro {
  value: string;
  label: string;
}

export const CATEGORIAS_FILTRO: OpcaoFiltro[] = [
  { value: "TODOS", label: "Todos" },
  { value: "DOENÇA", label: "Doença" },
  { value: "EPIZOOTIA", label: "Epizootia" },
  { value: "DESASTRE", label: "Desastre" },
];

export const STATUS_FILTRO: OpcaoFiltro[] = [
  { value: "TODOS", label: "Todos" },
  { value: "PENDENTE", label: "Pendentes" },
  { value: "EM INVESTIGAÇÃO", label: "Em investigação" },
  { value: "VERÍDICO", label: "Verídico" },
  { value: "NÃO VERÍDICO", label: "Não verídico" },
  { value: "ENCERRADO", label: "Encerrado" },
];

export function correspondeCategoria(
  categoria: string | undefined | null,
  filtro: string,
): boolean {
  return filtro === "TODOS" || normalizar(categoria) === normalizar(filtro);
}

/** O app usa "EM ANDAMENTO" para o que o backend grava como "PENDENTE". */
function statusCanonico(status?: string | null): string {
  const valor = normalizar(status);

  switch (valor) {
    case "PENDENTE":
    case "EM ANDAMENTO":
      return "PENDENTE";

    case "VERIDICO":
    case "CONFIRMADO":
      return "VERIDICO";

    case "NAO VERIDICO":
    case "DESCARTADO":
      return "NAO VERIDICO";

    default:
      return valor;
  }
}

export function correspondeStatus(
  status: string | undefined | null,
  filtro: string,
): boolean {
  return filtro === "TODOS" || statusCanonico(status) === statusCanonico(filtro);
}

// ─── Período ──────────────────────────────────────────────────────────────────

/** `inicio` e `fim` no formato YYYY-MM-DD; vazio significa "sem limite". */
export function periodoInvalido(inicio: string, fim: string): boolean {
  return Boolean(inicio && fim && inicio > fim);
}

/**
 * Verifica se a data está dentro do período, com os dois limites inclusivos
 * (o dia final entra inteiro, como no backend).
 */
export function dentroDoPeriodo(
  data: string | undefined | null,
  inicio: string,
  fim: string,
): boolean {
  if (!inicio && !fim) return true;
  if (!data) return false;

  // "2026-10-25T14:30:00" -> "2026-10-25"
  const dia = String(data).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false;
  if (inicio && dia < inicio) return false;
  if (fim && dia > fim) return false;

  return true;
}

// ─── Exportação .xlsx ─────────────────────────────────────────────────────────

export interface FiltrosRelatorio {
  data_inicio?: string;
  data_fim?: string;
  agente_id?: number | null;
  categoria?: string;
  status?: string;
  coads?: string;
  superintendencia?: string;
}

/** Converte a opção "todos" de um filtro em `undefined` (= não filtrar na exportação). */
export function valorFiltro(valor: string, todos: string): string | undefined {
  return valor === todos ? undefined : valor;
}

/** Monta a query string aceita pelos endpoints /exportar_relatorio/xlsx. */
export function montarQueryRelatorio(filtros?: FiltrosRelatorio): string {
  if (!filtros) return "";

  const params = new URLSearchParams();

  if (filtros.data_inicio) params.set("data_inicio", filtros.data_inicio);
  if (filtros.data_fim) params.set("data_fim", filtros.data_fim);
  if (filtros.agente_id != null) {
    params.set("agente_id", String(filtros.agente_id));
  }
  if (filtros.categoria) params.set("categoria", filtros.categoria);
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.coads) params.set("coads", filtros.coads);
  if (filtros.superintendencia) {
    params.set("superintendencia", filtros.superintendencia);
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}
