import { FeedFormat } from '@prisma/client';
import { NormalizedListing } from '../normalized';
import { parseKyero } from './kyero';
import { parseInmovilla } from './inmovilla';
import { parseCasaya } from './casaya';

type Parser = (doc: any) => NormalizedListing[];

/**
 * Witei, Mobilia и Resales Online выгружают Kyero-совместимый XML,
 * поэтому используют тот же разборщик.
 */
export const PARSERS: Record<FeedFormat, Parser> = {
  KYERO: parseKyero,
  WITEI: parseKyero,
  MOBILIA: parseKyero,
  RESALES: parseKyero,
  INMOVILLA: parseInmovilla,
  CASAYA: parseCasaya,
};

/** Угадывает формат по корневым тегам — используется в предпросмотре фида. */
export function detectFormat(doc: any): FeedFormat {
  const keys = Object.keys(doc ?? {}).map((k) => k.toLowerCase());
  const flat = JSON.stringify(doc ?? {}).slice(0, 4000).toLowerCase();

  if (keys.includes('inmovilla') || flat.includes('cod_ofer')) return 'INMOVILLA';
  if (keys.includes('casaya')) return 'CASAYA';
  if (keys.includes('kyero') || flat.includes('surface_area')) return 'KYERO';
  return 'KYERO';
}

export { parseKyero, parseInmovilla, parseCasaya };
