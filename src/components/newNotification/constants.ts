import { Categoria } from "@/services/NotificationService";

// ─── Tipos de evento por categoria ───────────────────────────────────────────

export const TIPOS_POR_CATEGORIA: Record<Categoria, string[]> = {
  DOENÇA: [
    "Surto de doenças respiratórias",
    "Muitos casos de gripe/pneumonia",
    "Síndrome respiratória grave",
    "Surto de DTHA",
    "Água suspeita/contaminada",
    "Intoxicação alimentar coletiva",
    "Varicela",
    "Suspeita de sarampo/rubéola",
    "Evento adverso pós-vacinação",
    "Óbitos suspeitos por arbovirose",
    "Aumento incomum de dengue/chikungunya/zika",
    "Muitos mosquitos/vetores",
    "Febre amarela",
    "Raiva humana",
    "Chagas aguda",
    "Leptospirose suspeita",
    "Muitas pessoas doentes ao mesmo tempo",
    "Óbitos inesperados",
    "Muitas pessoas adoecendo sem causa clara",
    "Doença desconhecida",
    "Outro",
  ],
  EPIZOOTIA: [
    "Mortes de animais",
    "Muitos animais mortos no mesmo local",
    "Mortes súbitas sem causa aparente",
    "Suspeita de raiva animal",
    "Animal agressivo/com comportamento estranho",
    "Animais com sintomas neurológicos",
    "Primatas mortos/doentes",
    "Aves mortas",
    "Doença em rebanhos",
    "Muitos animais adoecendo",
    "Grande quantidade de morcegos",
    "Infestação incomum de insetos/vetores",
    "Outro",
  ],
  DESASTRE: [
    "Alagamento de casas",
    "Enchente/inundação",
    "Falta de água",
    "Deslizamento de terra",
    "Desabamento",
    "Risco estrutural",
    "Incêndio em mata",
    "Fumaça intensa",
    "Onda de calor",
    "Pessoas desalojadas",
    "Pessoas desabrigadas",
    "Falta de alimentos",
    "Falta de assistência em saúde",
    "Tempestade severa",
    "Ventos fortes",
    "Queda de energia prolongada",
    "Outro",
  ],
};

export const LOCAIS_OCORRENCIA = [
  "Casa",
  "Trabalho",
  "Escola",
  "Via Pública",
  "Indústria",
  "Hospital",
  "Unidades de Atenção Primária à Saúde",
  "Igreja",
  "Evento/festa",
  "Restaurante/lanchonete",
  "Abrigo",
  "Sítio",
  "Fazenda",
  "Outros",
];

export const MEIOS_IDENTIFICACAO = [
  "Observação em visita domiciliar",
  "Informação da comunidade",
  "Busca ativa",
  "Escola/creche",
  "Unidade de saúde",
  "Liderança comunitária",
  "Rede social/mensagem",
  "Outro",
];

export const CONTINUIDADE_OPTIONS = ["Sim", "Não", "Não sei"];

// ─── Dados do wizard ─────────────────────────────────────────────────────────

export interface WizardData {
  // Passo 1
  categoria: Categoria | null;
  // Passo 2
  tipo_evento: string;
  data_aproximada: string;
  pessoas_animais: string;
  local_ocorrencia: string;
  meio_identificacao: string;
  continuidade_situacao: string;
  // Passo 3
  descricao: string;
  transcricao: string;
  // Passo 4
  medias: MediaAnexo[];
  // Meta
  nome: string;          // gerado automaticamente
  rascunho: boolean;
}

export interface MediaAnexo {
  uri: string;
  name: string;
  type: string;
  thumb?: string;
}

export const WIZARD_INITIAL: WizardData = {
  categoria: null,
  tipo_evento: "",
  data_aproximada: "",
  pessoas_animais: "",
  local_ocorrencia: "",
  meio_identificacao: "",
  continuidade_situacao: "Não sei",
  descricao: "",
  transcricao: "",
  medias: [],
  nome: "",
  rascunho: false,
};