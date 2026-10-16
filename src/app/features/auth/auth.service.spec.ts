import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { SUPABASE_CLIENT } from '../../core/supabase/supabase.client';
import { creerFauxSupabase, FauxSupabase } from '../../testing/faux-supabase';

@Component({ selector: 'app-stub-auth-service', template: '' })
class StubAuthService {}

function configurer(faux: FauxSupabase): void {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'connexion', component: StubAuthService }]),
      { provide: SUPABASE_CLIENT, useValue: faux.client },
    ],
  });
}

describe('AuthService', () => {
  it('Déconnexion réussie — la session est invalidée et l’utilisateur revient à la connexion', async () => {
    // GIVEN une session ouverte pour un MEDECIN
    const faux = creerFauxSupabase({
      utilisateurs: [{ id: 'u1', email: 'med@labo.fr', motDePasse: 'MotDePasse1' }],
      profils: [{ id: 'u1', role: 'MEDECIN' }],
    });
    configurer(faux);
    const auth = TestBed.inject(AuthService);
    await auth.connecter('med@labo.fr', 'MotDePasse1');
    expect(auth.utilisateur()?.role).toBe('MEDECIN');

    // WHEN il se déconnecte
    await auth.deconnecter();

    // THEN la session Supabase est fermée, l'état est vidé et il est redirigé vers /connexion
    expect(faux.appels['signOut'].length).toBe(1);
    expect(faux.sessionCourante()).toBeNull();
    expect(auth.utilisateur()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/connexion');
  });

  it('Aucun mot de passe en clair persisté — le mot de passe ne quitte jamais l’appel Supabase Auth', async () => {
    // GIVEN un visiteur qui crée un compte
    const faux = creerFauxSupabase();
    configurer(faux);
    const auth = TestBed.inject(AuthService);
    const motDePasse = 'MotDePasseSecret1';

    // WHEN il s'inscrit
    await auth.inscrire('nouveau@labo.fr', motDePasse);

    // THEN le mot de passe est uniquement transmis à Supabase Auth, jamais stocké en clair
    expect(faux.appels['signUp']).toEqual([{ email: 'nouveau@labo.fr', password: motDePasse }]);
    expect(JSON.stringify(localStorage)).not.toContain(motDePasse);
    expect(JSON.stringify(sessionStorage)).not.toContain(motDePasse);
    expect(JSON.stringify([...faux.tables.values()])).not.toContain(motDePasse);
  });
});
