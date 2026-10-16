import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-page-connexion',
  imports: [FormsModule, RouterLink],
  templateUrl: './connexion.html',
})
export class ConnexionPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly motDePasse = signal('');
  readonly erreur = signal<string | null>(null);
  readonly enCours = signal(false);

  async soumettre(): Promise<void> {
    this.enCours.set(true);
    this.erreur.set(null);
    const resultat = await this.auth.connecter(this.email(), this.motDePasse());
    this.enCours.set(false);
    if (resultat.succes) {
      const url = this.router.url;
      const returnUrl = new URLSearchParams(url.split('?')[1] ?? '').get('returnUrl');
      await this.router.navigateByUrl(returnUrl ?? '/tableau-de-bord');
    } else {
      this.erreur.set(resultat.erreur ?? 'Connexion impossible.');
    }
  }
}
