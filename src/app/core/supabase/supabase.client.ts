import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT');

export function creerClientSupabase(): SupabaseClient {
  if (!environment.supabaseUrl || !environment.supabaseAnonKey) {
    throw new Error(
      'Configuration Supabase manquante : définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
    );
  }
  return createClient(environment.supabaseUrl, environment.supabaseAnonKey);
}
