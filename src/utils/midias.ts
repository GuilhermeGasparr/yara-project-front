import type { MidiaNotificacao } from "@/types";

export type TipoMidia = "imagem" | "video" | "documento";

const MB = 1024 * 1024;

// Mesmas regras de backend/midias.py. O backend continua sendo quem decide;
// aqui o objetivo é avisar o usuário antes de enviar.
export const REGRAS_ANEXO: Record<
  TipoMidia,
  { rotulo: string; extensoes: string[]; limite: number }
> = {
  imagem: {
    rotulo: "Fotos",
    extensoes: [".jpg", ".jpeg", ".png", ".webp", ".heic"],
    limite: 10 * MB,
  },
  video: {
    rotulo: "Vídeos",
    extensoes: [".mp4", ".mov", ".webm", ".3gp"],
    limite: 100 * MB,
  },
  documento: {
    rotulo: "Documentos",
    extensoes: [".pdf", ".doc", ".docx"],
    limite: 10 * MB,
  },
};

export const MIME_DOCUMENTOS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function extensaoDe(caminho: string): string {
  const semQuery = caminho.split(/[?#]/)[0];
  const nome = semQuery.slice(semQuery.lastIndexOf("/") + 1);
  const ponto = nome.lastIndexOf(".");
  return ponto >= 0 ? nome.slice(ponto).toLowerCase() : "";
}

export function formatarTamanho(bytes: number): string {
  if (bytes < MB) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / MB).toFixed(1).replace(".", ",")} MB`;
}

/** Devolve a mensagem de erro do anexo, ou null se ele for aceito. */
export function validarAnexo(
  nome: string,
  tamanho: number | null | undefined,
  categoria: TipoMidia,
): string | null {
  const regra = REGRAS_ANEXO[categoria];

  if (!regra.extensoes.includes(extensaoDe(nome))) {
    const aceitas = regra.extensoes.map((e) => e.slice(1).toUpperCase());
    return `"${nome}" não é um formato aceito. ${regra.rotulo}: ${aceitas.join(", ")}.`;
  }

  if (tamanho != null && tamanho > regra.limite) {
    return `"${nome}" passa do limite. ${regra.rotulo} podem ter até ${regra.limite / MB} MB.`;
  }

  return null;
}

export function tipoDaMidia(midia: MidiaNotificacao): TipoMidia {
  // Vem antes do resource_type: PDFs antigos foram salvos como "image"
  if (REGRAS_ANEXO.documento.extensoes.includes(extensaoDe(midia.url))) {
    return "documento";
  }
  if (midia.resource_type === "video" || midia.url.includes("/video/upload/")) {
    return "video";
  }
  if (midia.resource_type === "raw" || midia.url.includes("/raw/upload/")) {
    return "documento";
  }
  return "imagem";
}

export function nomeDaMidia(midia: MidiaNotificacao, indice: number): string {
  if (midia.nome_arquivo) return midia.nome_arquivo;

  const rotulos: Record<TipoMidia, string> = {
    imagem: "Imagem",
    video: "Vídeo",
    documento: "Documento",
  };
  return `${rotulos[tipoDaMidia(midia)]} ${indice + 1}`;
}

function comTransformacao(url: string, transformacao: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }
  return url.replace("/image/upload/", `/image/upload/${transformacao}/`);
}

export function urlMiniatura(url: string): string {
  return comTransformacao(url, "c_fill,w_160,h_160,f_auto,q_auto");
}

export function urlImagemCompleta(url: string): string {
  return comTransformacao(url, "f_auto,q_auto");
}
