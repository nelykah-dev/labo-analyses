import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { estRole, Role } from './role';

export interface Utilisateur {
  id: string;
  email: string;
  role: Role;
}

export interface ResultatAuth {
  succes: boolean;
  erreur?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly router = inject(Router);

  readonly utilisateur = signal<Utilisateur | null>(null);
  readonly connecte = computed(() => this.utilisateur() !== null);

  /** Restaure la session Supabase au démarrage de l'application. */
  async initialiser(): Promise<void> {
    const { data } = await this.client.auth.getSession();
    const session = data?.session;
    if (session?.user) {
      await this.chargerUtilisateur(session.user.id, session.user.email ?? '');
    }
  }

  /** Longueur minimale imposée par la spec (« mot de passe trop faible »). */
  private static motDePasseValide(motDePasse: string): boolean {
    return motDePasse.length >= 8;
  }

  async inscrire(email: string, motDePasse: string): Promise<ResultatAuth> {
    if (!AuthService.motDePasseValide(motDePasse)) {
      return { succes: false, erreur: 'Le mot de passe doit contenir au moins 8 caractères.' };
    }
    const { data, error } = await this.client.auth.signUp({ email, password: motDePasse });
    if (error) {
      const code = (error as { code?: string }).code;
      const dejaUtilise =
        code === 'user_already_exists' || error.message.toLowerCase().includes('already');
      return {
        succes: false,
        erreur: dejaUtilise ? 'Cette adresse e-mail est déjà utilisée.' : error.message,
      };
    }
    // Supabase renvoie un user sans identities quand l'adresse existe déjà.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { succes: false, erreur: 'Cette adresse e-mail est déjà utilisée.' };
    }
    return { succes: true };
  }

  async connecter(email: string, motDePasse: string): Promise<ResultatAuth> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password: motDePasse });
    if (error || !data.session) {
      return { succes: false, erreur: 'E-mail ou mot de passe invalide' };
    }
    await this.chargerUtilisateur(data.session.user.id, data.session.user.email ?? email);
    return { succes: true };
  }

  async deconnecter(): Promise<void> {
    await this.client.auth.signOut();
    this.utilisateur.set(null);
    await this.router.navigate(['/connexion']);
  }

  private async chargerUtilisateur(id: string, email: string): Promise<void> {
    const { data } = await this.client.from('profiles').select('role').eq('id', id).single();
    const role: Role = estRole(data?.['role']) ? (data['role'] as Role) : 'PATIENT';
    this.utilisateur.set({ id, email, role });
  }
}
