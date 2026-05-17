export type ServiceAnchorGroup = 'service' | 'starter-kit';

export function createServiceAnchorId(title: string, group: ServiceAnchorGroup = 'service'): string {
  const base = title
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return `${group}-${base}`;
}