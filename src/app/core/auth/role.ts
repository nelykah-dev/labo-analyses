export const ROLES = ['ADMIN', 'MEDECIN', 'TECHNICIEN', 'PATIENT'] as const;

export type Role = (typeof ROLES)[number];

export function estRole(valeur: unknown): valeur is Role {
  return typeof valeur === 'string' && (ROLES as readonly string[]).includes(valeur);
}
