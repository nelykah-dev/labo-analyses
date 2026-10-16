import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { AnalyseCatalogue } from '../../../../core/modeles/analyse-catalogue';
import { AnalyseCatalogueService } from '../../analyse-catalogue.service';
import { FormulaireAnalysePage } from './formulaire-analyse';

@Component({ selector: 'app-stub-formulaire-analyse', template: '' })
class Stub {}

function creerService(analyse: AnalyseCatalogue | null = null) {
  return {
    lister: vi.fn(async () => (analyse ? [analyse] : [])),
    obtenir: vi.fn(async () => analyse),
    creer: vi.fn(async () => ({ succes: true })),
    modifier: vi.fn(async () => ({ succes: true })),
    supprimer: vi.fn(async () => ({ succes: true })),
  };
}

async function monter(
  service: ReturnType<typeof creerService>,
  parametres: Record<string, string> = {},
): Promise<ComponentFixture<FormulaireAnalysePage>> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'analyses', component: Stub }]),
      { provide: AnalyseCatalogueService, useValue: service },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(parametres) } },
      },
    ],
  });
  const fixture = TestBed.createComponent(FormulaireAnalysePage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function remplirValide(fixture: ComponentFixture<FormulaireAnalysePage>): void {
  const page = fixture.componentInstance;
  page.nom.set('Glycémie');
  page.unite.set('g/L');
  page.typeEchantillon.set('Sang');
  page.refMin.set(0.7);
  page.refMax.set(1.1);
  page.prix.set(15);
  fixture.detectChanges();
}

describe('Formulaire analyse du catalogue', () => {
  it('Création réussie — l’analyse est ajoutée au catalogue', async () => {
    // GIVEN le formulaire d'ajout ouvert par un ADMIN
    const service = creerService();
    const fixture = await monter(service);

    // WHEN tous les champs sont renseignés et le formulaire est soumis
    remplirValide(fixture);
    await fixture.componentInstance.soumettre();
    fixture.detectChanges();

    // THEN l'analyse est créée avec le type d'échantillon
    expect(service.creer).toHaveBeenCalledWith({
      nom: 'Glycémie',
      unite: 'g/L',
      typeEchantillon: 'Sang',
      refMin: 0.7,
      refMax: 1.1,
      prix: 15,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Analyse créée avec succès.',
    );
  });

  it('Valeur de référence incohérente — plancher supérieur au plafond refusé', async () => {
    // GIVEN une valeur plancher supérieure à la valeur plafond
    const service = creerService();
    const fixture = await monter(service);
    remplirValide(fixture);
    fixture.componentInstance.refMin.set(5);
    fixture.componentInstance.refMax.set(1);
    fixture.detectChanges();

    // WHEN le formulaire est soumis
    await fixture.componentInstance.soumettre();
    fixture.detectChanges();

    // THEN une erreur s'affiche et rien n'est créé
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'ne peut pas dépasser la valeur plafond',
    );
    expect(service.creer).not.toHaveBeenCalled();
  });

  it('Prix négatif — refusé', async () => {
    // GIVEN un prix négatif
    const service = creerService();
    const fixture = await monter(service);
    remplirValide(fixture);
    fixture.componentInstance.prix.set(-5);
    fixture.detectChanges();

    // WHEN le formulaire est soumis
    await fixture.componentInstance.soumettre();
    fixture.detectChanges();

    // THEN une erreur s'affiche et rien n'est créé
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Le prix doit être un nombre positif ou nul.',
    );
    expect(service.creer).not.toHaveBeenCalled();
  });

  it('Type d’échantillon manquant — refusé', async () => {
    // GIVEN le type d'échantillon laissé vide
    const service = creerService();
    const fixture = await monter(service);
    remplirValide(fixture);
    fixture.componentInstance.typeEchantillon.set('');
    fixture.detectChanges();

    // WHEN le formulaire est soumis
    await fixture.componentInstance.soumettre();
    fixture.detectChanges();

    // THEN une erreur s'affiche et rien n'est créé
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "Le type d'échantillon est obligatoire.",
    );
    expect(service.creer).not.toHaveBeenCalled();
  });

  it('Mise à jour du prix — la nouvelle valeur est enregistrée', async () => {
    // GIVEN une analyse existante ouverte en modification
    const analyse: AnalyseCatalogue = {
      id: 'a1',
      nom: 'Glycémie',
      unite: 'g/L',
      typeEchantillon: 'Sang',
      refMin: 0.7,
      refMax: 1.1,
      prix: 15,
    };
    const service = creerService(analyse);
    const fixture = await monter(service, { id: 'a1' });
    expect(fixture.componentInstance.prix()).toBe(15);

    // WHEN l'ADMIN modifie le prix et enregistre
    fixture.componentInstance.prix.set(35);
    await fixture.componentInstance.soumettre();
    fixture.detectChanges();

    // THEN le nouveau prix est enregistré
    expect(service.modifier).toHaveBeenCalledWith('a1', {
      nom: 'Glycémie',
      unite: 'g/L',
      typeEchantillon: 'Sang',
      refMin: 0.7,
      refMax: 1.1,
      prix: 35,
    });
    expect(TestBed.inject(Router).url).toBe('/analyses');
  });
});
