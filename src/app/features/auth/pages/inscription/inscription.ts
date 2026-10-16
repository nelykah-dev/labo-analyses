import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-page-inscription',
  imports: [FormsModule, RouterLink],
  templateUrl: './inscription.html',
})
export class InscriptionPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly motDePasse = signal('');
  readonly confirmation = signal('');
  readonly erreur = signal<string | null>(null);
  readonly enCours = signal(false);

  async soumettre(): Promise<void> {
    this.erreur.set(null);
    if (this.motDePasse() !== this.confirmation()) {
      this.erreur.set('Les deux mots de passe ne correspondent pas.');
      return;
    }
    this.enCours.set(true);
    const resultat = await this.auth.inscrire(this.email(), this.motDePasse());
    this.enCours.set(false);
    if (resultat.succes) {
      await this.router.navigate(['/connexion']);
    } else {
      this.erreur.set(resultat.erreur ?? 'Inscription impossible.');
    }
  }
}
