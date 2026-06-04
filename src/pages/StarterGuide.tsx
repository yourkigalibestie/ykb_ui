import { useNavigate } from 'react-router-dom';
import { openWhatsApp } from '../utils/whatsapp';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getBackendAuthHeaders, API_BASE } from '../utils/backendAuth';
import { createServiceAnchorId } from '../utils/serviceAnchors';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getFriendlyRequestError } from '../utils/friendlyErrors';

interface GuideCardProps {
    title: string;
    items: string[];
}

interface StarterService {
    id: number;
    category: string;
    description?: string | null;
    imageUrl?: string | null;
    subcategories?: string[] | null;
    isStarterKit?: boolean;
    allowProviderRegistration?: boolean;
    translations?: Array<{
        language: 'en' | 'fr';
        category: string;
        description: string | null;
        subcategories: string[] | null;
    }>;
}

function GuideCard({ title, items }: GuideCardProps) {
    return (
        <div className="border border-secondary/20 bg-white p-3 rounded-md transition-all hover:shadow-sm">
            <div className="mb-2">
                <div className="h-px w-6 bg-secondary mb-2"></div>
                <h3 className="text-sm font-serif font-semibold text-primary">
                    {title}
                </h3>
            </div>

            <ul className="space-y-1">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary font-bold text-xs">—</span>
                        <span className="text-textSecondary text-xs leading-snug">
                            {item}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function StarterGuide() {
    const { i18n, t } = useTranslation();
    const [services, setServices] = useState<StarterService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const activeLanguage = useMemo<'en' | 'fr'>(
        () => (i18n.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'),
        [i18n.language]
    );

    const getDisplayFields = (item: StarterService) => {
        const translation = item.translations?.find((t) => t.language === activeLanguage);
        const category = translation?.category?.trim() || item.category;
        const description = translation?.description ?? item.description ?? '';
        const subcategories = translation?.subcategories ?? item.subcategories ?? null;
        return { category, description, subcategories };
    };

    const getEnglishFields = (item: StarterService) => {
        const translation = item.translations?.find((t) => t.language === 'en');
        const category = translation?.category?.trim() || item.category;
        const description = translation?.description ?? item.description ?? '';
        return { category, description };
    };

    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = getBackendAuthHeaders();
            const url = `${API_BASE}/starter-guide-categories?isStarterKit=true`;

            const response = await fetch(url, { headers });

            if (response.ok) {
                const data = (await response.json()) as StarterService[] | { categories?: StarterService[] };
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data.categories)
                        ? data.categories
                        : [];
                setServices(list);
            } else {
                setServices([]);
                setError(
                    getFriendlyRequestError({
                        status: response.status,
                        action: 'load starter kit services',
                    })
                );
            }
        } catch (error) {
            setServices([]);
            setError(getFriendlyRequestError({ error, action: 'load starter kit services' }));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchServices();
        }, 0);

        return () => window.clearTimeout(timer);
    }, [fetchServices]);

    const navigate = useNavigate();
    const PHASE1_ENABLED = String(import.meta.env.VITE_PHASE1 ?? '').toLowerCase() !== 'true';

    return (
        <main className="pt-16 bg-white text-gray-900">
            <section className="border-b border-border bg-white py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="max-w-2xl">
                        <div className="h-px w-8 bg-secondary mb-3"></div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">{t('starterGuidePage.kicker')}</p>
                        <h1 className="text-2xl font-serif font-semibold text-primary md:text-3xl">{t('starterGuidePage.title')}</h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-textSecondary">
                            {t('starterGuidePage.description')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-8 bg-[#fdfbf7]">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Registered Services Section with Loading State */}
                    {error ? (
                        <div className="mb-8 border border-border bg-white p-5">
                            <div className="text-sm text-red-600 mb-3">{error}</div>
                            <button onClick={() => void fetchServices()} className="border border-secondary/25 bg-secondary px-5 py-2.5 font-semibold text-primary transition-all hover:shadow-lg text-sm">
                                {t('starterGuidePage.tryAgain')}
                            </button>
                        </div>
                    ) : null}

                    {/* Loading State - Show only spinner, no partial content */}
                    {loading && (
                        <div className="py-12">
                            <LoadingSpinner size="lg" text={t('starterGuidePage.loadingStarterKitServices')} centered />
                        </div>
                    )}

                    {/* Loaded Content - Only shown when loading is false */}
                    {!loading && (
                        <>
                            {services.length > 0 && (
                                <div className="mb-12">
                                    <h2 className="text-xl font-serif font-bold text-primary mb-5">{t('starterGuidePage.starterKitServicesTitle')}</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {services.map((service) => (
                                            <div key={service.id} className="border border-secondary/25 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-1">
                                                {service.imageUrl && (
                                                    <img
                                                        src={service.imageUrl}
                                                        alt={service.category}
                                                        className="w-full h-32 object-cover mb-4"
                                                    />
                                                )}

                                                {(() => {
                                                    const { category, description, subcategories } = getDisplayFields(service);
                                                    const { category: englishTitle } = getEnglishFields(service);

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
                                                                        description ? `Description: ${description}` : null,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join('\n')
                                                                );

                                                    const anchorId = createServiceAnchorId(englishTitle, 'starter-kit');

                                                    return (
                                                        <div id={anchorId} className="scroll-mt-28">
                                                            <div className="h-px w-8 bg-secondary mb-3"></div>
                                                            <h3 className="text-base font-serif font-semibold text-primary mb-2">{category}</h3>
                                                            {description ? (
                                                                <p className="text-textSecondary text-xs mb-3 leading-relaxed">{description}</p>
                                                            ) : null}
                                                            {subcategories && subcategories.length > 0 && (
                                                                <div className="space-y-2 mt-3 pt-3 border-t border-secondary/10">
                                                                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">{t('starterGuidePage.categoriesLabel')}</p>
                                                                    <ul className="space-y-1">
                                                                        {subcategories.map((sub, idx) => (
                                                                            <li key={idx} className="flex items-start gap-2">
                                                                                <span className="text-primary font-bold text-xs">—</span>
                                                                                <span className="text-textSecondary text-xs">{sub}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={onCta}
                                                                className="mt-4 inline-flex items-center justify-center gap-2 border border-secondary bg-secondary px-3 py-2 text-sm font-semibold text-primary transition-all hover:shadow-lg w-full"
                                                            >
                                                                <span>{ctaText}</span>
                                                            </button>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {services.length === 0 && !error && (
                                <div className="mb-12 border border-border bg-white p-4">
                                    <p className="text-sm text-textSecondary">{t('starterGuidePage.noStarterKitServices')}</p>
                                </div>
                            )}

                            {/* First 24 Hours */}
                            <div className="mb-12">
                                <h2 className="text-xl font-serif font-bold text-primary mb-5">{t('starterGuidePage.first24HoursTitle')}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <GuideCard
                                        title={t('starterGuidePage.cards.mobileSim.title')}
                                        items={[
                                            t('starterGuidePage.cards.mobileSim.items.0'),
                                            t('starterGuidePage.cards.mobileSim.items.1'),
                                            t('starterGuidePage.cards.mobileSim.items.2'),
                                            t('starterGuidePage.cards.mobileSim.items.3')
                                        ]}
                                    />
                                    <GuideCard
                                        title={t('starterGuidePage.cards.mobileMoney.title')}
                                        items={[
                                            t('starterGuidePage.cards.mobileMoney.items.0'),
                                            t('starterGuidePage.cards.mobileMoney.items.1'),
                                            t('starterGuidePage.cards.mobileMoney.items.2'),
                                            t('starterGuidePage.cards.mobileMoney.items.3')
                                        ]}
                                    />
                                    <GuideCard
                                        title={t('starterGuidePage.cards.currencyExchange.title')}
                                        items={[
                                            t('starterGuidePage.cards.currencyExchange.items.0'),
                                            t('starterGuidePage.cards.currencyExchange.items.1'),
                                            t('starterGuidePage.cards.currencyExchange.items.2'),
                                            t('starterGuidePage.cards.currencyExchange.items.3')
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Emergencies */}
                            <div className="mb-12">
                                <h2 className="text-xl font-serif font-bold text-primary mb-5">{t('starterGuidePage.emergencyTitle')}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <GuideCard
                                        title={t('starterGuidePage.cards.medical.title')}
                                        items={[
                                            t('starterGuidePage.cards.medical.items.0'),
                                            t('starterGuidePage.cards.medical.items.1'),
                                            t('starterGuidePage.cards.medical.items.2'),
                                            t('starterGuidePage.cards.medical.items.3')
                                        ]}
                                    />
                                    <GuideCard
                                        title={t('starterGuidePage.cards.policeSafety.title')}
                                        items={[
                                            t('starterGuidePage.cards.policeSafety.items.0'),
                                            t('starterGuidePage.cards.policeSafety.items.1'),
                                            t('starterGuidePage.cards.policeSafety.items.2'),
                                            t('starterGuidePage.cards.policeSafety.items.3')
                                        ]}
                                    />
                                    <GuideCard
                                        title={t('starterGuidePage.cards.ambulance.title')}
                                        items={[
                                            t('starterGuidePage.cards.ambulance.items.0'),
                                            t('starterGuidePage.cards.ambulance.items.1'),
                                            t('starterGuidePage.cards.ambulance.items.2'),
                                            t('starterGuidePage.cards.ambulance.items.3')
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Apps */}
                            <div className="mb-12">
                                <h2 className="text-xl font-serif font-bold text-primary mb-5">{t('starterGuidePage.appsTitle')}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <GuideCard
                                        title={t('starterGuidePage.cards.foodDelivery.title')}
                                        items={[
                                            t('starterGuidePage.cards.foodDelivery.items.0'),
                                            t('starterGuidePage.cards.foodDelivery.items.1'),
                                            t('starterGuidePage.cards.foodDelivery.items.2'),
                                            t('starterGuidePage.cards.foodDelivery.items.3')
                                        ]}
                                    />
                                    <GuideCard
                                        title={t('starterGuidePage.cards.transportation.title')}
                                        items={[
                                            t('starterGuidePage.cards.transportation.items.0'),
                                            t('starterGuidePage.cards.transportation.items.1'),
                                            t('starterGuidePage.cards.transportation.items.2'),
                                            t('starterGuidePage.cards.transportation.items.3')
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* WiFi */}
                            <div className="mb-12">
                                <h2 className="text-xl font-serif font-bold text-primary mb-5">{t('starterGuidePage.internetTitle')}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <GuideCard
                                        title={t('starterGuidePage.cards.mobileInternet.title')}
                                        items={[
                                            t('starterGuidePage.cards.mobileInternet.items.0'),
                                            t('starterGuidePage.cards.mobileInternet.items.1'),
                                            t('starterGuidePage.cards.mobileInternet.items.2'),
                                            t('starterGuidePage.cards.mobileInternet.items.3')
                                        ]}
                                    />
                                    <GuideCard
                                        title={t('starterGuidePage.cards.homeWifi.title')}
                                        items={[
                                            t('starterGuidePage.cards.homeWifi.items.0'),
                                            t('starterGuidePage.cards.homeWifi.items.1'),
                                            t('starterGuidePage.cards.homeWifi.items.2'),
                                            t('starterGuidePage.cards.homeWifi.items.3')
                                        ]}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}