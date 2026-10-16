import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { rolesPourChemin } from './core/auth/routes-roles';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);

  /** Un lien de navigation n'est affiché que si le rôle connecté y a accès. */
  protected peutVoir(chemin: string): boolean {
    const role = this.auth.utilisateur()?.role;
    if (!role) {
      return false;
    }
    return rolesPourChemin(chemin)?.includes(role) ?? false;
  }
}
