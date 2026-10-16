import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyseCatalogue } from '../../core/modeles/analyse-catalogue';
import { AnalyseCatalogueService } from './analyse-catalogue.service';
import { ListeAnalysesPage } from './pages/liste-analyses/liste-analyses';

@Component({ selector: 'app-stub-recherche-analyses', template: '' })
class Stub {}

function jeuxDAnalyses(): AnalyseCatalogue[] {
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
      nom: 'Glycémie HbA1c',
      unite: 'g/L',
      typeEchantillon: 'Sang',
      refMin: 4,
      refMax: 6,
      prix: 45,
    },
    {
      id: 'a3',
      nom: 'Créatinine',
      unite: 'mg/L',
      typeEchantillon: 'Sérum',
      refMin: 6,
      refMax: 12,
      prix: 20,
    },
  ];
}

async function monter(): Promise<ComponentFixture<ListeAnalysesPage>> {
  const service = {
    lister: vi.fn(async () => jeuxDAnalyses()),
    obtenir: vi.fn(async () => null),
    creer: vi.fn(async () => ({ succes: true })),
    modifier: vi.fn(async () => ({ succes: true })),
    supprimer: vi.fn(async () => ({ succes: true })),
  };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AnalyseCatalogueService, useValue: service }],
  });
  const fixture = TestBed.createComponent(ListeAnalysesPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function saisir(
  fixture: ComponentFixture<ListeAnalysesPage>,
  selecteur: string,
  valeur: string,
): void {
  const element = (fixture.nativeElement as HTMLElement).querySelector(
    selecteur,
  ) as HTMLInputElement | HTMLSelectElement;
  element.value = valeur;
  element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input'));
  fixture.detectChanges();
}

function lignes(fixture: ComponentFixture<ListeAnalysesPage>): NodeListOf<HTMLTableRowElement> {
  return (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
}

describe('Recherche et filtres du catalogue', () => {
  it('Recherche par nom d’analyse — insensible à la casse', async () => {
    // GIVEN le catalogue affiché
    const fixture = await monter();
    expect(lignes(fixture).length).toBe(3);

    // WHEN l'utilisateur saisit « glycémie »
    saisir(fixture, 'input[name="recherche"]', 'glycémie');

    // THEN seules les analyses correspondantes restent affichées
    expect(lignes(fixture).length).toBe(2);
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Glycémie');
    expect(texte).not.toContain('Créatinine');
  });

  it('Combinaison filtre d’unité et tranche de prix', async () => {
    // GIVEN le catalogue affiché
    const fixture = await monter();

    // WHEN l'utilisateur filtre l'unité « g/L » et un prix entre 0 et 50
    saisir(fixture, 'select[name="unite"]', 'g/L');
    saisir(fixture, 'input[name="prixMin"]', '0');
    saisir(fixture, 'input[name="prixMax"]', '50');

    // THEN seules les analyses g/L dans la fourchette de prix restent affichées
    expect(lignes(fixture).length).toBe(2);
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Glycémie');
    expect(texte).not.toContain('Créatinine');
  });
});
