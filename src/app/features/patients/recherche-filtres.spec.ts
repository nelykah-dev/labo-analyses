import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Patient } from '../../core/modeles/patient';
import { ListePatientsPage } from './pages/liste-patients/liste-patients';
import { PatientService } from './patient.service';

@Component({ selector: 'app-stub-recherche-patients', template: '' })
class Stub {}

function jeuxDePatients(): Patient[] {
  return [
    { id: 'p1', nom: 'Dupont', prenom: 'Jean', dateNaissance: '1990-01-01', numeroDossier: 'P-001' },
    { id: 'p2', nom: 'Dupont', prenom: 'Marie', dateNaissance: '1960-01-01', numeroDossier: 'P-002' },
    { id: 'p3', nom: 'Martin', prenom: 'Paul', dateNaissance: '1995-01-01', numeroDossier: 'P-003' },
  ];
}

async function monter(): Promise<ComponentFixture<ListePatientsPage>> {
  const service = {
    lister: vi.fn(async () => jeuxDePatients()),
    obtenir: vi.fn(async () => null),
    creer: vi.fn(async () => ({ succes: true })),
    modifier: vi.fn(async () => ({ succes: true })),
    supprimer: vi.fn(async () => ({ succes: true })),
  };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: PatientService, useValue: service }],
  });
  const fixture = TestBed.createComponent(ListePatientsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function saisir(
  fixture: ComponentFixture<ListePatientsPage>,
  nomChamp: string,
  valeur: string,
): void {
  const input = (fixture.nativeElement as HTMLElement).querySelector(
    `input[name="${nomChamp}"]`,
  ) as HTMLInputElement;
  input.value = valeur;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function lignes(fixture: ComponentFixture<ListePatientsPage>): NodeListOf<HTMLTableRowElement> {
  return (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
}

describe('Recherche et filtres des patients', () => {
  it('Recherche par nom — seuls les patients correspondants restent affichés', async () => {
    // GIVEN la liste complète affichée
    const fixture = await monter();
    expect(lignes(fixture).length).toBe(3);

    // WHEN l'utilisateur saisit « Dupont »
    saisir(fixture, 'recherche', 'Dupont');

    // THEN seuls les patients Dupont sont affichés
    expect(lignes(fixture).length).toBe(2);
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Jean');
    expect(texte).toContain('Marie');
    expect(texte).not.toContain('Paul');
  });

  it('Aucun résultat — un message explicite est affiché', async () => {
    // GIVEN la liste affichée
    const fixture = await monter();

    // WHEN la recherche ne correspond à aucun patient
    saisir(fixture, 'recherche', 'Inexistant');

    // THEN la liste est vide et un message le signale
    expect(lignes(fixture).length).toBe(0);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Aucun patient ne correspond',
    );
  });

  it('Combinaison recherche et tranche d’âge — les deux critères s’appliquent', async () => {
    // GIVEN la liste affichée
    const fixture = await monter();

    // WHEN l'utilisateur combine « Dupont » et une tranche d'âge 30–40
    saisir(fixture, 'recherche', 'Dupont');
    saisir(fixture, 'ageMin', '30');
    saisir(fixture, 'ageMax', '40');

    // THEN seul le patient Dupont Jean (36 ans) correspond
    expect(lignes(fixture).length).toBe(1);
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Jean');
    expect(texte).not.toContain('Marie');
  });

  it('Réinitialisation des critères — la liste complète réapparaît', async () => {
    // GIVEN des critères actifs qui filtrent la liste
    const fixture = await monter();
    saisir(fixture, 'recherche', 'Dupont');
    saisir(fixture, 'ageMin', '30');
    saisir(fixture, 'ageMax', '40');
    expect(lignes(fixture).length).toBe(1);

    // WHEN l'utilisateur réinitialise les filtres
    (fixture.nativeElement as HTMLElement)
      .querySelector('button')
      ?.dispatchEvent(new Event('click'));
    fixture.detectChanges();

    // THEN tous les patients sont de nouveau affichés
    expect(lignes(fixture).length).toBe(3);
  });
});
