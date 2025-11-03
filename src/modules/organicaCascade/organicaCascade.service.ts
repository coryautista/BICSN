import * as repo from './organicaCascade.repo.js';

// Get Organica1 children for a given Organica0
export async function getOrganica1Children(claveOrganica0: string) {
  return await repo.getOrganica1ByOrganica0(claveOrganica0);
}

// Get Organica2 children for a given Organica1
export async function getOrganica2Children(claveOrganica0: string, claveOrganica1: string) {
  return await repo.getOrganica2ByOrganica1(claveOrganica0, claveOrganica1);
}

// Get Organica3 children for a given Organica2
export async function getOrganica3Children(claveOrganica0: string, claveOrganica1: string, claveOrganica2: string) {
  return await repo.getOrganica3ByOrganica2(claveOrganica0, claveOrganica1, claveOrganica2);
}
