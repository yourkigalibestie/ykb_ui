import { MapPin, AlertCircle, Smartphone, Wifi, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { openWhatsApp } from '../utils/whatsapp';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getBackendAuthHeaders, API_BASE } from '../utils/backendAuth';
import { createServiceAnchorId } from '../utils/serviceAnchors';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getFriendlyRequestError } from '../utils/friendlyErrors';

interface GuideCardProps {
    icon: React.ReactNode;
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

function GuideCard({ icon, title, items }: GuideCardProps) {
    return (
        <div className="ykb-card ykb-card-hover">
            <div className="flex items-center space-x-3 mb-4">
                <div className="text-primary">{icon}</div>
                <h3 className="text-xl font-serif font-semibold text-primary">{title}</h3>
            </div>
            <ul className="space-y-2">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                        <span className="text-primary font-bold">•</span>
                        <span className="text-textSecondary leading-relaxed">{item}</span>
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
                    console.log('Raw starter guide categories response:', data);
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
        <div className="ykb-container">
          <div className="max-w-2xl">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">{t('starterGuidePage.kicker')}</p>
                        <h1 className="text-3xl font-semibold text-primary md:text-4xl">{t('starterGuidePage.title')}</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
                                {t('starterGuidePage.description')}
            </p>
          </div>
        </div>
      </section>

            {/* Content Sections */}
            <section className="ykb-section px-4 sm:px-6 lg:px-8 bg-dark-light">
                <div className="ykb-container">


                                        {/* Registered Services */}
                    {error ? (
                        <div className="mb-8 ykb-card">
                            <div className="ykb-alert ykb-alert-error">{error}</div>
                            <button onClick={() => void fetchServices()} className="mt-3 ykb-button-outline">
                                {t('starterGuidePage.tryAgain')}
                            </button>
                        </div>
                    ) : null}

                    {!loading && services.length > 0 && (
                        <div className="mb-16">
                            <h2 className="text-3xl font-serif font-bold text-primary mb-8">{t('starterGuidePage.starterKitServicesTitle')}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map((service) => (
                                    <div key={service.id} className="ykb-card ykb-card-hover">
                                        {service.imageUrl && (
                                            <img
                                                src={service.imageUrl}
                                                alt={service.category}
                                                className="w-full h-40 object-cover rounded-lg mb-4"
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
                                                    <h3 className="text-xl font-serif font-semibold text-primary mb-2">{category}</h3>
                                                    {description ? (
                                                        <p className="text-textSecondary text-sm mb-4">{description}</p>
                                                    ) : null}
                                                    {subcategories && subcategories.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold text-primary">{t('starterGuidePage.categoriesLabel')}</p>
                                                <ul className="space-y-1">
                                                    {subcategories.map((sub, idx) => (
                                                        <li key={idx} className="flex items-start space-x-2">
                                                            <span className="text-primary font-bold">•</span>
                                                            <span className="text-textSecondary text-sm">{sub}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                                    )}
                                                    <button
                                                        onClick={onCta}
                                                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-white shadow-gold transition-colors duration-200 hover:bg-[#c49b2f] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white w-full justify-center"
                                                    >
                                                        <span>{ctaText}</span>
                                                        <ArrowRight className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && services.length === 0 && !error && (
                        <div className="mb-16 p-4 rounded border border-border bg-white">
                            <p className="text-textSecondary">{t('starterGuidePage.noStarterKitServices')}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="mb-16">
                            <LoadingSpinner size="lg" text={t('starterGuidePage.loadingStarterKitServices')} />
                        </div>
                    )}
                    
                    {/* First 24 Hours */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-primary mb-8">{t('starterGuidePage.first24HoursTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <GuideCard
                                icon={<Smartphone className="w-6 h-6" />}
                                title={t('starterGuidePage.cards.mobileSim.title')}
                                items={[
                                    t('starterGuidePage.cards.mobileSim.items.0'),
                                    t('starterGuidePage.cards.mobileSim.items.1'),
                                    t('starterGuidePage.cards.mobileSim.items.2'),
                                    t('starterGuidePage.cards.mobileSim.items.3')
                                ]}
                            />
                            <GuideCard
                                icon={<MapPin className="w-6 h-6" />}
                                title={t('starterGuidePage.cards.mobileMoney.title')}
                                items={[
                                    t('starterGuidePage.cards.mobileMoney.items.0'),
                                    t('starterGuidePage.cards.mobileMoney.items.1'),
                                    t('starterGuidePage.cards.mobileMoney.items.2'),
                                    t('starterGuidePage.cards.mobileMoney.items.3')
                                ]}
                            />
                            <GuideCard
                                icon={<MapPin className="w-6 h-6" />}
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
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-primary mb-8">{t('starterGuidePage.emergencyTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GuideCard
                                icon={<AlertCircle className="w-6 h-6" />}
                                title={t('starterGuidePage.cards.medical.title')}
                                items={[
                                    t('starterGuidePage.cards.medical.items.0'),
                                    t('starterGuidePage.cards.medical.items.1'),
                                    t('starterGuidePage.cards.medical.items.2'),
                                    t('starterGuidePage.cards.medical.items.3')
                                ]}
                            />
                            <GuideCard
                                icon={<AlertCircle className="w-6 h-6" />}
                                title={t('starterGuidePage.cards.policeSafety.title')}
                                items={[
                                    t('starterGuidePage.cards.policeSafety.items.0'),
                                    t('starterGuidePage.cards.policeSafety.items.1'),
                                    t('starterGuidePage.cards.policeSafety.items.2'),
                                    t('starterGuidePage.cards.policeSafety.items.3')
                                ]}
                            />
                            <GuideCard
                                icon={<AlertCircle className="w-6 h-6" />}
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
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-primary mb-8">{t('starterGuidePage.appsTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GuideCard
                                icon={<Smartphone className="w-6 h-6" />}
                                title={t('starterGuidePage.cards.foodDelivery.title')}
                                items={[
                                    t('starterGuidePage.cards.foodDelivery.items.0'),
                                    t('starterGuidePage.cards.foodDelivery.items.1'),
                                    t('starterGuidePage.cards.foodDelivery.items.2'),
                                    t('starterGuidePage.cards.foodDelivery.items.3')
                                ]}
                            />
                            <GuideCard
                                icon={<Smartphone className="w-6 h-6" />}
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
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-primary mb-8">{t('starterGuidePage.internetTitle')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GuideCard
                                icon={<Wifi className="w-6 h-6" />}
                                title={t('starterGuidePage.cards.mobileInternet.title')}
                                items={[
                                    t('starterGuidePage.cards.mobileInternet.items.0'),
                                    t('starterGuidePage.cards.mobileInternet.items.1'),
                                    t('starterGuidePage.cards.mobileInternet.items.2'),
                                    t('starterGuidePage.cards.mobileInternet.items.3')
                                ]}
                            />
                            <GuideCard
                                icon={<Wifi className="w-6 h-6" />}
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



                </div>
            </section>
        </main>
    );
}
