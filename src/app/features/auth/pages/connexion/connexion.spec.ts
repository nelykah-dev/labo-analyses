import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { SUPABASE_CLIENT } from '../../../../core/supabase/supabase.client';
import { creerFauxSupabase, FauxSupabase } from '../../../../testing/faux-supabase';
import { ConnexionPage } from './connexion';

@Component({ selector: 'app-stub-connexion', template: '' })
class StubConnexion {}

function configurer(faux: FauxSupabase): FauxSupabase {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'connexion', component: StubConnexion },
        { path: 'tableau-de-bord', component: StubConnexion },
      ]),
      { provide: SUPABASE_CLIENT, useValue: faux.client },
    ],
  });
  return faux;
}

async function soumettre(
  fixture: ComponentFixture<ConnexionPage>,
  email: string,
  motDePasse: string,
): Promise<void> {
  const page = fixture.componentInstance;
  page.email.set(email);
  page.motDePasse.set(motDePasse);
  fixture.detectChanges();
  await page.soumettre();
  fixture.detectChanges();
}

describe('Connexion', () => {
  it('Connexion réussie — le rôle est chargé et l’utilisateur est redirigé vers son tableau de bord', async () => {
    // GIVEN un compte MEDECIN existant et un visiteur sur la page de connexion
    configurer(
      creerFauxSupabase({
        utilisateurs: [{ id: 'u1', email: 'med@labo.fr', motDePasse: 'MotDePasse1' }],
        profils: [{ id: 'u1', role: 'MEDECIN' }],
      }),
    );
    const fixture = TestBed.createComponent(ConnexionPage);
    fixture.detectChanges();

    // WHEN il saisit des identifiants valides et valide
    await soumettre(fixture, 'med@labo.fr', 'MotDePasse1');

    // THEN sa session est ouverte, son rôle est connu et il est redirigé vers le tableau de bord
    const auth = TestBed.inject(AuthService);
    expect(auth.utilisateur()?.role).toBe('MEDECIN');
    expect(TestBed.inject(Router).url).toBe('/tableau-de-bord');
  });

  it('Identifiants invalides — message d’erreur générique et aucune redirection', async () => {
    // GIVEN un compte existant et un mot de passe erroné
    configurer(
      creerFauxSupabase({
        utilisateurs: [{ id: 'u1', email: 'med@labo.fr', motDePasse: 'MotDePasse1' }],
        profils: [{ id: 'u1', role: 'MEDECIN' }],
      }),
    );
    const fixture = TestBed.createComponent(ConnexionPage);
    fixture.detectChanges();

    // WHEN il valide avec un mauvais mot de passe
    await soumettre(fixture, 'med@labo.fr', 'MauvaisMotDePasse');

    // THEN un message générique s'affiche et il reste sur la page
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('E-mail ou mot de passe invalide');
    expect(TestBed.inject(AuthService).utilisateur()).toBeNull();
    expect(TestBed.inject(Router).url).not.toBe('/tableau-de-bord');
  });
});
