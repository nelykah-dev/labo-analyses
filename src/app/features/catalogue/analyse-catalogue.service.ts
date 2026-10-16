import { inject, Injectable } from '@angular/core';
import { SUPABASE_CLIENT } from '../../core/supabase/supabase.client';
import {
  analyseDepuisLigne,
  AnalyseCatalogue,
  DonneesAnalyse,
} from '../../core/modeles/analyse-catalogue';

export interface ResultatCrud {
  succes: boolean;
  erreur?: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyseCatalogueService {
  private readonly client = inject(SUPABASE_CLIENT);

  async lister(): Promise<AnalyseCatalogue[]> {
    const { data, error } = await this.client
      .from('analyses_catalogue')
      .select('*')
      .order('nom', { ascending: true });
    if (error) {
      return [];
    }
    return (data ?? []).map((ligne) => analyseDepuisLigne(ligne as Record<string, unknown>));
  }

  async obtenir(id: string): Promise<AnalyseCatalogue | null> {
    const { data, error } = await this.client
      .from('analyses_catalogue')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      return null;
    }
    return analyseDepuisLigne(data as Record<string, unknown>);
  }

  async creer(donnees: DonneesAnalyse): Promise<ResultatCrud> {
    const { error } = await this.client.from('analyses_catalogue').insert({
      nom: donnees.nom,
      unite: donnees.unite,
      type_echantillon: donnees.typeEchantillon,
      ref_min: donnees.refMin,
      ref_max: donnees.refMax,
      prix: donnees.prix,
    });
    return error ? { succes: false, erreur: error.message } : { succes: true };
  }

  async modifier(id: string, donnees: DonneesAnalyse): Promise<ResultatCrud> {
    const { error } = await this.client
      .from('analyses_catalogue')
      .update({
        nom: donnees.nom,
        unite: donnees.unite,
        type_echantillon: donnees.typeEchantillon,
        ref_min: donnees.refMin,
        ref_max: donnees.refMax,
        prix: donnees.prix,
      })
      .eq('id', id);
    return error ? { succes: false, erreur: error.message } : { succes: true };
  }

  async supprimer(id: string): Promise<ResultatCrud> {
    const { error } = await this.client.from('analyses_catalogue').delete().eq('id', id);
    return error ? { succes: false, erreur: error.message } : { succes: true };
  }
}
