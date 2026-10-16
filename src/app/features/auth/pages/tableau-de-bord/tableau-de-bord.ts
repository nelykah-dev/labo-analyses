import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { rolesPourChemin } from '../../../../core/auth/routes-roles';

@Component({
  selector: 'app-page-tableau-de-bord',
  imports: [RouterLink],
  template: `
    <h2>Tableau de bord</h2>
    <p>
      Connecté en tant que {{ auth.utilisateur()?.email }}
      <strong>({{ auth.utilisateur()?.role }})</strong>
    </p>
    <nav>
      @if (peutVoir('/patients')) {
        <a routerLink="/patients">Patients</a>
      }
      @if (peutVoir('/analyses')) {
        <a routerLink="/analyses">Catalogue d'analyses</a>
      }
    </nav>
    <button type="button" (click)="auth.deconnecter()">Se déconnecter</button>
  `,
})
export class TableauDeBordPage {
  readonly auth = inject(AuthService);

  /** Lien affiché uniquement si le rôle connecté y a accès. */
  private peutVoir(chemin: string): boolean {
    const role = this.auth.utilisateur()?.role;
    if (!role) {
      return false;
    }
    return rolesPourChemin(chemin)?.includes(role) ?? false;
  }
}
