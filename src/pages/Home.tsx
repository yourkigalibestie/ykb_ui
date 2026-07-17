import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openWhatsApp } from '../utils/whatsapp';
import { API_BASE } from '../utils/backendAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useEffect, useState, useRef } from 'react';

// Import all images
import appartmentImage from '../assets/images/appartment visting.webp';
import movingImage from '../assets/images/moving help.jpg';
import PersonalAssistantImage from '../assets/images/personalassistant.jpeg';
import errandRunningImage from '../assets/images/errandRunning.png';
import constructionSupervision from '../assets/images/constractionsupervision.png';
import eventplanningImage from '../assets/images/eventplanning.jpeg';
import airportpickupImage from '../assets/images/airportpickup.jpeg';
import HouseSittingImage from '../assets/images/housesitting.jpeg';


import bg_image1 from "../assets/bg_images/bg_1.jpeg"
import bg_image2 from "../assets/bg_images/bg_2.jpeg"
import bg_image3 from "../assets/bg_images/bg_3.jpeg"
import bg_image4 from "../assets/bg_images/bg_4.jpeg"


const backgroundImages = [
  bg_image1,
  bg_image2,
  bg_image3,
  bg_image4,
];

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

interface GuideCardProps {
    title: string;
    items: string[];
}

export function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const [featuredServices, setFeaturedServices] = useState<StarterGuideCategory[]>([]);
  const [featuredStatus, setFeaturedStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const activeLanguage = (i18n.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en') as TranslationLanguage;

  // Below is the Google tag for this account.
  // Copy and paste it in the code of every page of your website, immediately after the <head> element.
  // Don’t add more than one Google tag to each page.
  //
  // <!-- Google tag (gtag.js) -->
  // <script async src="https://www.googletagmanager.com/gtag/js?id=G-5T7DTFNYP6"></script>
  // <script>
  //   window.dataLayer = window.dataLayer || [];
  //   function gtag(){dataLayer.push(arguments);}
  //   gtag('js', new Date());
  //   gtag('config', 'G-5T7DTFNYP6');
  // </script>
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible((prev) => ({ ...prev, [entry.target.id]: entry.isIntersecting }));
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [featuredServices.length, activeLanguage]);

  useEffect(() => {
    let mounted = true;

    const loadFeatured = async () => {
      setFeaturedStatus('loading');

      try {
        const res = await fetch(`${API_BASE}/starter-guide-categories?isStarterKit=false`);
        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const json = (await res.json()) as StarterGuideCategory[] | { categories?: StarterGuideCategory[] };
        const list = Array.isArray(json) ? json : Array.isArray(json.categories) ? json.categories : [];
        const nonStarter = list.filter((item) => item.isStarterKit === false);

        if (!mounted) return;
        setFeaturedServices(nonStarter.slice(0, 3));
        setFeaturedStatus('ready');
      } catch {
        if (!mounted) return;
        setFeaturedServices([]);
        setFeaturedStatus('error');
      }
    };

    loadFeatured();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCTA = () => {
    openWhatsApp('Hello, I would like to request a custom service');
  };

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

  const PHASE1_ENABLED = String(import.meta.env.VITE_PHASE1 ?? '').toLowerCase() === 'true';

  const handleFeaturedClick = (service: StarterGuideCategory) => {
    const { category: englishTitle, description: englishDescription } = getEnglishFields(service);

    if (PHASE1_ENABLED) {
      navigate(`/request?service=${encodeURIComponent(englishTitle)}`);
      return;
    }

    if (service.allowProviderRegistration === true) {
      navigate(`/service-providers?service=${encodeURIComponent(englishTitle)}`);
      return;
    }

    openWhatsApp(
      [
        'Hello Your Kigali Bestie, I would like to request this service:',
        `Service: ${englishTitle}`,
        englishDescription ? `Description: ${englishDescription}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    );
  };

function GuideCard({ title, items }: GuideCardProps) {
    return (
        <div className="border border-secondary/25 bg-white p-3 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className="mb-2">
                <div className="h-px w-6 bg-secondary mb-2"></div>
                <h3 className="text-sm font-serif font-semibold text-primary leading-tight">{title}</h3>
            </div>
            <ul className="space-y-1">
                {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                       
                        <span className="text-textSecondary text-xs leading-relaxed">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}


  const personalServices = [
    { title: t('home.personalServices.0.title'), description: t('home.personalServices.0.description'), image: PersonalAssistantImage, size: 'large' },
    { title: t('home.personalServices.1.title'), description: t('home.personalServices.1.description'), image: constructionSupervision, size: 'small' },
    { title: t('home.personalServices.2.title'), description: t('home.personalServices.2.description'), image: HouseSittingImage, size: 'medium' },
    { title: t('home.personalServices.3.title'), description: t('home.personalServices.3.description'), image: errandRunningImage, size: 'small' },
    { title: t('home.personalServices.4.title'), description: t('home.personalServices.4.description'), image: eventplanningImage, size: 'large' },
    { title: t('home.personalServices.5.title'), description: t('home.personalServices.5.description'), image: airportpickupImage, size: 'small' },
    { title: t('home.personalServices.6.title'), description: t('home.personalServices.6.description'), image: movingImage, size: 'small' },
    { title: t('home.personalServices.7.title'), description: t('home.personalServices.7.description'), image: appartmentImage, size: 'medium' },
    { title: t('home.personalServices.8.title'), description: t('home.personalServices.8.description'), image: movingImage, size: 'small' },
  ];

  const whyChooseUs = [
    { title: t('home.whyChooseUsItems.localExpertise'), description: t('home.whyChooseUsItems.localExpertiseDesc') },
    { title: t('home.whyChooseUsItems.timeSaving'), description: t('home.whyChooseUsItems.timeSavingDesc') },
    { title: t('home.whyChooseUsItems.trustedSupport'), description: t('home.whyChooseUsItems.trustedSupportDesc') },
  ];

  const stats = [
    { value: '500+', label: t('home.stats.happyClients') },
    { value: '98%', label: t('home.stats.satisfactionRate') },
    { value: '24/7', label: t('home.stats.supportAvailable') },
    { value: '100%', label: t('home.stats.reliableService') },
  ];

  const howItWorksSteps = [
    { number: '01', title: t('home.stepChoose', 'Choose service'), desc: t('home.stepChooseDesc', 'Pick what you need: airport, relocation, bookings, and more.') },
    { number: '02', title: t('home.stepBook', 'Book online'), desc: t('home.stepBookDesc', 'Select a time and submit your request.') },
    { number: '03', title: t('home.stepPay', 'Pay accordingly'), desc: t('home.stepPayDesc', 'Transparent pricing for one-time and membership requests.') },
    { number: '04', title: t('home.stepWeHandle', 'We handle the rest'), desc: t('home.stepWeHandleDesc', 'Our team coordinates everything with trusted local support.') },
  ];

  const trustItems = [
    { title: t('home.vettedProviders', 'Vetted providers'), desc: t('home.vettedProvidersDesc', 'We connect you to trusted professionals and services across Kigali.') },
    { title: t('home.accountability', 'Accountability'), desc: t('home.accountabilityDesc', 'Clear communication and follow-through from request to delivery.') },
    { title: t('home.localExpertise', 'Local expertise'), desc: t('home.localExpertiseDesc', 'We know the streets, the best offices, and the right people to call.') },
    { title: t('home.personalizedHelp', 'Personalized assistance'), desc: t('home.personalizedHelpDesc', 'You get a real Bestie—human support, tailored to you.') },
  ];

  const personalizedItems = [
    { title: t('home.prioritizeYou', 'Tailored to you'), desc: t('home.prioritizeYouDesc', 'We adapt around your lifestyle, schedule, and preferences.') },
    { title: t('home.requestAny', 'Request anything'), desc: t('home.requestAnyDesc', 'If it\'s not listed, we still help you build the plan.') },
    { title: t('home.fastResponse', 'Fast coordination'), desc: t('home.fastResponseDesc', 'We connect you with the right provider and follow through.') },
  ];

  const starterKitItems = [
    { title: t('home.starterKitSimCards', 'SIM cards'), desc: t('home.starterKitSimCardsDesc', 'How to get an MTN/Airtel SIM and set up data.') },
    { title: t('home.starterKitHospitals', 'Hospitals'), desc: t('home.starterKitHospitalsDesc', 'Trusted clinics & emergency options near you.') },
    { title: t('home.starterKitMobileMoney', 'Mobile money'), desc: t('home.starterKitMobileMoneyDesc', 'Momo setup and safe payment tips.') },
  ];

  return (
    <main className="pt-16 bg-white text-gray-900">
      {/* HERO SECTION */}
      <section ref={heroRef} className="relative min-h-[90vh] overflow-hidden bg-[#fdfbf7]">
        <div className="absolute inset-0 z-0">
          {backgroundImages.map((img, idx) => (
            <div
              key={idx}
              className="absolute inset-0 transition-all duration-1000 ease-in-out"
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: idx === currentBgIndex ? 1 : 0,
                transform: `scale(${idx === currentBgIndex ? 1 : 1.05})`,
                filter: 'brightness(0.4)',
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-primary/80" />
        </div>

        <div className="relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-4 py-12 text-center">
          <div className={`animate-on-scroll transition-all duration-700 ${isVisible.hero ? 'visible translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} id="hero">
            <h1 className="max-w-4xl text-3xl font-serif font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
              {t('home.subtitle')}
              <span className="block text-secondary mt-2">
                {t('home.title')}
              </span>
            </h1>
      
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button onClick={handleCTA} className="group inline-flex items-center justify-center gap-2 border border-secondary/25 bg-secondary px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:shadow-lg hover:scale-105">
                <span>{t('home.getStarted')}</span>
              </button>
              <button onClick={() => navigate('/guide')} className="inline-flex items-center justify-center gap-2 border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-white/20">
                <span>{t('navigation.guide')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="relative -mt-6 z-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-px border border-secondary/25 bg-white shadow-sm md:grid-cols-4">
            {stats.map((stat, idx) => (
              <div key={idx} className={`p-4 text-center ${idx < stats.length - 1 ? 'border-r border-border' : ''}`}>
                <div className="text-xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-xs text-textSecondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-12 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 text-start">
            <h2 className="text-2xl font-serif font-bold text-primary md:text-3xl">{t('home.whyChooseUs')}</h2>
            <p className="mt-2 text-sm text-textSecondary">{t('home.description')}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {whyChooseUs.map((item, idx) => (
              <div key={idx} className={`animate-on-scroll border border-secondary/25 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${isVisible[`why-${idx}`] ? 'visible' : ''}`} id={`why-${idx}`}>
                <div className="mb-3 h-px w-12 bg-secondary"></div>
                <h3 className="mb-2 text-base font-semibold text-primary">{item.title}</h3>
                <p className="text-xs text-textSecondary leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


<section className="py-8 bg-white">
    <div className="max-w-7xl mx-auto px-4">
        {/* First 24 Hours */}
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-secondary"></div>
                <h2 className="text-base font-serif font-bold text-primary uppercase tracking-wide">{t('starterGuidePage.first24HoursTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-secondary"></div>
                <h2 className="text-base font-serif font-bold text-primary uppercase tracking-wide">{t('starterGuidePage.emergencyTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-secondary"></div>
                <h2 className="text-base font-serif font-bold text-primary uppercase tracking-wide">{t('starterGuidePage.appsTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-secondary"></div>
                <h2 className="text-base font-serif font-bold text-primary uppercase tracking-wide">{t('starterGuidePage.internetTitle')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
    </div>
</section>

      {/* PERSONAL SERVICES SECTION */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 text-start">
            <div className="inline-block border border-secondary/25 bg-secondary/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{t('home.whatWeOffer')}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary md:text-3xl mb-2">{t('services.title')}</h2>
            <p className="max-w-2xl text-sm text-textSecondary">{t('services.description')}</p>
          </div>

          <div className="space-y-8">
            {/* Layout 1: Diagonal Split */}
            <div className={`animate-on-scroll group relative overflow-hidden border border-secondary/25 bg-white shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${isVisible['personal-0'] ? 'visible' : ''}`} id="personal-0">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                <div className="lg:col-span-3 relative">
                  <div className="h-64 lg:h-80 overflow-hidden">
                    <img src={personalServices[0].image} alt={personalServices[0].title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
                <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-center relative">
                  <div className="absolute top-6 right-6 w-12 h-12 bg-secondary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-secondary">01</span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-serif font-bold text-primary mb-3">{personalServices[0].title}</h3>
                  <p className="text-textSecondary text-sm leading-relaxed mb-4">{personalServices[0].description}</p>
                  <div className="w-8 h-px bg-secondary"></div>
                </div>
              </div>
            </div>

            {/* Layout 2: Overlapping Cards */}
            <div className={`animate-on-scroll relative ${isVisible['personal-1'] ? 'visible' : ''}`} id="personal-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-br from-primary/10 to-secondary/10 blur-xl"></div>
                  <div className="relative border border-secondary/25 bg-white shadow-xl overflow-hidden">
                    <div className="h-56 overflow-hidden">
                      <img src={personalServices[1].image} alt={personalServices[1].title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5">
                      <div className="inline-block border border-primary/25 bg-primary/10 px-2 py-0.5 mb-3">
                        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">{t('home.construction')}</span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-primary mb-2">{personalServices[1].title}</h3>
                      <p className="text-textSecondary text-xs leading-relaxed">{personalServices[1].description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="border border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5 p-5">
                    <div className="w-10 h-10 bg-secondary/20 flex items-center justify-center mb-3">
                      <span className="text-base font-bold text-secondary">02</span>
                    </div>
                    <h4 className="text-base font-semibold text-primary mb-1">{personalServices[2].title}</h4>
                    <p className="text-xs text-textSecondary leading-relaxed">{personalServices[2].description}</p>
                  </div>
                  <div className="border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-5">
                    <div className="w-10 h-10 bg-primary/20 flex items-center justify-center mb-3">
                      <span className="text-base font-bold text-primary">03</span>
                    </div>
                    <h4 className="text-base font-semibold text-primary mb-1">{personalServices[3].title}</h4>
                    <p className="text-xs text-textSecondary leading-relaxed">{personalServices[3].description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout 3: Masonry Grid */}
            <div className={`animate-on-scroll grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isVisible['personal-2'] ? 'visible' : ''}`} id="personal-2">
              <div className="md:col-span-2 lg:col-span-1 row-span-2 border border-secondary/25 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="h-56 overflow-hidden">
                  <img src={personalServices[4].image} alt={personalServices[4].title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">04</span>
                    </div>
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider">{t('home.premiumService')}</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-primary mb-1">{personalServices[4].title}</h3>
                  <p className="text-xs text-textSecondary leading-relaxed">{personalServices[4].description}</p>
                </div>
              </div>
              <div className="border border-secondary/25 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="h-40 overflow-hidden">
                  <img src={personalServices[5].image} alt={personalServices[5].title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-serif font-bold text-primary mb-1">{personalServices[5].title}</h3>
                  <p className="text-xs text-textSecondary leading-relaxed">{personalServices[5].description}</p>
                </div>
              </div>
              <div className="border border-secondary/25 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="h-40 overflow-hidden">
                  <img src={personalServices[6].image} alt={personalServices[6].title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-serif font-bold text-primary mb-1">{personalServices[6].title}</h3>
                  <p className="text-xs text-textSecondary leading-relaxed">{personalServices[6].description}</p>
                </div>
              </div>
            </div>

            {/* Layout 4: Feature List with Images */}
            <div className={`animate-on-scroll border border-secondary/25 bg-gradient-to-br from-primary/5 to-secondary/5 p-6 lg:p-8 ${isVisible['personal-3'] ? 'visible' : ''}`} id="personal-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div className="inline-block border border-white/25 bg-white/80 px-3 py-1 mb-2">
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">{t('home.dailySupport')}</span>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-serif font-bold text-primary mb-4">{t('home.essentialServices')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-secondary">05</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary text-sm mb-0.5">{personalServices[7].title}</h4>
                        <p className="text-xs text-textSecondary leading-relaxed">{personalServices[7].description}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-primary">06</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary text-sm mb-0.5">{personalServices[8].title}</h4>
                        <p className="text-xs text-textSecondary leading-relaxed">{personalServices[8].description}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-secondary/25 shadow-lg overflow-hidden">
                      <div className="h-56 overflow-hidden">
                        <img src={personalServices[2].image} alt={personalServices[7].title} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="border border-secondary/25 shadow-lg overflow-hidden">
                        <div className="h-56 overflow-hidden">
                          <img src={personalServices[8].image} alt={personalServices[8].title} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout 5: Compact Cards Grid */}
            <div className={`animate-on-scroll ${isVisible['personal-4'] ? 'visible' : ''}`} id="personal-4">
              <div className="text-start mb-5">
                <h3 className="text-xl font-serif font-bold text-primary mb-1">{t('home.quickServices')}</h3>
                <p className="text-xs text-textSecondary">{t('home.quickServicesDesc')}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[personalServices[0], personalServices[1], personalServices[2], personalServices[3]].map((service, idx) => (
                  <div key={idx} className="group relative overflow-hidden border border-secondary/25 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="aspect-square overflow-hidden">
                      <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h4 className="text-white font-semibold text-xs mb-0.5">{service.title}</h4>
                      <p className="text-white/80 text-[10px] line-clamp-2 leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 text-start">
            <div className="inline-block border border-secondary/25 bg-secondary/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{t('home.featured')}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary md:text-3xl">{t('home.featuredServices')}</h2>
            <p className="mt-2 text-sm text-textSecondary">{t('home.featuredDesc')}</p>
          </div>

          {featuredStatus === 'loading' ? (
            <div className="py-4">
              <LoadingSpinner size="lg" text="Loading services…" />
            </div>
          ) : featuredServices.length === 0 ? (
            <div className="border border-border bg-white p-4 text-sm text-textSecondary">
              No featured services available.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {featuredServices.map((service, idx) => {
                const { category, description } = getDisplayFields(service);
                return (
                  <div
                    key={service.id}
                    className={`animate-on-scroll border border-secondary/25 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 hover:border-secondary/40 ${
                      isVisible[`featured-${idx}`] ? 'visible' : ''
                    }`}
                    id={`featured-${idx}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-secondary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-secondary">{idx + 1}</span>
                      </div>
                      <div className="h-px w-8 bg-secondary"></div>
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-primary">{category}</h3>
                    <p className="text-xs text-textSecondary mb-3 leading-relaxed">{description}</p>
                    <button
                      onClick={() => handleFeaturedClick(service)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-accent transition-colors border-b border-secondary/30 hover:border-accent"
                    >
                      {t('home.learnMore')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6">
            <button 
              onClick={() => navigate('/services')} 
              className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary px-5 py-2.5 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105 text-sm"
            >
              {t('home.viewAllServices')}
            </button>
          </div>
        </div>
      </section>

      {/* CUSTOM SERVICE REQUEST */}
      <section className="py-12 bg-primary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-block border border-secondary/25 bg-secondary/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{t('home.custom')}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white">{t('home.dontSeeWhatYouNeed')}</h2>
            <p className="mt-2 text-sm text-white/80">{t('home.customDesc')}</p>
            <div className="mt-6 space-y-3">
              <button 
                onClick={() => openWhatsApp('Hello, I have a custom service request.')}
                className="w-full inline-flex items-center justify-center gap-2 border border-secondary bg-secondary px-6 py-3 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105 text-sm"
              >
                <span>{t('home.requestCustomService')}</span>
              </button>
              <div className="text-center">
                <p className="text-white/60 text-xs">{t('home.orReachUs')}: <span className="font-semibold">0798891543</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-12 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 text-start">
            <div className="inline-block border border-secondary/25 bg-secondary/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{t('home.howItWorks', 'How it works')}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary md:text-3xl">{t('home.howItWorksTitle', 'Simple steps to get your Bestie')}</h2>
            <p className="mt-2 text-sm text-textSecondary">{t('home.howItWorksDesc', 'Choose a service, book online, pay accordingly, and we handle the rest.')}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {howItWorksSteps.map((step) => (
              <div key={step.number} className="border border-secondary/25 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-1">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center border border-secondary/20 bg-secondary/10 text-sm font-bold text-secondary">
                    {step.number}
                  </div>
                  <h3 className="text-base font-semibold text-primary">{step.title}</h3>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY TRUST US */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 text-start">
            <div className="inline-block border border-secondary/25 bg-secondary/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{t('home.whyTrustUs', 'Why Trust Us?')}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary md:text-3xl">{t('home.whyTrustUsTitle', 'Local expertise. Accountability. Vetted providers.')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {trustItems.map((item, idx) => (
              <div key={idx} className="border border-secondary/25 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-1">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px w-8 bg-secondary"></div>
                  <h3 className="text-base font-semibold text-primary">{item.title}</h3>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONALIZED REQUESTS */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 text-start">
            <div className="inline-block border border-secondary/25 bg-secondary/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{t('home.personalizedRequests', 'Personalized requests')}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary md:text-3xl">{t('home.personalizedRequestsTitle', 'Request anything we design the solution.')}</h2>
            <p className="mt-2 text-sm text-textSecondary">{t('home.personalizedRequestsDesc', 'This is what separates us from a normal service business. Tell us what you need, and we make it happen.')}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {personalizedItems.map((item, idx) => (
              <div key={idx} className="border border-secondary/25 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-1">
                <div className="mb-3 h-px w-12 bg-secondary"></div>
                <h3 className="mb-2 text-base font-semibold text-primary">{item.title}</h3>
                <p className="text-xs text-textSecondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-textSecondary">{t('home.requestAnythingHint', 'Tap below to start a personalized request on WhatsApp.')}</p>
            <button
              onClick={() => openWhatsApp('Hello, I want to request something personalized')}
              className="inline-flex items-center justify-center gap-2 border border-secondary/25 bg-secondary px-5 py-2.5 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105 text-sm"
            >
              {t('home.startRequest', 'Request anything')}
            </button>
          </div>
        </div>
      </section>

      {/* RWANDA STARTER KIT */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 text-start">
            <div className="inline-block border border-secondary/25 bg-secondary/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{t('home.rwandaStarterKit', 'Rwanda Starter Kit')}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary md:text-3xl">{t('home.rwandaStarterKitTitle', 'Get settled fast SIM, hospitals, and essentials')}</h2>
            <p className="mt-2 text-sm text-textSecondary">{t('home.rwandaStarterKitDesc', 'A mini guide and curated services for your first days in Rwanda.')}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {starterKitItems.map((item) => (
              <div key={item.title} className="border border-secondary/25 bg-white p-5 transition-all hover:shadow-md hover:-translate-y-1">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px w-8 bg-secondary"></div>
                  <h3 className="text-base font-semibold text-primary">{item.title}</h3>
                </div>
                <p className="text-xs text-textSecondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={() => navigate('/guide')}
              className="inline-flex items-center justify-center gap-2 border border-secondary/25 bg-secondary px-5 py-2.5 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105 text-sm"
            >
              {t('home.exploreStarterKit', 'Explore Rwanda Starter Kit')}
            </button>
          </div>
        </div>
      </section>

      {/* MISSION + FINAL CTA */}
      <section className="py-12 bg-[#fdfbf7]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8 text-start">
            <div className="inline-block border border-secondary/25 bg-secondary/10 px-3 py-1 mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">{t('home.aboutUs')}</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-primary md:text-3xl">{t('home.ourPurpose')}</h2>
            <p className="mt-2 text-textSecondary text-sm">{t('home.purposeDesc')}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="border border-secondary/25 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-primary/20 flex items-center justify-center">
                  <span className="text-base font-bold text-primary">M</span>
                </div>
                <h3 className="text-base font-serif font-bold text-primary">{t('home.ourMission')}</h3>
              </div>
              <p className="text-textSecondary text-sm leading-relaxed">{t('home.missionDesc')}</p>
            </div>
            <div className="border border-secondary/25 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-secondary/20 flex items-center justify-center">
                  <span className="text-base font-bold text-secondary">V</span>
                </div>
                <h3 className="text-base font-serif font-bold text-primary">{t('home.ourVision')}</h3>
              </div>
              <p className="text-textSecondary text-sm leading-relaxed">{t('home.visionDesc')}</p>
            </div>
          </div>

          <div className="border border-secondary/25 bg-secondary/10 p-6 md:p-8 hover:bg-secondary/15 transition-colors">
            <div className="text-start mb-6">
              <h2 className="text-xl font-serif font-bold text-primary md:text-2xl">{t('home.readyToStart')}</h2>
              <p className="mt-2 max-w-md text-textSecondary text-sm">{t('home.readyDesc')}</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={handleCTA} className="border border-secondary bg-secondary px-5 py-2.5 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105 text-sm">
                  <span>{t('home.requestServiceNow')}</span>
                </button>
                <button onClick={() => navigate('/services')} className="border border-secondary/25 bg-white px-5 py-2.5 font-semibold text-primary transition-all hover:bg-secondary hover:text-white text-sm">
                  <span>{t('home.browseServices')}</span>
                </button>
              </div>
              <div className="text-center pt-3 border-t border-secondary/20">
                <p className="text-xs text-textSecondary">
                  <span className="font-medium">{t('home.needImmediateHelp')}</span> {t('home.callOrWhatsapp')}: <span className="font-bold text-primary">0798891543</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}