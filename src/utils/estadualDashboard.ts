import type { Notificacao } from "@/services/NotificationService";

function normalizar(valor?: string) {
  return (
    valor
      ?.trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") ?? ""
  );
}

export interface EstadualDashboardData {
  total: number;

  emInvestigacao: number;

  veridicos: number;

  naoVeridicos: number;

  encerrados: number;

  pendentes: number;

  municipiosAtivos: number;

  doencas: number;

  epizootias: number;

  desastres: number;

  municipiosEmInvestigacao: number;
}

export function gerarDashboardEstadual(
  notificacoes: Notificacao[],
): EstadualDashboardData {
  const municipios = new Set<string>();

  let emInvestigacao = 0;
  let veridicos = 0;
  let naoVeridicos = 0;
  let encerrados = 0;
  let pendentes = 0;

  let doencas = 0;
  let epizootias = 0;
  let desastres = 0;

  const municipiosInvestigacao =
    new Set<string>();

  notificacoes.forEach((notificacao) => {
    const status = normalizar(
      notificacao.status,
    );

    const categoria = normalizar(
      notificacao.categoria,
    );

    const municipio =
      notificacao.municipio?.trim();

    if (municipio) {
      municipios.add(municipio);
    }

    switch (status) {
      case "EM ANDAMENTO":
        pendentes++;
        break;

      case "EM INVESTIGACAO":
        emInvestigacao++;

        if (municipio) {
          municipiosInvestigacao.add(
            municipio,
          );
        }

        break;

      case "VERIDICO":
        veridicos++;
        break;

      case "NAO VERIDICO":
        naoVeridicos++;
        break;

      case "ENCERRADO":
        encerrados++;
        break;
    }

    switch (categoria) {
      case "DOENCA":
        doencas++;
        break;

      case "EPIZOOTIA":
        epizootias++;
        break;

      case "DESASTRE":
        desastres++;
        break;
    }
  });

  return {
    total: notificacoes.length,

    emInvestigacao,

    veridicos,

    naoVeridicos,

    encerrados,

    pendentes,

    municipiosAtivos:
      municipios.size,

    doencas,

    epizootias,

    desastres,

    municipiosEmInvestigacao:
      municipiosInvestigacao.size,
  };
}