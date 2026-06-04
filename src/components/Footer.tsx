import { useEffect, useMemo, useState } from 'react';
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
            {/* Background decorative elements - subtle */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-secondary/5 blur-3xl"></div>
                <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-white/5 blur-3xl"></div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12 relative z-10">
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
                    
                    {/* Brand Section */}
                    <div className="lg:col-span-4 space-y-5">
                        <div className="inline-block border border-secondary/20 bg-white/5 px-3 py-1">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                                {t('footer.badge')}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                                {t('footer.title')}
                            </h3>
                            <p className="mt-3 max-w-md text-xs leading-relaxed text-white/70">
                                {t('footer.description')}
                            </p>
                        </div>
                        <div className="pt-2">
                            <div className="h-px w-12 bg-secondary/30"></div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2">
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                            {t('footer.quickLinks')}
                        </h4>
                        <ul className="space-y-1">
                            {quickLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="group flex items-center justify-between border-b border-white/5 py-2 text-xs text-white/70 transition-all hover:border-white/15 hover:text-white"
                                    >
                                        <span>{link.label}</span>
                                        <span className="text-secondary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5">
                                            →
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="lg:col-span-3">
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                            {t('footer.services')}
                        </h4>
                        <ul className="space-y-1">
                            {services.slice(0, MAX_SERVICE_LINKS).map((item) => (
                                <li key={`service-${item.id}`}>
                                    <Link
                                        to={toServiceLink(item)}
                                        className="group flex items-start justify-between gap-3 border-b border-white/5 py-2 text-xs text-white/70 transition-all hover:border-white/15 hover:text-white"
                                    >
                                        <span className="leading-snug line-clamp-1">{getDisplayCategory(item)}</span>
                                        <span className="text-secondary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0">
                                            →
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {starterKitServices.length > 0 && (
                            <div className="mt-5 border-t border-white/10 pt-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">{t('footer.starterKit')}</p>
                                <ul className="mt-2 space-y-1">
                                    {starterKitServices.slice(0, MAX_STARTER_KIT_LINKS).map((item) => (
                                        <li key={`starter-${item.id}`}>
                                            <Link
                                                to={toServiceLink(item)}
                                                className="group flex items-center justify-between border-b border-white/5 py-1.5 text-xs text-white/60 transition-all hover:border-white/15 hover:text-white"
                                            >
                                                <span className="leading-snug line-clamp-1">{getDisplayCategory(item)}</span>
                                                <span className="text-secondary opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0">
                                                    →
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Contact & Social */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Contact */}
                        <div>
                            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                                {t('footer.contactUs')}
                            </h4>
                            <div className="space-y-3">
                                <a
                                    href="tel:+250798891543"
                                    className="group flex items-center gap-3 border-b border-white/5 py-2 transition-all hover:border-white/15"
                                >
                                    <div className="w-8">
                                        <span className="text-xs font-mono text-secondary/70">+250</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t('footer.call')}</p>
                                        <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">798 891 543</p>
                                    </div>
                                </a>
                                <a
                                    href="mailto:yourkigalibestie@gmail.com"
                                    className="group flex items-center gap-3 border-b border-white/5 py-2 transition-all hover:border-white/15"
                                >
                                    <div className="w-8">
                                        <span className="text-xs text-secondary/70">@</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t('footer.email')}</p>
                                        <p className="text-xs text-white/70 group-hover:text-white transition-colors break-all">
                                            yourkigalibestie@gmail.com
                                        </p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                                {t('footer.followUs')}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                                <a
                                    href="https://www.instagram.com/kigali_bespoke_concierge?igsh=YXpnb3pwMGk5dGx4"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group border border-white/10 bg-white/5 px-3 py-2 text-center transition-all hover:border-secondary/30 hover:bg-secondary/10 hover:-translate-y-0.5"
                                >
                                    <p className="text-xs font-medium text-white/80 group-hover:text-white">Instagram</p>
                                    <p className="text-[10px] text-white/40 group-hover:text-secondary/70 mt-0.5">@kigali_bespoke</p>
                                </a>
                                <a
                                    href="https://www.tiktok.com/@kigalibespokeconcierge?_r=1&_t=ZS-96RHkX5x0BJ"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group border border-white/10 bg-white/5 px-3 py-2 text-center transition-all hover:border-secondary/30 hover:bg-secondary/10 hover:-translate-y-0.5"
                                >
                                    <p className="text-xs font-medium text-white/80 group-hover:text-white">TikTok</p>
                                    <p className="text-[10px] text-white/40 group-hover:text-secondary/70 mt-0.5">@kigalibespoke</p>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 pt-6 border-t border-white/10">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-[11px] text-white/40">
                            © {currentYear} {t('footer.copyright')}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-white/40">
                            <Link to="/privacy" className="hover:text-white/70 transition-colors">{t('footer.privacy')}</Link>
                            <span className="h-0.5 w-0.5 rounded-full bg-white/20"></span>
                            <Link to="/terms" className="hover:text-white/70 transition-colors">{t('footer.terms')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}