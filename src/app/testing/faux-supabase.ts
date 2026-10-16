import { SupabaseClient } from '@supabase/supabase-js';

type Ligne = Record<string, unknown>;

export interface OptionsFauxSupabase {
  profils?: Ligne[];
  patients?: Ligne[];
  analyses?: Ligne[];
  utilisateurs?: { id: string; email: string; motDePasse: string }[];
  sessionInitiale?: { userId: string; email: string } | null;
}

export interface FauxSupabase {
  client: SupabaseClient;
  tables: Map<string, Ligne[]>;
  utilisateurs: { id: string; email: string; motDePasse: string }[];
  appels: Record<string, unknown[]>;
  sessionCourante(): { user: { id: string; email: string } } | null;
}

/**
 * Client Supabase en mémoire pour les tests : reproduit auth + requêtes de table
 * (select/insert/update/delete) sans accès réseau, avec un builder « thenable »
 * comme celui de @supabase/supabase-js.
 */
export function creerFauxSupabase(options: OptionsFauxSupabase = {}): FauxSupabase {
  const tables = new Map<string, Ligne[]>([
    ['profiles', [...(options.profils ?? [])]],
    ['patients', [...(options.patients ?? [])]],
    ['analyses_catalogue', [...(options.analyses ?? [])]],
  ]);
  const utilisateurs = [...(options.utilisateurs ?? [])];
  let session: { user: { id: string; email: string } } | null = options.sessionInitiale
    ? { user: { id: options.sessionInitiale.userId, email: options.sessionInitiale.email } }
    : null;

  const appels: Record<string, unknown[]> = {
    signUp: [],
    signInWithPassword: [],
    signOut: [],
    insert: [],
    update: [],
    delete: [],
  };

  function creerRequete(table: string) {
    const lignes = () => tables.get(table) ?? [];
    let operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
    let filtreId: string | null = null;
    let valeurs: Ligne = {};

    const executer = (): { data: unknown; error: unknown } => {
      if (operation === 'insert') {
        const nouvelle: Ligne = {
          id: (valeurs['id'] as string) ?? `${table}-${lignes().length + 1}`,
          ...valeurs,
        };
        tables.set(table, [...lignes(), nouvelle]);
        return { data: [nouvelle], error: null };
      }
      if (operation === 'update') {
        const cible = lignes().find((ligne) => String(ligne['id']) === filtreId);
        if (cible) {
          Object.assign(cible, valeurs);
        }
        return { data: cible ? [cible] : [], error: null };
      }
      if (operation === 'delete') {
        tables.set(
          table,
          lignes().filter((ligne) => String(ligne['id']) !== filtreId),
        );
        return { data: null, error: null };
      }
      return { data: [...lignes()], error: null };
    };

    const resultatSingle = () => {
      const cible = filtreId
        ? lignes().find((ligne) => String(ligne['id']) === filtreId)
        : lignes()[0];
      return { data: cible ?? null, error: cible ? null : { message: 'Aucune ligne' } };
    };

    const requete = {
      select: () => requete,
      order: () => requete,
      eq: (colonne: string, valeur: unknown) => {
        if (colonne === 'id') {
          filtreId = String(valeur);
        }
        return requete;
      },
      single: () => Promise.resolve(resultatSingle()),
      insert: (valeur: Ligne) => {
        operation = 'insert';
        valeurs = valeur;
        appels['insert'].push({ table, valeurs: valeur });
        return requete;
      },
      update: (valeur: Ligne) => {
        operation = 'update';
        valeurs = valeur;
        appels['update'].push({ table, valeurs: valeur });
        return requete;
      },
      delete: () => {
        operation = 'delete';
        appels['delete'].push({ table });
        return requete;
      },
      then: (onFulfilled?: (valeur: unknown) => unknown, onRejected?: (raison: unknown) => unknown) =>
        Promise.resolve(executer()).then(onFulfilled, onRejected),
    };
    return requete;
  }

  const auth = {
    signUp: async (identifiants: { email: string; password: string }) => {
      appels['signUp'].push(identifiants);
      if (utilisateurs.some((u) => u.email === identifiants.email)) {
        return {
          data: { user: null, session: null },
          error: { message: 'User already registered', code: 'user_already_exists' },
        };
      }
      const id = `user-${utilisateurs.length + 1}`;
      utilisateurs.push({ id, email: identifiants.email, motDePasse: identifiants.password });
      // Reproduit le trigger SQL : un profil PATIENT est créé automatiquement.
      tables.set('profiles', [...(tables.get('profiles') ?? []), { id, role: 'PATIENT' }]);
      return {
        data: {
          user: { id, email: identifiants.email, identities: [{ id: 'identite-1' }] },
          session: null,
        },
        error: null,
      };
    },
    signInWithPassword: async (identifiants: { email: string; password: string }) => {
      appels['signInWithPassword'].push(identifiants);
      const trouve = utilisateurs.find(
        (u) => u.email === identifiants.email && u.motDePasse === identifiants.password,
      );
      if (!trouve) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        };
      }
      session = { user: { id: trouve.id, email: trouve.email } };
      return { data: { user: session.user, session }, error: null };
    },
    signOut: async () => {
      appels['signOut'].push({});
      session = null;
      return { error: null };
    },
    getSession: async () => ({ data: { session }, error: null }),
  };

  const client = {
    auth,
    from: (table: string) => creerRequete(table),
  } as unknown as SupabaseClient;

  return { client, tables, utilisateurs, appels, sessionCourante: () => session };
}
