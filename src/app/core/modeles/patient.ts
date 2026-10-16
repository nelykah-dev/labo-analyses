export interface Patient {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO yyyy-mm-dd
  numeroDossier: string;
}

export interface DonneesPatient {
  nom: string;
  prenom: string;
  dateNaissance: string;
  numeroDossier: string;
}

export function patientDepuisLigne(ligne: Record<string, unknown>): Patient {
  return {
    id: String(ligne['id']),
    nom: String(ligne['nom']),
    prenom: String(ligne['prenom']),
    dateNaissance: String(ligne['date_naissance']),
    numeroDossier: String(ligne['numero_dossier']),
  };
}
