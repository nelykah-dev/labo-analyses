// Configuration Supabase issue de src/environments/environment.local.ts,
// généré au build par `tools/generer-env.mjs` à partir de `.env.local` (local,
// non commité) ou des variables d'environnement du CI/Vercel (VITE_SUPABASE_*).
// Aucune clé n'est jamais présente dans un fichier versionné.
import { environnementLocal } from './environment.local';

export const environment = {
  supabaseUrl: environnementLocal.supabaseUrl,
  supabaseAnonKey: environnementLocal.supabaseAnonKey,
};
