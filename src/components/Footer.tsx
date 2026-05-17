
import { useEffect, useMemo, useState } from 'react';
import { Phone, Mail, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../utils/backendAuth';
import { createServiceAnchorId } from '../utils/serviceAnchors';

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
    description?: string | null;
    isStarterKit?: boolean;
    allowProviderRegistration?: boolean;
    translations?: StarterGuideCategoryTranslation[];
};

type ApiErrorResponse = {
    error?: {
        message?: unknown;
    };
};

const MAX_SERVICE_LINKS = 4;
const MAX_STARTER_KIT_LINKS = 3;

async function readApiErrorMessage(response: Response): Promise<string> {
    try {
        const data = (await response.json()) as ApiErrorResponse;
        const message = data?.error?.message;
        if (typeof message === 'string' && message.trim().length > 0) return message;
    } catch {
        // ignore
    }
    return `Request failed (${response.status})`;
}

export function Footer() {
    const { i18n, t } = useTranslation();
    const currentYear = new Date().getFullYear();

    const [services, setServices] = useState<StarterGuideCategory[]>([]);
    const [starterKitServices, setStarterKitServices] = useState<StarterGuideCategory[]>([]);

    const activeLanguage = useMemo<TranslationLanguage>(
        () => (i18n.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'),
        [i18n.language]
    );

    const quickLinks = [
        { path: '/', label: t('common.home') },
        { path: '/services', label: t('common.services') },
        { path: '/guide', label: t('navigation.guide') },
        { path: '/about', label: t('common.about') },
        { path: '/contact', label: t('common.contact') },
    ];

    const getDisplayCategory = (item: StarterGuideCategory) => {
        const translation = item.translations?.find((t) => t.language === activeLanguage);
        return translation?.category?.trim() || item.category;
    };

    const getEnglishCategory = (item: StarterGuideCategory) => {
        const translation = item.translations?.find((t) => t.language === 'en');
        return translation?.category?.trim() || item.category;
    };

    const toServiceLink = (item: StarterGuideCategory) => {
        const englishTitle = getEnglishCategory(item);
        const anchorId = createServiceAnchorId(englishTitle, item.isStarterKit ? 'starter-kit' : 'service');
        return `/services#${anchorId}`;
    };

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const [servicesRes, starterRes] = await Promise.all([
                    fetch(`${API_BASE}/starter-guide-categories?isStarterKit=false`),
                    fetch(`${API_BASE}/starter-guide-categories?isStarterKit=true`),
                ]);

                if (!servicesRes.ok) throw new Error(await readApiErrorMessage(servicesRes));
                if (!starterRes.ok) throw new Error(await readApiErrorMessage(starterRes));

                const servicesJson = (await servicesRes.json()) as StarterGuideCategory[] | { categories?: StarterGuideCategory[] };
                const starterJson = (await starterRes.json()) as StarterGuideCategory[] | { categories?: StarterGuideCategory[] };

                const servicesList = Array.isArray(servicesJson)
                    ? servicesJson
                    : Array.isArray(servicesJson.categories)
                        ? servicesJson.categories
                        : [];
                const starterList = Array.isArray(starterJson)
                    ? starterJson
                    : Array.isArray(starterJson.categories)
                        ? starterJson.categories
                        : [];

                if (!mounted) return;
                setServices(servicesList.filter((s) => s.isStarterKit === false));
                setStarterKitServices(starterList.filter((s) => s.isStarterKit === true));
            } catch {
                if (!mounted) return;
                setServices([]);
                setStarterKitServices([]);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [activeLanguage]);


    return (
        <footer className="relative overflow-hidden border-t border-white/10 bg-[#07111f] text-white">
            <div className="absolute inset-0">
                <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-secondary/10 blur-3xl"></div>
                <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl"></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16 relative z-10">
                <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-secondary">
                            {t('footer.badge')}
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
                                {t('footer.title')}
                            </h3>
                            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
                                {t('footer.description')}
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-secondary">
                            {t('footer.quickLinks')}
                        </h4>
                        <ul className="space-y-2">
                            {quickLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="group flex items-center justify-between border-b border-white/10 py-2.5 text-sm text-white/78 transition-colors hover:border-white/20 hover:text-white"
                                    >
                                        <span>{link.label}</span>
                                        <ChevronRight className="h-4 w-4 text-secondary opacity-70 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-3">
                        <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-secondary">
                            {t('footer.services')}
                        </h4>
                        <ul className="space-y-2">
                            {services.slice(0, MAX_SERVICE_LINKS).map((item) => (
                                <li key={`service-${item.id}`}>
                                    <Link
                                        to={toServiceLink(item)}
                                        className="group flex items-start justify-between gap-3 border-b border-white/10 py-2.5 text-sm text-white/78 transition-colors hover:border-white/20 hover:text-white"
                                    >
                                        <span className="leading-snug">{getDisplayCategory(item)}</span>
                                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-secondary opacity-70 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {starterKitServices.length > 0 ? (
                            <div className="mt-6 border-t border-white/10 pt-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">{t('footer.starterKit')}</p>
                                <ul className="mt-3 space-y-2">
                                    {starterKitServices.slice(0, MAX_STARTER_KIT_LINKS).map((item) => (
                                        <li key={`starter-${item.id}`}>
                                            <Link
                                                to={toServiceLink(item)}
                                                className="group flex items-center justify-between border-b border-white/10 py-2 text-sm text-white/75 transition-colors hover:border-white/20 hover:text-white"
                                            >
                                                <span className="leading-snug">{getDisplayCategory(item)}</span>
                                                <ChevronRight className="h-4 w-4 shrink-0 text-secondary opacity-70 transition-transform group-hover:translate-x-1" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>

                    <div className="lg:col-span-3 space-y-8">
                        <div>
                            <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-secondary">
                                {t('footer.contactUs')}
                            </h4>
                            <div className="space-y-3">
                                <a
                                    href="tel:+250798891543"
                                    className="flex items-center gap-3 py-2 text-white/80 transition-colors hover:text-white"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/15">
                                        <Phone className="h-4 w-4 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">{t('footer.call')}</p>
                                        <p className="text-sm">+250 798 891 543</p>
                                    </div>
                                </a>
                                <a
                                    href="mailto:yourkigalibestie@gmail.com"
                                    className="flex items-center gap-3 py-2 text-white/80 transition-colors hover:text-white"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/15">
                                        <Mail className="h-4 w-4 text-secondary" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">{t('footer.email')}</p>
                                        <p className="text-sm">yourkigalibestie@gmail.com</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-secondary">
                                {t('footer.followUs')}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <a
                                    href="https://www.instagram.com/kigali_bespoke_concierge?igsh=YXpnb3pwMGk5dGx4"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col items-center gap-2 py-2 text-center transition-transform hover:-translate-y-0.5"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/15 transition-transform group-hover:scale-105">
                                        <svg className="h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-white">{t('footer.instagram')}</p>
                                </a>
                                <a
                                    href="https://www.tiktok.com/@kigalibespokeconcierge?_r=1&_t=ZS-96RHkX5x0BJ"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex flex-col items-center gap-2 py-2 text-center transition-transform hover:-translate-y-0.5"
                                >
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/15 transition-transform group-hover:scale-105">
                                        <svg className="h-5 w-5 text-secondary" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-white">{t('footer.tiktok')}</p>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-white/10 pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-white/55">
                            &copy; {currentYear} {t('footer.copyright')}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-white/55">
                            <Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
                            <span className="h-1 w-1 rounded-full bg-white/25"></span>
                            <Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
