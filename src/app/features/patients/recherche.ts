import { Patient } from '../../core/modeles/patient';

export interface CritereRecherche {
  texte: string;
  ageMin?: number | null;
  ageMax?: number | null;
}

export function ageDepuisDateNaissance(dateNaissance: string, aujourdHui = new Date()): number {
  const naissance = new Date(dateNaissance);
  let age = aujourdHui.getFullYear() - naissance.getFullYear();
  const mois = aujourdHui.getMonth() - naissance.getMonth();
  if (mois < 0 || (mois === 0 && aujourdHui.getDate() < naissance.getDate())) {
    age--;
  }
  return age;
}

/** Filtrage côté client : nom, prénom, n° de dossier + tranche d'âge. */
export function filtrerPatients(patients: Patient[], critere: CritereRecherche): Patient[] {
  const texte = critere.texte.trim().toLowerCase();
  return patients.filter((patient) => {
    const correspondTexte =
      texte === '' ||
      patient.nom.toLowerCase().includes(texte) ||
      patient.prenom.toLowerCase().includes(texte) ||
      patient.numeroDossier.toLowerCase().includes(texte);

    const age = ageDepuisDateNaissance(patient.dateNaissance);
    const correspondAge =
      (critere.ageMin == null || age >= critere.ageMin) &&
      (critere.ageMax == null || age <= critere.ageMax);

    return correspondTexte && correspondAge;
  });
}
