import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pickFirstString(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

export function extractMediaGenerationId(obj: unknown): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;
  const record = obj as Record<string, unknown>;
  const direct = pickFirstString(record, ['mediaGenerationId', 'mediaGenerationID', 'id', 'assetId']);
  if (direct) return direct;
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = extractMediaGenerationId(item);
        if (found) return found;
      }
    } else if (value && typeof value === 'object') {
      const found = extractMediaGenerationId(value);
      if (found) return found;
    }
  }
  return undefined;
}

function looksLikeJobId(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 8) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (trimmed.includes('@')) return false;

  // useapi.net Google Flow job IDs can include ':' characters.
  // Do not reject them, because Next route encodes the id before calling /jobs/{jobId}.
  return /^[A-Za-z0-9_:\-.]+$/.test(trimmed);
}

export function extractJobId(obj: unknown): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;

  const record = obj as Record<string, unknown>;
  const directKeys = ['jobId', 'jobid', 'jobID', 'job_id'];

  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === 'string' && looksLikeJobId(value)) return value.trim();
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = extractJobId(item);
        if (found) return found;
      }
    } else if (value && typeof value === 'object') {
      const found = extractJobId(value);
      if (found) return found;
    }
  }

  return undefined;
}

export function extractUrls(obj: unknown, keys: string[]): string[] {
  const urls: string[] = [];
  const visit = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      for (const key of keys) {
        const found = record[key];
        if (typeof found === 'string' && /^https?:\/\//.test(found)) urls.push(found);
      }
      for (const nested of Object.values(record)) visit(nested);
    }
  };
  visit(obj);
  return Array.from(new Set(urls));
}
