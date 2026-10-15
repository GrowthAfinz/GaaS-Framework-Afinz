import { supabase } from '../../../services/supabaseClient';
import type { FetchedImage } from '../export/skillPack';

const BATCH = 60;

/**
 * Baixa as imagens dos e-mails pela função email-image-proxy (os servidores de imagem não
 * liberam CORS). Roda com a sessão do usuário; imagem que falha fica de fora e é listada.
 */
export async function fetchPackImages(urls: string[]): Promise<{ images: Record<string, FetchedImage>; failed: string[] }> {
  const images: Record<string, FetchedImage> = {};
  const failed: string[] = [];
  for (let i = 0; i < urls.length; i += BATCH) {
    const { data, error } = await supabase.functions.invoke('email-image-proxy', { body: { urls: urls.slice(i, i + BATCH) } });
    if (error) throw new Error(`Não consegui baixar as imagens: ${error.message}`);
    for (const [url, item] of Object.entries((data?.images ?? {}) as Record<string, { contentType?: string; base64?: string; error?: string }>)) {
      if (!item.base64 || !item.contentType) { failed.push(url); continue; }
      const binary = atob(item.base64);
      const bytes = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j += 1) bytes[j] = binary.charCodeAt(j);
      images[url] = { contentType: item.contentType, bytes };
    }
  }
  return { images, failed };
}
