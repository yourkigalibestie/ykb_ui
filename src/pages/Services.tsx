import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ServiceCard } from '../components/ServiceCard';
import { PriceGrid } from '../components/PriceGrid';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { openWhatsApp } from '../utils/whatsapp';
import { getFriendlyRequestError } from '../utils/friendlyErrors';
import { createServiceAnchorId } from '../utils/serviceAnchors';

type Language = {
  id: number;
  title: string;
  prices: Record<string, number>;
};

type StarterGuideCategoryGroup = 'APP' | 'INFRASTRUCTURE' | 'OTHERS';

type TranslationLanguage = 'en' | 'fr';

type StarterGuideCategoryTranslation = {
  language: TranslationLanguage;
  category: string;
  description: string | null;
  subcategories: string[] | null;
};

type StarterGuideCategory = {
  id: number;
  category: string;
  group?: StarterGuideCategoryGroup | null;
  subcategories: string[] | null;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  isStarterKit?: boolean;
  allowProviderRegistration?: boolean;
  translations?: StarterGuideCategoryTranslation[];
};

type ProviderServiceOffering = {
  name: string;
  price: string;
  description?: string;
};

type ProviderSummary = {
  id: string;
  businessName?: string | null;
  mainService?: string | null;
  serviceOfferings?: unknown;
  user?: {
    id?: string;
    name?: string;
  };
};

type ProviderApp = {
  id: string;
  appName: string;
  providerName: string;
  webAppUrl: string | null;
  playStoreUrl: string | null;
  appStoreUrl: string | null;
};

type ApiErrorResponse = {
  error?: {
    message?: unknown;
  };
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
const PHASE1_ENABLED = String(import.meta.env.VITE_PHASE1 ?? '').toLowerCase() !== 'true';

async function readApiErrorStatus(response: Response): Promise<number> {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    const message = data?.error?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return response.status;
    }
  } catch {
    // ignore
  }

  return response.status;
}

function normalizeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    // try with https prefix for plain domains
  }

  try {
    const withProtocol = new URL(`https://${trimmed}`);
    return withProtocol.toString();
  } catch {
    return null;
  }
}

function parseServiceOfferings(value: unknown): ProviderServiceOffering[] {
  if (!Array.isArray(value)) return [];

  const rows: ProviderServiceOffering[] = [];

  value.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const row = item as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    const price = typeof row.price === 'string' ? row.price.trim() : '';
    const description = typeof row.description === 'string' ? row.description.trim() : undefined;

    if (!name) return;
    rows.push({ name, price, description });
  });

  return rows;
}

