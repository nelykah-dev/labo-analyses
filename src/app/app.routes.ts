import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/route-role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/auth/pages/connexion/connexion').then((m) => m.ConnexionPage),
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./features/auth/pages/inscription/inscription').then((m) => m.InscriptionPage),
  },
  {
    path: 'tableau-de-bord',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./features/auth/pages/tableau-de-bord/tableau-de-bord').then(
        (m) => m.TableauDeBordPage,
      ),
  },
  {
    path: 'acces-refuse',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('./features/auth/pages/acces-refuse/acces-refuse').then((m) => m.AccesRefusePage),
  },
  {
    path: 'patients',
    canActivate: [roleGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/patients/pages/liste-patients/liste-patients').then(
            (m) => m.ListePatientsPage,
          ),
      },
      {
        path: 'nouveau',
        loadComponent: () =>
          import('./features/patients/pages/formulaire-patient/formulaire-patient').then(
            (m) => m.FormulairePatientPage,
          ),
      },
      {
        path: ':id/modifier',
        loadComponent: () =>
          import('./features/patients/pages/formulaire-patient/formulaire-patient').then(
            (m) => m.FormulairePatientPage,
          ),
      },
    ],
  },
  {
    path: 'analyses',
    canActivate: [roleGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/catalogue/pages/liste-analyses/liste-analyses').then(
            (m) => m.ListeAnalysesPage,
          ),
      },
      {
        path: 'nouveau',
        loadComponent: () =>
          import('./features/catalogue/pages/formulaire-analyse/formulaire-analyse').then(
            (m) => m.FormulaireAnalysePage,
          ),
      },
      {
        path: ':id/modifier',
        loadComponent: () =>
          import('./features/catalogue/pages/formulaire-analyse/formulaire-analyse').then(
            (m) => m.FormulaireAnalysePage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'tableau-de-bord' },
];
