const PREFIX = 'ykb:';

export function storageKey(key: string): string {
  return `${PREFIX}${key}`;
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(storageKey(key), JSON.stringify(value));
}

export function appendJsonArrayItem<T>(key: string, item: T): T[] {
  const current = readJson<T[]>(key, []);
  const next = [item, ...current];
  writeJson(key, next);
  return next;
}
