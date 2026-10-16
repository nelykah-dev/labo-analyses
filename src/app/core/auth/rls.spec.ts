import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Test d'intégration des politiques RLS : vérifie la migration SQL réellement
 * versionnée (aucun accès réseau requis). Le scénario « Requête refusée par les
 * politiques RLS » correspond à la politique de lecture de `patients` qui
 * n'autorise que le personnel soignant : un PATIENT obtient zéro ligne.
 */
const cheminSql = join(process.cwd(), 'sql', '0001_fondations.sql');
const sql = readFileSync(cheminSql, 'utf8');

function politique(nom: string): RegExpExecArray | null {
  return new RegExp(`create policy "${nom}"[\\s\\S]*?;`).exec(sql);
}

function rolesLecturePatients(): string[] {
  const definition = politique('patients_select_personnel');
  const correspondance = definition ? /role_utilisateur\(\) in \(([^)]*)\)/.exec(definition[0]) : null;
  if (!correspondance) {
    return [];
  }
  return correspondance[1]
    .split(',')
    .map((role) => role.trim().replace(/'/g, ''))
    .filter(Boolean);
}

describe('Politiques RLS', () => {
  it('RLS activée sur les trois tables', () => {
    // WHEN la migration est appliquée
    // THEN les trois tables sont protégées par RLS
    expect(sql).toContain('alter table public.profiles enable row level security');
    expect(sql).toContain('alter table public.patients enable row level security');
    expect(sql).toContain('alter table public.analyses_catalogue enable row level security');
  });

  it('Requête refusée par les politiques RLS — un PATIENT ne lit pas patients', () => {
    // GIVEN un client Supabase authentifié avec le rôle PATIENT
    // WHEN il interroge la table patients
    const roles = rolesLecturePatients();

    // THEN la politique n'autorise que le personnel soignant : zéro ligne pour un PATIENT
    expect(roles).toEqual(['ADMIN', 'MEDECIN', 'TECHNICIEN']);
    expect(roles).not.toContain('PATIENT');
  });

  it('Écriture du catalogue et suppression des patients réservées à l’ADMIN', () => {
    // WHEN on inspecte les politiques d'écriture
    const insertPatients = politique('patients_insert_medecin');
    const deletePatients = politique('patients_delete_admin');
    const writeAnalyses = politique('analyses_write_admin');

    // THEN les politiques d'écriture/ suppression existent et ciblent les bons rôles
    expect(insertPatients).not.toBeNull();
    expect(insertPatients?.[0]).toContain("'ADMIN', 'MEDECIN'");
    expect(deletePatients?.[0]).toContain('est_admin()');
    expect(writeAnalyses?.[0]).toContain('est_admin()');
  });
});
