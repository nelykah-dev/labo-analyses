import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Patient } from '../../../../core/modeles/patient';
import { PatientService } from '../../patient.service';
import { ListePatientsPage } from './liste-patients';

@Component({ selector: 'app-stub-liste-patients', template: '' })
class Stub {}

function patientsDeDepart(): Patient[] {
  return [
    { id: 'p1', nom: 'Dupont', prenom: 'Jean', dateNaissance: '1990-01-01', numeroDossier: 'P-001' },
    { id: 'p2', nom: 'Martin', prenom: 'Paul', dateNaissance: '1980-01-01', numeroDossier: 'P-002' },
  ];
}

function creerService(donnees: Patient[]) {
  return {
    lister: vi.fn(async () => [...donnees]),
    obtenir: vi.fn(async (id: string) => donnees.find((patient) => patient.id === id) ?? null),
    creer: vi.fn(async () => ({ succes: true })),
    modifier: vi.fn(async () => ({ succes: true })),
    supprimer: vi.fn(async (id: string) => {
      const index = donnees.findIndex((patient) => patient.id === id);
      if (index >= 0) {
        donnees.splice(index, 1);
      }
      return { succes: true };
    }),
  };
}

async function monter(service: ReturnType<typeof creerService>): Promise<ComponentFixture<ListePatientsPage>> {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: PatientService, useValue: service }],
  });
  const fixture = TestBed.createComponent(ListePatientsPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function lignes(fixture: ComponentFixture<ListePatientsPage>): NodeListOf<HTMLTableRowElement> {
  return (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
}

describe('Liste des patients', () => {
  it('Liste accessible à un rôle autorisé — les patients enregistrés sont affichés', async () => {
    // GIVEN un utilisateur du personnel soignant connecté
    const service = creerService(patientsDeDepart());

    // WHEN la liste des patients est ouverte
    const fixture = await monter(service);

    // THEN tous les patients sont affichés
    expect(lignes(fixture).length).toBe(2);
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Dupont');
    expect(texte).toContain('Martin');
  });

  it('Suppression confirmée — après confirmation le patient disparaît de la liste', async () => {
    // GIVEN la liste affichée
    const donnees = patientsDeDepart();
    const service = creerService(donnees);
    const fixture = await monter(service);

    // WHEN l'utilisateur demande la suppression puis confirme
    (fixture.nativeElement as HTMLElement).querySelectorAll('tbody button')[0].dispatchEvent(
      new Event('click'),
    );
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Supprimer le patient');

    await fixture.componentInstance.confirmerSupprimer();
    fixture.detectChanges();

    // THEN le patient est supprimé et la liste ne le contient plus
    expect(service.supprimer).toHaveBeenCalledWith('p1');
    expect(donnees.map((patient) => patient.id)).toEqual(['p2']);
    expect(lignes(fixture).length).toBe(1);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Dupont');
  });

  it('Suppression annulée — aucun patient n’est supprimé', async () => {
    // GIVEN la liste affichée et une demande de suppression en cours
    const donnees = patientsDeDepart();
    const service = creerService(donnees);
    const fixture = await monter(service);
    fixture.componentInstance.demanderSupprimer(donnees[0]);
    fixture.detectChanges();

    // WHEN l'utilisateur annule
    fixture.componentInstance.annulerSupprimer();
    fixture.detectChanges();

    // THEN le service de suppression n'est jamais appelé et la liste est intacte
    expect(service.supprimer).not.toHaveBeenCalled();
    expect(lignes(fixture).length).toBe(2);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Supprimer le patient');
  });
});
