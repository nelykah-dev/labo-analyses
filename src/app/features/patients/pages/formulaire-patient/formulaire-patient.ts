import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DonneesPatient, Patient } from '../../../../core/modeles/patient';
import { PatientService } from '../../patient.service';

@Component({
  selector: 'app-page-formulaire-patient',
  imports: [FormsModule, RouterLink],
  templateUrl: './formulaire-patient.html',
})
export class FormulairePatientPage implements OnInit {
  private readonly service = inject(PatientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly id = signal<string | null>(null);
  readonly nom = signal('');
  readonly prenom = signal('');
  readonly dateNaissance = signal('');
  readonly numeroDossier = signal('');
  readonly erreurs = signal<string[]>([]);
  readonly messageSucces = signal<string | null>(null);
  readonly enCours = signal(false);

  ngOnInit(): void {
    void this.charger();
  }

  async charger(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.id.set(id);
    const patient: Patient | null = await this.service.obtenir(id);
    if (patient) {
      this.nom.set(patient.nom);
      this.prenom.set(patient.prenom);
      this.dateNaissance.set(patient.dateNaissance);
      this.numeroDossier.set(patient.numeroDossier);
    }
  }

  private valider(): string[] {
    const erreurs: string[] = [];
    if (!this.nom().trim()) {
      erreurs.push('Le nom est obligatoire.');
    }
    if (!this.prenom().trim()) {
      erreurs.push('Le prénom est obligatoire.');
    }
    if (!this.dateNaissance()) {
      erreurs.push('La date de naissance est obligatoire.');
    }
    if (!this.numeroDossier().trim()) {
      erreurs.push('Le numéro de dossier est obligatoire.');
    }
    return erreurs;
  }

  async soumettre(): Promise<void> {
    this.messageSucces.set(null);
    const erreurs = this.valider();
    this.erreurs.set(erreurs);
    if (erreurs.length > 0) {
      return;
    }

    const donnees: DonneesPatient = {
      nom: this.nom().trim(),
      prenom: this.prenom().trim(),
      dateNaissance: this.dateNaissance(),
      numeroDossier: this.numeroDossier().trim(),
    };

    this.enCours.set(true);
    const resultat = this.id()
      ? await this.service.modifier(this.id() as string, donnees)
      : await this.service.creer(donnees);
    this.enCours.set(false);

    if (resultat.succes) {
      if (this.id()) {
        await this.router.navigate(['/patients']);
      } else {
        this.messageSucces.set('Patient créé avec succès.');
        this.nom.set('');
        this.prenom.set('');
        this.dateNaissance.set('');
        this.numeroDossier.set('');
      }
    } else {
      this.erreurs.set([resultat.erreur ?? 'Enregistrement impossible.']);
    }
  }
}
