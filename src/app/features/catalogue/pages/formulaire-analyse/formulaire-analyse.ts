import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AnalyseCatalogue, DonneesAnalyse } from '../../../../core/modeles/analyse-catalogue';
import { AnalyseCatalogueService } from '../../analyse-catalogue.service';

@Component({
  selector: 'app-page-formulaire-analyse',
  imports: [FormsModule, RouterLink],
  templateUrl: './formulaire-analyse.html',
})
export class FormulaireAnalysePage implements OnInit {
  private readonly service = inject(AnalyseCatalogueService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly id = signal<string | null>(null);
  readonly nom = signal('');
  readonly unite = signal('');
  readonly typeEchantillon = signal('');
  readonly refMin = signal<number | null>(null);
  readonly refMax = signal<number | null>(null);
  readonly prix = signal<number | null>(null);
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
    const analyse: AnalyseCatalogue | null = await this.service.obtenir(id);
    if (analyse) {
      this.nom.set(analyse.nom);
      this.unite.set(analyse.unite);
      this.typeEchantillon.set(analyse.typeEchantillon);
      this.refMin.set(analyse.refMin);
      this.refMax.set(analyse.refMax);
      this.prix.set(analyse.prix);
    }
  }

  private valider(): string[] {
    const erreurs: string[] = [];
    if (!this.nom().trim()) {
      erreurs.push("Le nom de l'analyse est obligatoire.");
    }
    if (!this.unite().trim()) {
      erreurs.push("L'unité est obligatoire.");
    }
    if (!this.typeEchantillon().trim()) {
      erreurs.push("Le type d'échantillon est obligatoire.");
    }
    if (this.refMin() == null) {
      erreurs.push('La valeur plancher de référence est obligatoire.');
    }
    if (this.refMax() == null) {
      erreurs.push('La valeur plafond de référence est obligatoire.');
    }
    if (this.refMin() != null && this.refMax() != null && this.refMin()! > this.refMax()!) {
      erreurs.push('La valeur plancher ne peut pas dépasser la valeur plafond.');
    }
    if (this.prix() == null || this.prix()! < 0) {
      erreurs.push('Le prix doit être un nombre positif ou nul.');
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

    const donnees: DonneesAnalyse = {
      nom: this.nom().trim(),
      unite: this.unite().trim(),
      typeEchantillon: this.typeEchantillon().trim(),
      refMin: this.refMin() as number,
      refMax: this.refMax() as number,
      prix: this.prix() as number,
    };

    this.enCours.set(true);
    const resultat = this.id()
      ? await this.service.modifier(this.id() as string, donnees)
      : await this.service.creer(donnees);
    this.enCours.set(false);

    if (resultat.succes) {
      if (this.id()) {
        await this.router.navigate(['/analyses']);
      } else {
        this.messageSucces.set('Analyse créée avec succès.');
        this.nom.set('');
        this.unite.set('');
        this.typeEchantillon.set('');
        this.refMin.set(null);
        this.refMax.set(null);
        this.prix.set(null);
      }
    } else {
      this.erreurs.set([resultat.erreur ?? "Enregistrement impossible."]);
    }
  }
}
