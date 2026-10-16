export interface AnalyseCatalogue {
  id: string;
  nom: string;
  unite: string;
  typeEchantillon: string;
  refMin: number;
  refMax: number;
  prix: number;
}

export interface DonneesAnalyse {
  nom: string;
  unite: string;
  typeEchantillon: string;
  refMin: number;
  refMax: number;
  prix: number;
}

export function analyseDepuisLigne(ligne: Record<string, unknown>): AnalyseCatalogue {
  return {
    id: String(ligne['id']),
    nom: String(ligne['nom']),
    unite: String(ligne['unite']),
    typeEchantillon: String(ligne['type_echantillon']),
    refMin: Number(ligne['ref_min']),
    refMax: Number(ligne['ref_max']),
    prix: Number(ligne['prix']),
  };
}
