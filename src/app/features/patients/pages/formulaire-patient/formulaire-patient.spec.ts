import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Patient } from '../../../../core/modeles/patient';
import { PatientService } from '../../patient.service';
import { FormulairePatientPage } from './formulaire-patient';

@Component({ selector: 'app-stub-formulaire-patient', template: '' })
class Stub {}

function creerService(patient: Patient | null = null) {
  return {
    lister: vi.fn(async () => (patient ? [patient] : [])),
    obtenir: vi.fn(async () => patient),
    creer: vi.fn(async () => ({ succes: true })),
    modifier: vi.fn(async () => ({ succes: true })),
    supprimer: vi.fn(async () => ({ succes: true })),
  };
}

async function monter(
  service: ReturnType<typeof creerService>,
  parametres: Record<string, string> = {},
): Promise<ComponentFixture<FormulairePatientPage>> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'patients', component: Stub }]),
      { provide: PatientService, useValue: service },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(parametres) } },
      },
    ],
  });
  const fixture = TestBed.createComponent(FormulairePatientPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('Formulaire patient', () => {
  it('Création réussie — le patient est enregistré', async () => {
    // GIVEN le formulaire de création ouvert
    const service = creerService();
    const fixture = await monter(service);
    const page = fixture.componentInstance;

    // WHEN tous les champs sont remplis et le formulaire est soumis
    page.nom.set('Durand');
    page.prenom.set('Alice');
    page.dateNaissance.set('1992-04-12');
    page.numeroDossier.set('P-100');
    fixture.detectChanges();
    await page.soumettre();
    fixture.detectChanges();

    // THEN le patient est créé et un message de confirmation s'affiche
    expect(service.creer).toHaveBeenCalledWith({
      nom: 'Durand',
      prenom: 'Alice',
      dateNaissance: '1992-04-12',
      numeroDossier: 'P-100',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Patient créé avec succès.',
    );
  });

  it('Champs obligatoires manquants — aucun patient n’est créé', async () => {
    // GIVEN le formulaire ouvert sans nom ni prénom
    const service = creerService();
    const fixture = await monter(service);
    const page = fixture.componentInstance;
    page.dateNaissance.set('1992-04-12');
    page.numeroDossier.set('P-100');
    fixture.detectChanges();

    // WHEN il soumet sans nom ni prénom
    await page.soumettre();
    fixture.detectChanges();

    // THEN des messages d'erreur s'affichent et le service n'est pas appelé
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).toContain('Le nom est obligatoire.');
    expect(texte).toContain('Le prénom est obligatoire.');
    expect(service.creer).not.toHaveBeenCalled();
  });

  it('Modification réussie — la liste reflète la nouvelle valeur', async () => {
    // GIVEN un patient existant ouvert en modification
    const patient: Patient = {
      id: 'p1',
      nom: 'Dupont',
      prenom: 'Jean',
      dateNaissance: '1990-01-01',
      numeroDossier: 'P-001',
    };
    const service = creerService(patient);
    const fixture = await monter(service, { id: 'p1' });
    const page = fixture.componentInstance;
    expect(page.nom()).toBe('Dupont');

    // WHEN il modifie le nom et enregistre
    page.nom.set('Martin');
    await page.soumettre();
    fixture.detectChanges();

    // THEN la mise à jour est enregistrée avec la nouvelle valeur
    expect(service.modifier).toHaveBeenCalledWith('p1', {
      nom: 'Martin',
      prenom: 'Jean',
      dateNaissance: '1990-01-01',
      numeroDossier: 'P-001',
    });
    expect(TestBed.inject(Router).url).toBe('/patients');
  });
});
