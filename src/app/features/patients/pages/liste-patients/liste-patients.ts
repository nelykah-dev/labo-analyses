import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Patient } from '../../../../core/modeles/patient';
import { filtrerPatients } from '../../recherche';
import { PatientService } from '../../patient.service';

@Component({
  selector: 'app-page-liste-patients',
  imports: [FormsModule, RouterLink],
  templateUrl: './liste-patients.html',
})
export class ListePatientsPage implements OnInit {
  private readonly service = inject(PatientService);

  readonly patients = signal<Patient[]>([]);
  readonly chargement = signal(false);
  readonly recherche = signal('');
  readonly ageMin = signal<number | null>(null);
  readonly ageMax = signal<number | null>(null);
  readonly patientASupprimer = signal<Patient | null>(null);

  readonly patientsAffiches = computed(() =>
    filtrerPatients(this.patients(), {
      texte: this.recherche(),
      ageMin: this.ageMin(),
      ageMax: this.ageMax(),
    }),
  );

  ngOnInit(): void {
    void this.charger();
  }

  async charger(): Promise<void> {
    this.chargement.set(true);
    this.patients.set(await this.service.lister());
    this.chargement.set(false);
  }

  reinitialiser(): void {
    this.recherche.set('');
    this.ageMin.set(null);
    this.ageMax.set(null);
  }

  demanderSupprimer(patient: Patient): void {
    this.patientASupprimer.set(patient);
  }

  annulerSupprimer(): void {
    this.patientASupprimer.set(null);
  }

  async confirmerSupprimer(): Promise<void> {
    const patient = this.patientASupprimer();
    if (!patient) {
      return;
    }
    await this.service.supprimer(patient.id);
    this.patientASupprimer.set(null);
    await this.charger();
  }
}
