import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyseCatalogue } from '../../../../core/modeles/analyse-catalogue';
import { AnalyseCatalogueService } from '../../analyse-catalogue.service';
import { ListeAnalysesPage } from './liste-analyses';

@Component({ selector: 'app-stub-liste-analyses', template: '' })
class Stub {}

function analysesDeDepart(): AnalyseCatalogue[] {
  return [
    {
      id: 'a1',
      nom: 'Glycémie',
      unite: 'g/L',
      typeEchantillon: 'Sang',
      refMin: 0.7,
      refMax: 1.1,
      prix: 15,
    },
    {
      id: 'a2',
      nom: 'Créatinine',
      unite: 'mg/L',
      typeEchantillon: 'Sérum',
      refMin: 6,
      refMax: 12,
      prix: 20,
    },
  ];
}

function creerService(donnees: AnalyseCatalogue[]) {
  return {
    lister: vi.fn(async () => [...donnees]),
    obtenir: vi.fn(async (id: string) => donnees.find((analyse) => analyse.id === id) ?? null),
    creer: vi.fn(async () => ({ succes: true })),
    modifier: vi.fn(async () => ({ succes: true })),
    supprimer: vi.fn(async (id: string) => {
      const index = donnees.findIndex((analyse) => analyse.id === id);
      if (index >= 0) {
        donnees.splice(index, 1);
      }
      return { succes: true };
    }),
  };
}

async function monter(
  service: ReturnType<typeof creerService>,
): Promise<ComponentFixture<ListeAnalysesPage>> {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AnalyseCatalogueService, useValue: service }],
  });
  const fixture = TestBed.createComponent(ListeAnalysesPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function lignes(fixture: ComponentFixture<ListeAnalysesPage>): NodeListOf<HTMLTableRowElement> {
  return (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
}

describe('Catalogue d’analyses', () => {
  it('Catalogue accessible à un rôle autorisé — les analyses sont affichées', async () => {
    // GIVEN un utilisateur du personnel soignant connecté
    const service = creerService(analysesDeDepart());

    // WHEN le catalogue est ouvert
    const fixture = await monter(service);

    // THEN toutes les analyses du catalogue sont affichées
    expect(lignes(fixture).length).toBe(2);
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Glycémie');
    expect(texte).toContain('Créatinine');
  });

  it('Suppression confirmée — l’analyse est retirée du catalogue', async () => {
    // GIVEN le catalogue affiché
    const donnees = analysesDeDepart();
    const service = creerService(donnees);
    const fixture = await monter(service);

    // WHEN l'ADMIN confirme la suppression d'une analyse
    fixture.componentInstance.demanderSupprimer(donnees[0]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "Supprimer l'analyse Glycémie",
    );

    await fixture.componentInstance.confirmerSupprimer();
    fixture.detectChanges();

    // THEN l'analyse est supprimée et n'apparaît plus
    expect(service.supprimer).toHaveBeenCalledWith('a1');
    expect(donnees.map((analyse) => analyse.id)).toEqual(['a2']);
    expect(lignes(fixture).length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Glycémie');
  });
});
