import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, Utilisateur } from './auth.service';
import { roleGuard } from './route-role.guard';
import { Role } from './role';

@Component({ selector: 'app-stub-patients', template: '<p class="patients">Patients</p>' })
class PatientsStub {}

@Component({ selector: 'app-stub-analyses', template: '<p class="analyses">Analyses</p>' })
class AnalysesStub {}

@Component({ selector: 'app-stub-formulaire', template: '<p class="formulaire">Formulaire</p>' })
class FormulaireStub {}

@Component({ selector: 'app-stub-refus', template: '<p class="refus">Accès refusé</p>' })
class RefusStub {}

@Component({ selector: 'app-stub-connexion', template: '<p class="connexion">Connexion</p>' })
class ConnexionStub {}

function configurer(role: Role | null): void {
  const utilisateurFaux: Utilisateur | null = role
    ? { id: 'u1', email: 'u@labo.fr', role }
    : null;

  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'connexion', component: ConnexionStub },
        { path: 'acces-refuse', component: RefusStub },
        { path: 'patients', canActivate: [roleGuard], component: PatientsStub },
        { path: 'patients/nouveau', canActivate: [roleGuard], component: FormulaireStub },
        { path: 'patients/:id/modifier', canActivate: [roleGuard], component: FormulaireStub },
        { path: 'analyses', canActivate: [roleGuard], component: AnalysesStub },
        { path: 'analyses/nouveau', canActivate: [roleGuard], component: FormulaireStub },
        { path: 'analyses/:id/modifier', canActivate: [roleGuard], component: FormulaireStub },
      ]),
      { provide: AuthService, useValue: { utilisateur: signal(utilisateurFaux) } },
    ],
  });
}

describe('roleGuard', () => {
  it('Accès autorisé pour le bon rôle — un MEDECIN atteint /patients', async () => {
    // GIVEN un MEDECIN connecté
    configurer('MEDECIN');
    const harness = await RouterTestingHarness.create();

    // WHEN il navigue vers /patients
    await harness.navigateByUrl('/patients');

    // THEN la page patients est rendue
    expect(TestBed.inject(Router).url).toBe('/patients');
    expect(harness.routeNativeElement?.querySelector('.patients')).not.toBeNull();
  });

  it('Accès refusé pour un rôle non autorisé — un PATIENT est renvoyé vers /acces-refuse', async () => {
    // GIVEN un PATIENT connecté
    configurer('PATIENT');
    const harness = await RouterTestingHarness.create();

    // WHEN il navigue vers /patients
    await harness.navigateByUrl('/patients');

    // THEN il est redirigé vers /acces-refuse et la page patients n'est pas rendue
    expect(TestBed.inject(Router).url).toBe('/acces-refuse');
    expect(harness.routeNativeElement?.querySelector('.patients')).toBeNull();
  });

  it('Visiteur non connecté — redirection vers /connexion avec returnUrl', async () => {
    // GIVEN un visiteur sans session
    configurer(null);
    const harness = await RouterTestingHarness.create();

    // WHEN il tente d'atteindre /patients
    await harness.navigateByUrl('/patients');

    // THEN il est redirigé vers /connexion avec la route demandée conservée
    const url = TestBed.inject(Router).url;
    expect(url.startsWith('/connexion')).toBe(true);
    expect(url).toContain('returnUrl');
    expect(url).toContain('%2Fpatients');
  });

  it('Accès refusé au rôle PATIENT (module patients)', async () => {
    // GIVEN un PATIENT connecté
    configurer('PATIENT');
    const harness = await RouterTestingHarness.create();

    // WHEN il navigue vers la modification d'un patient
    await harness.navigateByUrl('/patients/p1/modifier');

    // THEN l'accès est refusé
    expect(TestBed.inject(Router).url).toBe('/acces-refuse');
  });

  it('Tentative d’écriture par un TECHNICIEN — /patients/nouveau refusé', async () => {
    // GIVEN un TECHNICIEN connecté
    configurer('TECHNICIEN');
    const harness = await RouterTestingHarness.create();

    // WHEN il navigue vers /patients/nouveau
    await harness.navigateByUrl('/patients/nouveau');

    // THEN l'accès est refusé
    expect(TestBed.inject(Router).url).toBe('/acces-refuse');
    expect(harness.routeNativeElement?.querySelector('.formulaire')).toBeNull();
  });

  it('Création refusée pour un MEDECIN — /analyses/nouveau refusé', async () => {
    // GIVEN un MEDECIN connecté
    configurer('MEDECIN');
    const harness = await RouterTestingHarness.create();

    // WHEN il navigue vers /analyses/nouveau
    await harness.navigateByUrl('/analyses/nouveau');

    // THEN l'accès est refusé (écriture réservée à l'ADMIN)
    expect(TestBed.inject(Router).url).toBe('/acces-refuse');
  });

  it('Accès refusé au rôle PATIENT (module catalogue)', async () => {
    // GIVEN un PATIENT connecté
    configurer('PATIENT');
    const harness = await RouterTestingHarness.create();

    // WHEN il navigue vers /analyses
    await harness.navigateByUrl('/analyses');

    // THEN il est redirigé vers /acces-refuse
    expect(TestBed.inject(Router).url).toBe('/acces-refuse');
    expect(harness.routeNativeElement?.querySelector('.analyses')).toBeNull();
  });
});
