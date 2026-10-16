// Génère `src/environments/environment.local.ts` à partir de :
//   1. les variables d'environnement du shell (ex. Vercel),
//   2. sinon le fichier `.env.local` (développement local, non commité).
// Le fichier généré est ignoré par Git : aucune clé n'est committée.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cheminEnvLocal = fileURLToPath(new URL('../.env.local', import.meta.url));
const cheminGenere = fileURLToPath(new URL('../src/environments/environment.local.ts', import.meta.url));

function lireEnvLocal(chemin) {
  const valeurs = {};
  if (!existsSync(chemin)) return valeurs;
  for (const ligne of readFileSync(chemin, 'utf8').split(/\r?\n/)) {
    const texte = ligne.trim();
    if (!texte || texte.startsWith('#')) continue;
    const separateur = texte.indexOf('=');
    if (separateur === -1) continue;
    const cle = texte.slice(0, separateur).trim();
    let valeur = texte.slice(separateur + 1).trim();
    const guillemets = valeur[0];
    if ((guillemets === '"' || guillemets === "'") && valeur.endsWith(guillemets)) {
      valeur = valeur.slice(1, -1);
    }
    valeurs[cle] = valeur;
  }
  return valeurs;
}

const local = lireEnvLocal(cheminEnvLocal);
const url = process.env.VITE_SUPABASE_URL || local.VITE_SUPABASE_URL || '';
const cle = process.env.VITE_SUPABASE_ANON_KEY || local.VITE_SUPABASE_ANON_KEY || '';

const contenu = `// Fichier généré par tools/generer-env.mjs — ne pas éditer à la main, ne pas committer.
export const environnementLocal = {
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(cle)},
};
`;

writeFileSync(cheminGenere, contenu, 'utf8');
console.log(
  `Environnement local généré (VITE_SUPABASE_URL ${url ? 'définie' : 'absente'}).`,
);
