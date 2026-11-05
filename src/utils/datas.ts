/**
 * Formata a data da ocorrência (escolhida só como dia no formulário).
 * Usa a parte YYYY-MM-DD do texto para não sofrer conversão de fuso.
 */
export function formatarDataOcorrencia(
  data: string | undefined | null,
  { comAno = false }: { comAno?: boolean } = {},
): string {
  const dia = String(data ?? "").slice(0, 10);
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);

  if (!partes) return "Data não informada";

  const [, ano, mes, d] = partes;

  return comAno ? `${d}/${mes}/${ano}` : `${d}/${mes}`;
}
