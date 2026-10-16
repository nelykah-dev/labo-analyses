import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { rolesPourChemin } from './routes-roles';

/**
 * Garde fonctionnelle : consulte la matrice route → rôles (routes-roles.ts).
 * - Non connecté → /connexion?returnUrl=…
 * - Rôle absent de la matrice ou non autorisé → /acces-refuse
 */
export const roleGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const utilisateur = auth.utilisateur();

  if (!utilisateur) {
    return router.createUrlTree(['/connexion'], { queryParams: { returnUrl: state.url } });
  }

  const roles = rolesPourChemin(state.url);
  if (!roles || !roles.includes(utilisateur.role)) {
    return router.createUrlTree(['/acces-refuse']);
  }
  return true;
};
