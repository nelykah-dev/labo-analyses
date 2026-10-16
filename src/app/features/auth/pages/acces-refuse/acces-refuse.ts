import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-page-acces-refuse',
  imports: [RouterLink],
  template: `
    <h2>Accès refusé</h2>
    <p>
      Votre rôle ({{ auth.utilisateur()?.role ?? 'inconnu' }}) ne permet pas d'accéder à cette
      page.
    </p>
    <a routerLink="/tableau-de-bord">Retour au tableau de bord</a>
  `,
})
export class AccesRefusePage {
  readonly auth = inject(AuthService);
}
