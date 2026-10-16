import { inject, Injectable } from '@angular/core';
import { SUPABASE_CLIENT } from '../../core/supabase/supabase.client';
import { DonneesPatient, patientDepuisLigne, Patient } from '../../core/modeles/patient';

export interface ResultatCrud {
  succes: boolean;
  erreur?: string;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly client = inject(SUPABASE_CLIENT);

  async lister(): Promise<Patient[]> {
    const { data, error } = await this.client
      .from('patients')
      .select('*')
      .order('nom', { ascending: true });
    if (error) {
      return [];
    }
    return (data ?? []).map((ligne) => patientDepuisLigne(ligne as Record<string, unknown>));
  }

  async obtenir(id: string): Promise<Patient | null> {
    const { data, error } = await this.client.from('patients').select('*').eq('id', id).single();
    if (error) {
      return null;
    }
    return patientDepuisLigne(data as Record<string, unknown>);
  }

  async creer(donnees: DonneesPatient): Promise<ResultatCrud> {
    const { error } = await this.client.from('patients').insert({
      nom: donnees.nom,
      prenom: donnees.prenom,
      date_naissance: donnees.dateNaissance,
      numero_dossier: donnees.numeroDossier,
    });
    return error ? { succes: false, erreur: error.message } : { succes: true };
  }

  async modifier(id: string, donnees: DonneesPatient): Promise<ResultatCrud> {
    const { error } = await this.client
      .from('patients')
      .update({
        nom: donnees.nom,
        prenom: donnees.prenom,
        date_naissance: donnees.dateNaissance,
        numero_dossier: donnees.numeroDossier,
      })
      .eq('id', id);
    return error ? { succes: false, erreur: error.message } : { succes: true };
  }

  async supprimer(id: string): Promise<ResultatCrud> {
    const { error } = await this.client.from('patients').delete().eq('id', id);
    return error ? { succes: false, erreur: error.message } : { succes: true };
  }
}
