import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnalyseCatalogue } from '../../../../core/modeles/analyse-catalogue';
import { AnalyseCatalogueService } from '../../analyse-catalogue.service';
import { filtrerAnalyses } from '../../recherche';

@Component({
  selector: 'app-page-liste-analyses',
  imports: [FormsModule, RouterLink],
  templateUrl: './liste-analyses.html',
})
export class ListeAnalysesPage implements OnInit {
  private readonly service = inject(AnalyseCatalogueService);

  readonly analyses = signal<AnalyseCatalogue[]>([]);
  readonly chargement = signal(false);
  readonly recherche = signal('');
  readonly unite = signal<string | null>(null);
  readonly prixMin = signal<number | null>(null);
  readonly prixMax = signal<number | null>(null);
  readonly analyseASupprimer = signal<AnalyseCatalogue | null>(null);

  readonly analysesAffichees = computed(() =>
    filtrerAnalyses(this.analyses(), {
      texte: this.recherche(),
      unite: this.unite(),
      prixMin: this.prixMin(),
      prixMax: this.prixMax(),
    }),
  );

  ngOnInit(): void {
    void this.charger();
  }

  async charger(): Promise<void> {
    this.chargement.set(true);
    this.analyses.set(await this.service.lister());
    this.chargement.set(false);
  }

  unitesDisponibles(): string[] {
    return [...new Set(this.analyses().map((analyse) => analyse.unite))].sort();
  }

  reinitialiser(): void {
    this.recherche.set('');
    this.unite.set(null);
    this.prixMin.set(null);
    this.prixMax.set(null);
  }

  demanderSupprimer(analyse: AnalyseCatalogue): void {
    this.analyseASupprimer.set(analyse);
  }

  annulerSupprimer(): void {
    this.analyseASupprimer.set(null);
  }

  async confirmerSupprimer(): Promise<void> {
    const analyse = this.analyseASupprimer();
    if (!analyse) {
      return;
    }
    await this.service.supprimer(analyse.id);
    this.analyseASupprimer.set(null);
    await this.charger();
  }
}
