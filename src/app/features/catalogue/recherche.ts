import { AnalyseCatalogue } from '../../core/modeles/analyse-catalogue';

export interface CritereRechercheAnalyse {
  texte: string;
  unite?: string | null;
  prixMin?: number | null;
  prixMax?: number | null;
}

/** Filtrage côté client : nom d'analyse + unité + fourchette de prix. */
export function filtrerAnalyses(
  analyses: AnalyseCatalogue[],
  critere: CritereRechercheAnalyse,
): AnalyseCatalogue[] {
  const texte = critere.texte.trim().toLowerCase();
  return analyses.filter((analyse) => {
    const correspondTexte = texte === '' || analyse.nom.toLowerCase().includes(texte);
    const correspondUnite = !critere.unite || analyse.unite === critere.unite;
    const correspondPrix =
      (critere.prixMin == null || analyse.prix >= critere.prixMin) &&
      (critere.prixMax == null || analyse.prix <= critere.prixMax);
    return correspondTexte && correspondUnite && correspondPrix;
  });
}
