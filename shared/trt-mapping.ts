// Mapeamento de códigos TRT para Estados brasileiros
// Baseado no formato do número do processo: NNNNNNN-DD.AAAA.J.TT.OOOO
// Onde TT são os 2 dígitos do TRT (posição -7 e -6 do número limpo)

export interface TRTInfo {
  codigo: string;
  nome: string;
  estado: string;
  uf: string;
  regiao: string;
}

export const TRT_MAPPING: Record<string, TRTInfo> = {
  "01": { codigo: "01", nome: "TRT 1", estado: "Rio de Janeiro", uf: "RJ", regiao: "Sudeste" },
  "02": { codigo: "02", nome: "TRT 2", estado: "São Paulo", uf: "SP", regiao: "Sudeste" },
  "03": { codigo: "03", nome: "TRT 3", estado: "Minas Gerais", uf: "MG", regiao: "Sudeste" },
  "04": { codigo: "04", nome: "TRT 4", estado: "Rio Grande do Sul", uf: "RS", regiao: "Sul" },
  "05": { codigo: "05", nome: "TRT 5", estado: "Bahia", uf: "BA", regiao: "Nordeste" },
  "06": { codigo: "06", nome: "TRT 6", estado: "Pernambuco", uf: "PE", regiao: "Nordeste" },
  "07": { codigo: "07", nome: "TRT 7", estado: "Ceará", uf: "CE", regiao: "Nordeste" },
  "08": { codigo: "08", nome: "TRT 8", estado: "Pará", uf: "PA", regiao: "Norte" },
  "09": { codigo: "09", nome: "TRT 9", estado: "Paraná", uf: "PR", regiao: "Sul" },
  "10": { codigo: "10", nome: "TRT 10", estado: "Distrito Federal", uf: "DF", regiao: "Centro-Oeste" },
  "11": { codigo: "11", nome: "TRT 11", estado: "Amazonas", uf: "AM", regiao: "Norte" },
  "12": { codigo: "12", nome: "TRT 12", estado: "Santa Catarina", uf: "SC", regiao: "Sul" },
  "13": { codigo: "13", nome: "TRT 13", estado: "Paraíba", uf: "PB", regiao: "Nordeste" },
  "14": { codigo: "14", nome: "TRT 14", estado: "Rondônia", uf: "RO", regiao: "Norte" },
  "15": { codigo: "15", nome: "TRT 15", estado: "São Paulo Interior", uf: "SP", regiao: "Sudeste" },
  "16": { codigo: "16", nome: "TRT 16", estado: "Maranhão", uf: "MA", regiao: "Nordeste" },
  "17": { codigo: "17", nome: "TRT 17", estado: "Espírito Santo", uf: "ES", regiao: "Sudeste" },
  "18": { codigo: "18", nome: "TRT 18", estado: "Goiás", uf: "GO", regiao: "Centro-Oeste" },
  "19": { codigo: "19", nome: "TRT 19", estado: "Alagoas", uf: "AL", regiao: "Nordeste" },
  "20": { codigo: "20", nome: "TRT 20", estado: "Sergipe", uf: "SE", regiao: "Nordeste" },
  "21": { codigo: "21", nome: "TRT 21", estado: "Rio Grande do Norte", uf: "RN", regiao: "Nordeste" },
  "22": { codigo: "22", nome: "TRT 22", estado: "Piauí", uf: "PI", regiao: "Nordeste" },
  "23": { codigo: "23", nome: "TRT 23", estado: "Mato Grosso", uf: "MT", regiao: "Centro-Oeste" },
  "24": { codigo: "24", nome: "TRT 24", estado: "Mato Grosso do Sul", uf: "MS", regiao: "Centro-Oeste" },
};

// Extrai o código do TRT do número do processo
// Formato: NNNNNNN-DD.AAAA.J.TT.OOOO
// Exemplo: 0001380-35.2023.5.09.0662 → TRT 09
export function extractTRTCode(numeroProcesso: string): string | null {
  if (!numeroProcesso) return null;
  
  // Fallback: tenta extrair do padrão com pontos primeiro (mais confiável)
  // Formato: NNNNNNN-DD.AAAA.J.TT.OOOO onde TT é o código do TRT
  const match = numeroProcesso.match(/\d{7}-\d{2}\.\d{4}\.\d\.(\d{2})\.\d{4}/);
  if (match) {
    return match[1];
  }
  
  // Remove todos os caracteres não numéricos
  const cleanNumber = numeroProcesso.replace(/\D/g, '');
  
  // O número limpo tem 20 dígitos: NNNNNNNDDAAAAJTTOOOO
  // Índices: 0-6 (número), 7-8 (DV), 9-12 (ano), 13 (justiça=5), 14-15 (TRT), 16-19 (origem)
  if (cleanNumber.length >= 16) {
    const trtCode = cleanNumber.substring(14, 16);
    return trtCode;
  }
  
  return null;
}

// Retorna as informações do TRT baseado no número do processo
export function getTRTInfo(numeroProcesso: string): TRTInfo | null {
  const code = extractTRTCode(numeroProcesso);
  if (!code) return null;
  return TRT_MAPPING[code] || null;
}

// Retorna o estado baseado no número do processo
export function getEstadoFromProcesso(numeroProcesso: string): string | null {
  const info = getTRTInfo(numeroProcesso);
  return info?.estado || null;
}

// Retorna a UF baseado no número do processo
export function getUFFromProcesso(numeroProcesso: string): string | null {
  const info = getTRTInfo(numeroProcesso);
  return info?.uf || null;
}

// Agrupa estados por região
export function getEstadosPorRegiao(): Record<string, TRTInfo[]> {
  const byRegion: Record<string, TRTInfo[]> = {};
  Object.values(TRT_MAPPING).forEach(info => {
    if (!byRegion[info.regiao]) {
      byRegion[info.regiao] = [];
    }
    byRegion[info.regiao].push(info);
  });
  return byRegion;
}
