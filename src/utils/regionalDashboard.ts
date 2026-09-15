import type { Notificacao } from "@/services/NotificationService";

export interface MunicipioResumo {
  municipio: string;
  quantidade: number;
}

export interface CategoriaResumo {
  categoria: string;
  quantidade: number;
}

export interface StatusResumo {
  status: string;
  quantidade: number;
}

export interface RegionalDashboardData {
  total: number;
  emInvestigacao: number;
  confirmadas: number;
  municipiosAtivos: number;
  porMunicipio: MunicipioResumo[];
  municipiosEmInvestigacao: string[];
  porCategoria: CategoriaResumo[];
  porStatus: StatusResumo[];
}

const normalizar = (valor?: string) =>
  valor
    ?.trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") ?? "";

export function gerarDashboardRegional(
  notificacoes: Notificacao[],
): RegionalDashboardData {
  const porMunicipio: Record<string, number> = {};
  const porCategoria: Record<string, number> = {};
  const porStatus: Record<string, number> = {};

  notificacoes.forEach((notificacao) => {
    // Município
    const municipio = notificacao.municipio?.trim() || "Não informado";

    porMunicipio[municipio] = (porMunicipio[municipio] ?? 0) + 1;

    // Categoria
    const categoria = notificacao.categoria?.trim() || "Não informado";

    porCategoria[categoria] = (porCategoria[categoria] ?? 0) + 1;

    // Status
    const status = notificacao.status?.trim() || "Não informado";

    porStatus[status] = (porStatus[status] ?? 0) + 1;
  });

  const emInvestigacao = notificacoes.filter(
    (notificacao) => normalizar(notificacao.status) === "EM INVESTIGACAO",
  ).length;

  const confirmadas = notificacoes.filter(
    (notificacao) => normalizar(notificacao.status) === "CONFIRMADO",
  ).length;
  const municipiosEmInvestigacao = Array.from(
    new Set(
      notificacoes
        .filter(
          (notificacao) => normalizar(notificacao.status) === "EM INVESTIGACAO",
        )
        .map((notificacao) => notificacao.municipio?.trim() || "Não informado"),
    ),
  );

  return {
    total: notificacoes.length,

    emInvestigacao,

    confirmadas,

    municipiosAtivos: Object.keys(porMunicipio).length,
    municipiosEmInvestigacao,
    porMunicipio: Object.entries(porMunicipio)
      .map(([municipio, quantidade]) => ({
        municipio,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade),

    porCategoria: Object.entries(porCategoria)
      .map(([categoria, quantidade]) => ({
        categoria,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade),

    porStatus: Object.entries(porStatus)
      .map(([status, quantidade]) => ({
        status,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade),
  };
}
