export type PublicService = {
  id: number;
  title: string;
  description: string;
  group?: StarterGuideCategoryGroup | null;
  allowProviderRegistration?: boolean;
};

type StarterGuideCategoryGroup = 'APP' | 'INFRASTRUCTURE' | 'OTHERS';

type StarterGuideCategory = {
  id: number;
  category: string;
  group?: StarterGuideCategoryGroup | null;
  subcategories: string[] | null;
  allowProviderRegistration?: boolean;
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

function isStarterGuideCategory(value: unknown): value is StarterGuideCategory {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'number' &&
    typeof candidate.category === 'string' &&
    (candidate.group === undefined ||
      candidate.group === null ||
      candidate.group === 'APP' ||
      candidate.group === 'INFRASTRUCTURE' ||
      candidate.group === 'OTHERS') &&
    (candidate.subcategories === null ||
      candidate.subcategories === undefined ||
      Array.isArray(candidate.subcategories)) &&
    (candidate.allowProviderRegistration === undefined ||
      typeof candidate.allowProviderRegistration === 'boolean')
  );
}

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function groupLabel(group?: StarterGuideCategoryGroup | null): string {
  if (group === 'APP') return 'apps';
  if (group === 'INFRASTRUCTURE') return 'infrastructure';
  return 'other services';
}

function buildCategoryDescription(category: StarterGuideCategory): string {
  const subcategories = Array.isArray(category.subcategories)
    ? category.subcategories.map((item) => item.trim()).filter((item) => item.length > 0)
    : [];

  if (subcategories.length > 0) {
    return `Explore ${normalizeTitle(category.category)} and its related options in ${groupLabel(category.group)}.`;
  }

  return `Explore ${normalizeTitle(category.category)} services in ${groupLabel(category.group)}.`;
}

function buildSubcategoryDescription(category: string, subcategory: string): string {
  return `Explore ${normalizeTitle(subcategory)} services under ${normalizeTitle(category)}.`;
}

function toNegativeId(seed: number): number {
  return -Math.abs(seed);
}

function mergeServices(
  starterGuideCategories: StarterGuideCategory[]
): PublicService[] {
  const merged: PublicService[] = [];

  const addService = (service: PublicService) => {
    const title = normalizeTitle(service.title);
    if (!title) return;
    merged.push({ ...service, title });
  };

  // Add starter guide categories that allow provider registration
  starterGuideCategories
    .filter((category) => category.allowProviderRegistration === true)
    .forEach((category) => {
      const categoryTitle = normalizeTitle(category.category);
      addService({
        id: toNegativeId(category.id * 1000 + 1),
        title: categoryTitle,
        description: buildCategoryDescription(category),
        group: category.group ?? null,
        allowProviderRegistration: category.allowProviderRegistration,
      });

      const subcategories = Array.isArray(category.subcategories) ? category.subcategories : [];
      subcategories.forEach((subcategory, index) => {
        const cleanSubcategory = normalizeTitle(subcategory);
        if (!cleanSubcategory) return;

        addService({
          id: toNegativeId(category.id * 1000 + index + 2),
          title: cleanSubcategory,
          description: buildSubcategoryDescription(categoryTitle, cleanSubcategory),
          group: category.group ?? null,
          allowProviderRegistration: category.allowProviderRegistration,
        });
      });
    });

  return merged;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchPublicServices(): Promise<PublicService[]> {
  const starterGuideResult = await fetchJson<unknown>(`${API_BASE}/starter-guide-categories`);

  const rawStarterGuide = starterGuideResult;
  let starterGuideCategories: unknown[] = [];
  if (rawStarterGuide) {
    if (Array.isArray(rawStarterGuide)) {
      starterGuideCategories = rawStarterGuide;
    } else {
      const cats = (rawStarterGuide as Record<string, unknown>).categories;
      if (Array.isArray(cats)) starterGuideCategories = cats;
    }
  }
  starterGuideCategories = starterGuideCategories.filter(isStarterGuideCategory);

  return mergeServices(starterGuideCategories as StarterGuideCategory[]);
}