export function Services() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState<StarterGuideCategory[]>([]);
  const [starterKitServices, setStarterKitServices] = useState<StarterGuideCategory[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingScript = document.querySelector('script[src="https://www.googletagmanager.com/gtag/js?id=G-5T7DTFNYP6"]');
    if (existingScript) return;

    const externalScript = document.createElement('script');
    externalScript.async = true;
    externalScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-5T7DTFNYP6';
    document.head.appendChild(externalScript);

    const inlineScript = document.createElement('script');
    inlineScript.text = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-5T7DTFNYP6');`;
    document.head.appendChild(inlineScript);

    return () => {
      document.head.removeChild(externalScript);
      document.head.removeChild(inlineScript);
    };
  }, []);


  const activeLanguage = useMemo<TranslationLanguage>(
    () => (i18n.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'),
    [i18n.language]
  );

  const getDisplayFields = (item: StarterGuideCategory) => {
    const translation = item.translations?.find((t) => t.language === activeLanguage);

    const category = translation?.category?.trim() || item.category;
    const description = translation?.description ?? item.description ?? '';

    return { category, description };
  };

  const getEnglishFields = (item: StarterGuideCategory) => {
    const translation = item.translations?.find((t) => t.language === 'en');

    const category = translation?.category?.trim() || item.category;
    const description = translation?.description ?? item.description ?? '';

    return { category, description };
  };

  const sectionLinks = [
    { id: 'all-services', label: t('services.allServices') },
    { id: 'translator', label: t('services.translator') },
    { id: 'apps', label: t('services.apps') },
  ];

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const [categoriesResult, starterKitResult, languagesResult, providersResult] = await Promise.allSettled([
        fetch(`${API_BASE}/starter-guide-categories?isStarterKit=false`),
        fetch(`${API_BASE}/starter-guide-categories?isStarterKit=true`),
        fetch(`${API_BASE}/languages`),
        fetch(`${API_BASE}/providers`),
      ]);

      if (categoriesResult.status !== 'fulfilled') {
        throw new Error(
          getFriendlyRequestError({
            error: categoriesResult.reason,
            action: 'load services',
          })
        );
      }

      const categoriesResponse = categoriesResult.value;
      if (!categoriesResponse.ok) {
        const status = await readApiErrorStatus(categoriesResponse);
        throw new Error(
          getFriendlyRequestError({
            status,
            action: 'load services',
          })
        );
      }

      const categoriesJson = (await categoriesResponse.json()) as
        | StarterGuideCategory[]
        | { categories?: StarterGuideCategory[] };
      const categoriesList = Array.isArray(categoriesJson)
        ? categoriesJson
        : Array.isArray(categoriesJson.categories)
          ? categoriesJson.categories
          : [];

      const servicesList = categoriesList.filter((category) => category.isStarterKit === false);

      let starterKitList: StarterGuideCategory[] = [];
      if (starterKitResult && starterKitResult.status === 'fulfilled' && starterKitResult.value.ok) {
        const starterKitJson = (await starterKitResult.value.json()) as
          | StarterGuideCategory[]
          | { categories?: StarterGuideCategory[] };
        const starterKitCategories = Array.isArray(starterKitJson)
          ? starterKitJson
          : Array.isArray(starterKitJson.categories)
            ? starterKitJson.categories
            : [];
        starterKitList = starterKitCategories.filter((category) => category.isStarterKit === true);
      }

      let languagesList: Language[] = [];
      if (languagesResult.status === 'fulfilled' && languagesResult.value.ok) {
        const languagesJson = (await languagesResult.value.json()) as { languages?: Language[] };
        languagesList = Array.isArray(languagesJson.languages) ? languagesJson.languages : [];
      }

      let providersList: ProviderSummary[] = [];
      if (providersResult.status === 'fulfilled' && providersResult.value.ok) {
        const providersJson = (await providersResult.value.json()) as { providers?: ProviderSummary[] };
        providersList = Array.isArray(providersJson.providers) ? providersJson.providers : [];
      }

      setServices(servicesList);
      setStarterKitServices(starterKitList);
      setLanguages(languagesList);
      setProviders(providersList);
      setStatus('ready');
    } catch (err) {
      if (err instanceof Error && err.message.trim().length > 0) {
        setError(err.message);
      } else {
        setError(getFriendlyRequestError({ error: err, action: 'load services' }));
      }
      setServices([]);
      setLanguages([]);
      setProviders([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (status !== 'ready' || !location.hash) return;

    const timer = window.setTimeout(() => {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.hash, status, services, starterKitServices, languages, providers]);

  const topServices = useMemo(() => services.slice(0, 11), [services]);

  const providerApps = useMemo(() => {
    const rows: ProviderApp[] = [];

    providers.forEach((provider) => {
      const offerings = parseServiceOfferings(provider.serviceOfferings);
      const appName = provider.mainService?.trim() || provider.businessName?.trim() || provider.user?.name?.trim() || 'Provider App';
      const providerName = provider.businessName?.trim() || provider.user?.name?.trim() || 'Service Provider';

      let webAppUrl: string | null = null;
      let playStoreUrl: string | null = null;
      let appStoreUrl: string | null = null;

      offerings.forEach((offering) => {
        const name = offering.name.toLowerCase();
        const link = normalizeHttpUrl(offering.description);
        if (!link) return;

        if (name.includes('web app')) {
          webAppUrl = link;
          return;
        }

        if (name.includes('play store')) {
          playStoreUrl = link;
          return;
        }

        if (name.includes('app store')) {
          appStoreUrl = link;
          return;
        }

        if (!webAppUrl) {
          webAppUrl = link;
        }
      });

      if (!webAppUrl && !playStoreUrl && !appStoreUrl) return;

      rows.push({
        id: provider.id,
        appName,
        providerName,
        webAppUrl,
        playStoreUrl,
        appStoreUrl,
      });
    });

    return rows;
  }, [providers]);

  // Show loading state with spinner while fetching
  if (status === 'loading' || status === 'idle') {
    return (
      <main className="pt-16 bg-white text-gray-900">
        <section className="min-h-[60vh] flex items-center justify-center bg-[#fdfbf7]">
          <LoadingSpinner size="lg" text="Loading services..." centered />
        </section>
      </main>
    );
  }

  // Show error state if something went wrong
  if (status === 'error') {
    return (
      <main className="pt-16 bg-white text-gray-900">
        <section className="min-h-[60vh] flex flex-col items-center justify-center bg-[#fdfbf7] px-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 border border-red-200 bg-red-50 flex items-center justify-center">
              <span className="text-2xl font-bold text-red-500">!</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-primary mb-2">Unable to load services</h2>
            <p className="text-sm text-textSecondary mb-6">{error ?? 'We could not load services right now. Please try again.'}</p>
            <button
              onClick={() => void load()}
              className="border border-secondary/25 bg-secondary px-5 py-2.5 font-semibold text-primary transition-all hover:shadow-lg text-sm"
            >
              Try again
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-16 bg-white text-gray-900">
      <section className="bg-[#fdfbf7] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-serif text-start font-bold text-primary mb-2">{t('services.pageTitle')}</h1>
            <p className="text-sm text-textSecondary max-w-3xl">
              {t('services.pageDescription')}
            </p>
          </div>

          <div className="sticky top-16 z-20 mb-6 border-b border-secondary/20 bg-white/95 py-2 backdrop-blur">
            <div className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto whitespace-nowrap text-xs font-semibold text-primary sm:text-sm">
              {sectionLinks.map((section, index) => (
                <span key={section.id} className="inline-flex items-center gap-2">
                  <a
                    href={`#${section.id}`}
                    className="transition-colors hover:text-secondary focus:outline-none focus-visible:text-secondary"
                  >
                    {section.label}
                  </a>
                  {index < sectionLinks.length - 1 ? <span className="text-textSecondary">|</span> : null}
                </span>
              ))}
              <span className="inline-flex items-center gap-2">
                <button
                  onClick={() => navigate('/guide')}
                  className="transition-colors hover:text-secondary focus:outline-none focus-visible:text-secondary"
                >
                  {t('services.starterGuide')}
                </button>
              </span>
            </div>
          </div>

          {/* ALL SERVICES SECTION */}
          <section
            id="all-services"
            className="scroll-mt-28 mb-8 rounded-xl border border-secondary/25 border-l-8 border-l-secondary bg-gradient-to-br from-secondary/10 via-white to-white p-4 sm:p-5 shadow-sm"
          >
            <div className="mb-4">
              <h2 className="text-xl font-bold text-primary">{t('services.ourCoreServices')}</h2>
            </div>
            <p className="mb-4 text-sm text-textSecondary">
              {t('services.coreServicesDescription')}
            </p>

            {topServices.length === 0 ? (
              <div className="border border-border bg-white p-4 text-sm text-textSecondary">
                No services available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {topServices.map((service, index) => {
                  const { category, description } = getDisplayFields(service);
                  const { category: englishTitle, description: englishDescription } = getEnglishFields(service);
                  const anchorId = createServiceAnchorId(englishTitle, 'service');

                  const canBrowseProviders = service.allowProviderRegistration === true;

                  const ctaText = PHASE1_ENABLED
                    ? 'Request service'
                    : canBrowseProviders
                      ? 'Browse service providers'
                      : 'Request service';

                  const onCta = PHASE1_ENABLED
                    ? () => navigate(`/request?service=${encodeURIComponent(englishTitle)}`)
                    : canBrowseProviders
                      ? () => navigate(`/service-providers?service=${encodeURIComponent(englishTitle)}`)
                      : () =>
                          openWhatsApp(
                            [
                              'Hello Your Kigali Bestie, I would like to request this service:',
                              `Service: ${englishTitle}`,
                              englishDescription ? `Description: ${englishDescription}` : null,
                            ]
                              .filter(Boolean)
                              .join('\n')
                          );

                  return (
                    <div key={service.id} id={anchorId} className="scroll-mt-28">
                      <ServiceCard
                        title={category}
                        description={description}
                        imageUrl={service.imageUrl}
                        count={index + 1}
                        ctaText={ctaText}
                        onCta={onCta}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* TRANSLATOR SECTION */}
          <section
            id="translator"
            className="scroll-mt-28 mb-8 rounded-xl border border-border border-l-8 border-l-primary bg-gradient-to-br from-primary/5 via-surface/60 to-white p-4 sm:p-5 shadow-sm"
          >
            <div className="mb-4">
              <div className="h-px w-12 bg-primary mb-3"></div>
              <h2 className="text-xl font-bold text-primary">{t('services.translatorBooking')}</h2>
            </div>
            <p className="mb-4 text-sm text-textSecondary">
              {t('services.translatorDescription')}
            </p>

            {languages.length === 0 ? (
              <div className="border border-border bg-white p-4 text-sm text-textSecondary">
                No translator languages are available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {languages.map((language) => {
                  return (
                    <article key={language.id} className="border border-secondary/25 bg-white p-5 transition-all hover:shadow-md">
                      <h3 className="text-base font-semibold text-primary">{language.title}</h3>
                      <p className="mt-2 text-xs text-textSecondary">Available pricing options</p>
                      <div className="mt-3">
                        <PriceGrid prices={language.prices} />
                      </div>

                      <button
                        onClick={() =>
                          openWhatsApp(
                            [
                              'Hello Your Kigali Bestie, I would like to book a translator.',
                              `Language: ${language.title}`,
                            ].join('\n')
                          )
                        }
                        className="mt-4 w-full border border-secondary bg-secondary px-4 py-2.5 font-semibold text-primary transition-all hover:shadow-lg text-sm"
                      >
                        <span>{t('services.bookTranslator')}</span>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* STARTER KIT SERVICES */}
          {starterKitServices.length > 0 && (
            <section
              id="starter-kit-services"
              className="scroll-mt-28 mb-8 rounded-xl border border-border border-l-8 border-l-secondary bg-gradient-to-br from-secondary/10 via-white to-white p-4 sm:p-5 shadow-sm"
            >
              <div className="mb-4">
                <div className="h-px w-12 bg-secondary mb-3"></div>
                <h2 className="text-xl font-bold text-primary">Starter Kit Services</h2>
              </div>
              <p className="mb-4 text-sm text-textSecondary">
                Helpful starter services for settling in quickly.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {starterKitServices.slice(0, 4).map((service, index) => {
                  const { category, description } = getDisplayFields(service);
                  const { category: englishTitle, description: englishDescription } = getEnglishFields(service);
                  const anchorId = createServiceAnchorId(englishTitle, 'starter-kit');

                  const canBrowseProviders = service.allowProviderRegistration === true;

                  const ctaText = PHASE1_ENABLED
                    ? t('services.requestService')
                    : canBrowseProviders
                      ? t('services.browseProviders')
                      : t('services.requestService');

                  const onCta = PHASE1_ENABLED
                    ? () => navigate(`/request?service=${encodeURIComponent(englishTitle)}`)
                    : canBrowseProviders
                      ? () => navigate(`/service-providers?service=${encodeURIComponent(englishTitle)}`)
                      : () =>
                          openWhatsApp(
                            [
                              'Hello Your Kigali Bestie, I would like to request this service:',
                              `Service: ${englishTitle}`,
                              englishDescription ? `Description: ${englishDescription}` : null,
                            ]
                              .filter(Boolean)
                              .join('\n')
                          );

                  return (
                    <div key={service.id} id={anchorId} className="scroll-mt-28">
                      <ServiceCard
                        title={category}
                        description={description}
                        imageUrl={service.imageUrl}
                        count={index + 1}
                        ctaText={ctaText}
                        onCta={onCta}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 text-center">
                <button
                  onClick={() => navigate('/guide')}
                  className="inline-flex items-center gap-2 border border-secondary/25 bg-white px-5 py-2.5 font-semibold text-primary transition-all hover:bg-secondary hover:text-white text-sm"
                >
                  <span>{t('services.learnMore')}</span>
                  <span>({starterKitServices.length})</span>
                </button>
              </div>
            </section>
          )}

          {/* APPS SECTION */}
          <section
            id="apps"
            className="scroll-mt-28 mb-8 rounded-xl border border-border border-l-8 border-l-accent bg-gradient-to-br from-surface via-white to-secondary/5 p-4 sm:p-5 shadow-sm"
          >
            <div className="mb-4">
              <div className="h-px w-12 bg-accent mb-3"></div>
              <h2 className="text-xl font-bold text-primary">{t('services.localProviderApps')}</h2>
            </div>
            <p className="mb-4 text-sm text-textSecondary">
              {t('services.appsDescription')}
            </p>

            {providerApps.length === 0 ? (
              <div className="border border-border bg-white p-4 text-sm text-textSecondary">
                No provider app links are published yet. Providers can add Web app, Play Store, and App Store links during registration.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {providerApps.map((app) => (
                  <article key={app.id} className="border border-secondary/25 bg-white p-5 transition-all hover:shadow-md">
                    <h3 className="text-base font-semibold text-primary">{app.appName}</h3>
                    <p className="mt-1 text-xs text-textSecondary">Provider: {app.providerName}</p>

                    <div className="mt-4 space-y-3">
                      {app.webAppUrl && (
                        <div className="border border-border p-3 hover:bg-secondary/5 transition-colors">
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Web App</span>
                          </div>
                          <div className="flex items-center gap-2 bg-surface px-2 py-1">
                            <a
                              href={app.webAppUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 text-xs text-textSecondary hover:text-secondary truncate"
                              title={app.webAppUrl}
                            >
                              {app.webAppUrl}
                            </a>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleCopyLink(app.webAppUrl!)}
                                className="px-2 py-1 text-xs hover:bg-secondary/20 rounded transition-colors"
                              >
                                {copiedLink === app.webAppUrl ? 'Copied' : 'Copy'}
                              </button>
                              <a
                                href={app.webAppUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 text-xs hover:bg-secondary/20 rounded transition-colors"
                              >
                                Open
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {app.playStoreUrl && (
                        <div className="border border-border p-3 hover:bg-secondary/5 transition-colors">
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Play Store</span>
                          </div>
                          <div className="flex items-center gap-2 bg-surface px-2 py-1">
                            <a
                              href={app.playStoreUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 text-xs text-textSecondary hover:text-secondary truncate"
                              title={app.playStoreUrl}
                            >
                              {app.playStoreUrl}
                            </a>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleCopyLink(app.playStoreUrl!)}
                                className="px-2 py-1 text-xs hover:bg-secondary/20 rounded transition-colors"
                              >
                                {copiedLink === app.playStoreUrl ? 'Copied' : 'Copy'}
                              </button>
                              <a
                                href={app.playStoreUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 text-xs hover:bg-secondary/20 rounded transition-colors"
                              >
                                Open
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {app.appStoreUrl && (
                        <div className="border border-border p-3 hover:bg-secondary/5 transition-colors">
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">App Store</span>
                          </div>
                          <div className="flex items-center gap-2 bg-surface px-2 py-1">
                            <a
                              href={app.appStoreUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 text-xs text-textSecondary hover:text-secondary truncate"
                              title={app.appStoreUrl}
                            >
                              {app.appStoreUrl}
                            </a>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleCopyLink(app.appStoreUrl!)}
                                className="px-2 py-1 text-xs hover:bg-secondary/20 rounded transition-colors"
                              >
                                {copiedLink === app.appStoreUrl ? 'Copied' : 'Copy'}
                              </button>
                              <a
                                href={app.appStoreUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 text-xs hover:bg-secondary/20 rounded transition-colors"
                              >
                                Open
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* WHAT WE DO + HELP SECTION */}
          <div className="mb-8 grid gap-4 rounded-xl border border-secondary/25 bg-white p-5 shadow-sm sm:grid-cols-[1.6fr_1fr]">
            <div>
              <div className="h-px w-8 bg-secondary mb-3"></div>
              <h2 className="text-lg font-semibold text-primary mb-2">{t('services.whatWeDo')}</h2>
              <p className="mb-4 text-sm text-textSecondary">
                {t('services.whatWeDoDescription')}
              </p>
              <ul className="space-y-2 text-sm text-textSecondary">
                <li>• {t('services.customConcierge')}</li>
                <li>• {t('services.starterGuideService')}</li>
                <li>• {t('services.hardToFind')}</li>
              </ul>
            </div>
            <div className="rounded-xl bg-secondary/5 p-5">
              <div className="h-px w-8 bg-secondary mb-3"></div>
              <h3 className="text-base font-semibold text-primary mb-2">{t('services.needHelpNow')}</h3>
              <p className="mb-4 text-sm text-textSecondary">
                {t('services.needHelpDescription')}
              </p>
              <button
                onClick={() => openWhatsApp('Hello Your Kigali Bestie, I need help booking a custom service or provider.')}
                className="w-full border border-secondary bg-secondary px-4 py-2.5 font-semibold text-primary transition-all hover:shadow-lg text-sm mb-3"
              >
                <span>{t('services.helpMeBook')}</span>
              </button>
              <button
                onClick={() => navigate('/request')}
                className="w-full border border-secondary/25 bg-white px-4 py-2.5 font-semibold text-primary transition-all hover:bg-secondary hover:text-white text-sm"
              >
                <span>Request Service</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}