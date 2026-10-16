import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SUPABASE_CLIENT } from '../../../../core/supabase/supabase.client';
import { creerFauxSupabase, FauxSupabase } from '../../../../testing/faux-supabase';
import { InscriptionPage } from './inscription';

@Component({ selector: 'app-stub-auth', template: '' })
class StubAuth {}

function configurer(faux: FauxSupabase = creerFauxSupabase()): FauxSupabase {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'connexion', component: StubAuth },
        { path: 'inscription', component: StubAuth },
      ]),
      { provide: SUPABASE_CLIENT, useValue: faux.client },
    ],
  });
  return faux;
}

function creerPage(): ComponentFixture<InscriptionPage> {
  const fixture = TestBed.createComponent(InscriptionPage);
  fixture.detectChanges();
  return fixture;
}

async function soumettre(
  fixture: ComponentFixture<InscriptionPage>,
  email: string,
  motDePasse: string,
  confirmation: string = motDePasse,
): Promise<void> {
  const page = fixture.componentInstance;
  page.email.set(email);
  page.motDePasse.set(motDePasse);
  page.confirmation.set(confirmation);
  fixture.detectChanges();
  await page.soumettre();
  fixture.detectChanges();
}

describe('Inscription', () => {
  it('Inscription réussie — le compte est créé et l’utilisateur est envoyé vers la connexion', async () => {
    // GIVEN un visiteur non connecté sur le formulaire d'inscription
    const faux = configurer();
    const fixture = creerPage();

    // WHEN il soumet un e-mail et un mot de passe valides
    await soumettre(fixture, 'nouveau@labo.fr', 'MotDePasse1');

    // THEN le compte est créé côté Supabase et il est redirigé vers /connexion
    expect(faux.appels['signUp']).toEqual([{ email: 'nouveau@labo.fr', password: 'MotDePasse1' }]);
    expect(TestBed.inject(Router).url).toBe('/connexion');
  });

  it('Adresse e-mail déjà utilisée — un message explicite est affiché et aucune redirection', async () => {
    // GIVEN une adresse déjà enregistrée
    const faux = configurer(
      creerFauxSupabase({
        utilisateurs: [{ id: 'u1', email: 'existe@labo.fr', motDePasse: 'MotDePasse1' }],
      }),
    );
    const fixture = creerPage();

    // WHEN le visiteur tente de créer un compte avec cette adresse
    await soumettre(fixture, 'existe@labo.fr', 'MotDePasse1');

    // THEN un message « déjà utilisée » s'affiche et la navigation n'a pas lieu
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('déjà utilisée');
    expect(TestBed.inject(Router).url).not.toBe('/connexion');
    expect(faux.utilisateurs.length).toBe(1);
  });

  it('Mot de passe trop faible — le compte n’est pas créé', async () => {
    // GIVEN un mot de passe de moins de 8 caractères
    const faux = configurer();
    const fixture = creerPage();

    // WHEN il soumet le formulaire
    await soumettre(fixture, 'faible@labo.fr', 'court');

    // THEN un message d'erreur s'affiche et Supabase n'est jamais appelé
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('au moins 8 caractères');
    expect(faux.appels['signUp']).toEqual([]);
  });
});
