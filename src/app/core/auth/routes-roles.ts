import { Role } from './role';

export const TOUS_ROLES: readonly Role[] = ['ADMIN', 'MEDECIN', 'TECHNICIEN', 'PATIENT'];
export const ROLES_PERSONNEL: readonly Role[] = ['ADMIN', 'MEDECIN', 'TECHNICIEN'];

// Matrice unique route → rôles autorisés, consultée par le guard et testable seule.
export const MATRICE_ROUTES: Record<string, readonly Role[]> = {
  '/tableau-de-bord': TOUS_ROLES,
  '/patients': ROLES_PERSONNEL,
  '/patients/nouveau': ['ADMIN', 'MEDECIN'],
  '/patients/:id/modifier': ['ADMIN', 'MEDECIN'],
  '/analyses': ROLES_PERSONNEL,
  '/analyses/nouveau': ['ADMIN'],
  '/analyses/:id/modifier': ['ADMIN'],
};

// Retourne les rôles autorisés pour un chemin (les segments ':param' acceptent toute valeur),
// ou undefined si le chemin n'est pas dans la matrice (accès refusé par défaut).
export function rolesPourChemin(chemin: string): readonly Role[] | undefined {
  const segments = chemin.split('?')[0].split('/').filter(Boolean);
  for (const [motif, roles] of Object.entries(MATRICE_ROUTES)) {
    const segmentsMotif = motif.split('/').filter(Boolean);
    if (segmentsMotif.length !== segments.length) {
      continue;
    }
    if (segmentsMotif.every((seg, i) => seg.startsWith(':') || seg === segments[i])) {
      return roles;
    }
  }
  return undefined;
}
