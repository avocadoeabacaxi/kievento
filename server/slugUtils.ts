import * as db from "./db";

/**
 * Gera um slug a partir de um título
 * Remove acentos, caracteres especiais e substitui espaços por hífens
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Normalizar para decompor acentos
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substituir espaços por hífens
    .replace(/-+/g, '-'); // Remover hífens duplicados
}

/**
 * Gera um slug único para um evento
 * Se o slug já existir, adiciona um sufixo numérico
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;
  
  // Verificar se o slug já existe
  while (await db.getEventBySlug(slug)) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
  
  return slug;
}
