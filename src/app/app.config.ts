import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { SUPABASE_CLIENT, creerClientSupabase } from './core/supabase/supabase.client';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: SUPABASE_CLIENT, useFactory: creerClientSupabase },
    provideAppInitializer(() => inject(AuthService).initialiser()),
  ],
};
