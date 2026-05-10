import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Clock, Shield, BookOpen, Sparkles, BadgeCheck, Handshake, CreditCard, ClipboardList, HeartHandshake } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { openWhatsApp } from '../utils/whatsapp';

import { fetchPublicServices, type PublicService } from '../data/registrationServices';
import { services as fallbackServices } from '../data/services';
import { useEffect, useState, useRef } from 'react';
// Import all images
import appartmentImage from '../assets/images/appartment visting.webp';
import foodImage from '../assets/images/food.jpg';
import movingImage from '../assets/images/moving help.jpg';
import clinicImage from '../assets/images/clinic image.jpg';
import foodAppImage from '../assets/images/food delivering app.webp';
import cleaningImage from '../assets/images/cleaning.jpg';
import receptionistImage from '../assets/images/receptionist calling.webp';

// Background scroll images
const backgroundImages = [
  appartmentImage,
  foodImage,
  movingImage,
  clinicImage,
  foodAppImage,
  cleaningImage,
  receptionistImage,
];

export function Home() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
    const [publicServices, setPublicServices] = useState<PublicService[]>([]);
    const [currentBgIndex, setCurrentBgIndex] = useState(0);
    const heroRef = useRef<HTMLDivElement>(null);

    // Auto-scrolling background effect
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
    }, []);

    useEffect(() => {
        let mounted = true;

        const loadServices = async () => {
            try {
                const mergedServices = await fetchPublicServices();
                if (!mounted) return;
                setPublicServices(mergedServices);
            } catch {
                if (!mounted) return;
                setPublicServices([]);
            }
        };

        loadServices();

        return () => {
            mounted = false;
        };
    }, []);

    const handleCTA = () => {
        openWhatsApp('Hello, I would like to request a custom service');
    };

    const handleBookService = (serviceName: string) => {
        openWhatsApp(`Hello, I would like to book: ${serviceName}`);
    };

    const featuredServices = (publicServices.length > 0 ? publicServices : fallbackServices).slice(0, 3);

    // Personal Services data with images
    const personalServices = [
        { title: t('home.personalServices.0.title'), description: t('home.personalServices.0.description'), image: receptionistImage, size: 'large' },
        { title: t('home.personalServices.1.title'), description: t('home.personalServices.1.description'), image: appartmentImage, size: 'small' },
        { title: t('home.personalServices.2.title'), description: t('home.personalServices.2.description'), image: cleaningImage, size: 'medium' },
        { title: t('home.personalServices.3.title'), description: t('home.personalServices.3.description'), image: foodImage, size: 'small' },
        { title: t('home.personalServices.4.title'), description: t('home.personalServices.4.description'), image: foodAppImage, size: 'medium' },
        { title: t('home.personalServices.5.title'), description: t('home.personalServices.5.description'), image: foodImage, size: 'large' },
        { title: t('home.personalServices.6.title'), description: t('home.personalServices.6.description'), image: receptionistImage, size: 'small' },
        { title: t('home.personalServices.7.title'), description: t('home.personalServices.7.description'), image: movingImage, size: 'small' },
        { title: t('home.personalServices.8.title'), description: t('home.personalServices.8.description'), image: appartmentImage, size: 'medium' },
        { title: t('home.personalServices.9.title'), description: t('home.personalServices.9.description'), image: movingImage, size: 'small' },
    ];


    const whyChooseUs = [
        { icon: MapPin, title: t('home.whyChooseUsItems.localExpertise'), description: t('home.whyChooseUsItems.localExpertiseDesc') },
        { icon: Clock, title: t('home.whyChooseUsItems.timeSaving'), description: t('home.whyChooseUsItems.timeSavingDesc') },
        { icon: Shield, title: t('home.whyChooseUsItems.trustedSupport'), description: t('home.whyChooseUsItems.trustedSupportDesc') },
    ];

    const stats = [
        { value: '500+', label: t('home.stats.happyClients') },
        { value: '98%', label: t('home.stats.satisfactionRate') },
        { value: '24/7', label: t('home.stats.supportAvailable') },
        { value: '100%', label: t('home.stats.reliableService') },
    ];

    return (
        <main className="pt-16 bg-white text-gray-900">
            {/* HERO SECTION with Auto-Scrolling Image Background */}
            <section ref={heroRef} className="relative min-h-screen overflow-hidden bg-[#fdfbf7]">
                {/* Auto-scrolling background images */}
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
                    <div className="absolute inset-0 bg-linear-to-br from-primary/80 via-primary/60 to-primary/80" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
                    <div className={`animate-on-scroll transition-all duration-700 ${isVisible.hero ? 'visible translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} id="hero">


                        <h1 className="max-w-4xl text-4xl font-serif font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                            {t('home.subtitle')}
                            <span className="block text-secondary">
                                {t('home.title')}
                            </span>
                        </h1>

                        <p className="mx-auto mt-6 max-w-2xl text-base text-white md:text-lg">
                            {t('home.description')}
                        </p>

                        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                            <button onClick={handleCTA} className="group inline-flex items-center gap-2 border border-secondary/25 bg-secondary px-6 py-3 text-sm font-semibold text-primary transition-all hover:shadow-lg hover:scale-105">
                                <span>{t('home.getStarted')}</span>
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </button>
                            <button onClick={() => navigate('/guide')} className="inline-flex items-center gap-2 border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-white/20">
                                <span>{t('navigation.guide')}</span>
                                <BookOpen className="h-4 w-4" />
                            </button>
                        </div>

                                            </div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="relative -mt-10 z-20 px-4">
                <div className="ykb-container">
                    <div className="grid grid-cols-2 gap-3 border border-secondary/25 bg-white p-5 shadow-sm md:grid-cols-4">
                        {stats.map((stat, idx) => (
                            <div key={stat.label} className={`p-6 text-center ${idx < stats.length - 1 ? 'border-r border-border' : ''}`}>
                                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                                <div className="mt-2 text-sm text-textSecondary">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* WHY CHOOSE US */}
            <section className="ykb-section bg-[#fdfbf7] py-16">
                <div className="ykb-container">
                    <div className="mb-12 text-start">
                        <h2 className="text-3xl font-serif font-bold text-primary md:text-4xl">{t('home.whyChooseUs')}</h2>
                        <p className="mt-3 text-sm text-textSecondary">{t('home.description')}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {whyChooseUs.map((item, idx) => (
                            <div key={item.title} className={`animate-on-scroll border border-secondary/25 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ${isVisible[`why-${idx}`] ? 'visible' : ''}`} id={`why-${idx}`}>
                                <div className="mb-4 flex h-12 w-12 items-center justify-center bg-secondary/10">
                                    <item.icon className="h-6 w-6 text-secondary" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-primary">{item.title}</h3>
                                <p className="text-sm text-textSecondary">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PERSONAL SERVICES SECTION - Unpredictable Professional Layouts */}
            <section className="ykb-section bg-white py-20">
                <div className="ykb-container">
                    <div className="mb-16 text-start">
                        <div className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/10 px-4 py-2 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t('home.whatWeOffer')}</span>
                        </div>
                        <h2 className="text-4xl font-serif font-bold text-primary md:text-5xl mb-4">{t('services.title')}</h2>
                        <p className="max-w-3xl text-lg text-textSecondary">{t('services.description')}</p>
                    </div>

                    {/* Unpredictable Layout Grid */}
                    <div className="space-y-12">
                        {/* Layout 1: Gig Card Style - Diagonal Split */}
                        <div className={`animate-on-scroll group relative overflow-hidden border border-secondary/25 bg-white shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 ${isVisible['personal-0'] ? 'visible' : ''}`} id="personal-0">
                            <div className="absolute inset-0 bg-linear-to-br from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                                <div className="lg:col-span-3 relative">
                                    <div className="h-80 lg:h-96 overflow-hidden">
                                        <img src={personalServices[0].image} alt={personalServices[0].title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent"></div>
                                    </div>
                                </div>
                                <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center relative">
                                    <div className="absolute top-8 right-8 w-20 h-20 bg-secondary/10 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-secondary">01</span>
                                    </div>
                                    <h3 className="text-2xl lg:text-3xl font-serif font-bold text-primary mb-4">{personalServices[0].title}</h3>
                                    <p className="text-textSecondary leading-relaxed mb-6">{personalServices[0].description}</p>
                                    <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                                        <span className="w-2 h-2 bg-secondary"></span>
                                        {t('home.premiumService')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Layout 2: Overlapping Cards */}
                        <div className={`animate-on-scroll relative ${isVisible['personal-1'] ? 'visible' : ''}`} id="personal-1">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-linear-to-br from-primary/10 to-secondary/10 blur-xl"></div>
                                    <div className="relative border border-secondary/25 bg-white shadow-xl overflow-hidden">
                                        <div className="h-64 overflow-hidden">
                                            <img src={personalServices[1].image} alt={personalServices[1].title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-8">
                                            <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/10 px-3 py-1 mb-4">
                                                <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t('home.construction')}</span>
                                            </div>
                                            <h3 className="text-xl font-serif font-bold text-primary mb-3">{personalServices[1].title}</h3>
                                            <p className="text-textSecondary text-sm leading-relaxed">{personalServices[1].description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center space-y-6">
                                    <div className="border border-secondary/20 bg-linear-to-br from-secondary/5 to-primary/5 p-6">
                                        <div className="w-12 h-12 bg-secondary/20 flex items-center justify-center mb-4">
                                            <span className="text-lg font-bold text-secondary">02</span>
                                        </div>
                                        <h4 className="text-lg font-semibold text-primary mb-2">{personalServices[2].title}</h4>
                                        <p className="text-sm text-textSecondary">{personalServices[2].description}</p>
                                    </div>
                                    <div className="border border-primary/20 bg-linear-to-br from-primary/5 to-secondary/5 p-6">
                                        <div className="w-12 h-12 bg-primary/20 flex items-center justify-center mb-4">
                                            <span className="text-lg font-bold text-primary">03</span>
                                        </div>
                                        <h4 className="text-lg font-semibold text-primary mb-2">{personalServices[3].title}</h4>
                                        <p className="text-sm text-textSecondary">{personalServices[3].description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Layout 3: Masonry Grid */}
                        <div className={`animate-on-scroll grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isVisible['personal-2'] ? 'visible' : ''}`} id="personal-2">
                            <div className="md:col-span-2 lg:col-span-1 row-span-2 border border-secondary/25 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <div className="h-64 overflow-hidden">
                                    <img src={personalServices[4].image} alt={personalServices[4].title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 bg-linear-to-br from-secondary to-primary flex items-center justify-center">
                                            <span className="text-xs font-bold text-white">04</span>
                                        </div>
                                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{t('home.travel')}</span>
                                    </div>
                                    <h3 className="text-lg font-serif font-bold text-primary mb-2">{personalServices[4].title}</h3>
                                    <p className="text-sm text-textSecondary">{personalServices[4].description}</p>
                                </div>
                            </div>
                            <div className="border border-secondary/25 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <div className="h-48 overflow-hidden">
                                    <img src={personalServices[5].image} alt={personalServices[5].title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-serif font-bold text-primary mb-2">{personalServices[5].title}</h3>
                                    <p className="text-sm text-textSecondary">{personalServices[5].description}</p>
                                </div>
                            </div>
                            <div className="border border-secondary/25 bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                                <div className="h-48 overflow-hidden">
                                    <img src={personalServices[6].image} alt={personalServices[6].title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-lg font-serif font-bold text-primary mb-2">{personalServices[6].title}</h3>
                                    <p className="text-sm text-textSecondary">{personalServices[6].description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Layout 4: Feature List with Images */}
                        <div className={`animate-on-scroll border border-secondary/25 bg-linear-to-br from-primary/5 to-secondary/5 p-8 lg:p-12 ${isVisible['personal-3'] ? 'visible' : ''}`} id="personal-3">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 border border-white/25 bg-white/80 px-4 py-2 mb-4">
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">{t('home.dailySupport')}</span>
                                    </div>
                                    <h3 className="text-2xl lg:text-3xl font-serif font-bold text-primary mb-6">{t('home.essentialServices')}</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
                                                <span className="text-sm font-bold text-secondary">07</span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-primary mb-1">{personalServices[7].title}</h4>
                                                <p className="text-sm text-textSecondary">{personalServices[7].description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                                                <span className="text-sm font-bold text-primary">08</span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-primary mb-1">{personalServices[8].title}</h4>
                                                <p className="text-sm text-textSecondary">{personalServices[8].description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-secondary/20 flex items-center justify-center shrink-0 mt-1">
                                                <span className="text-sm font-bold text-secondary">09</span>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-primary mb-1">{personalServices[9].title}</h4>
                                                <p className="text-sm text-textSecondary">{personalServices[9].description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div className="border border-secondary/25 shadow-lg overflow-hidden">
                                                <div className="h-32 overflow-hidden">
                                                    <img src={personalServices[7].image} alt={personalServices[7].title} className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                            <div className="border border-secondary/25 shadow-lg overflow-hidden">
                                                <div className="h-32 overflow-hidden">
                                                    <img src={personalServices[8].image} alt={personalServices[8].title} className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8">
                                            <div className="border border-secondary/25 shadow-lg overflow-hidden">
                                                <div className="h-72 overflow-hidden">
                                                    <img src={personalServices[9].image} alt={personalServices[9].title} className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Layout 5: Compact Cards Grid */}
                        <div className={`animate-on-scroll ${isVisible['personal-4'] ? 'visible' : ''}`} id="personal-4">
                            <div className="text-start mb-8">
                                <h3 className="text-2xl font-serif font-bold text-primary mb-2">{t('home.quickServices')}</h3>
                                <p className="text-textSecondary">{t('home.quickServicesDesc')}</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[personalServices[0], personalServices[1], personalServices[2], personalServices[3]].map((service, idx) => (
                                    <div key={idx} className="group relative overflow-hidden border border-secondary/25 bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                        <div className="aspect-square overflow-hidden">
                                            <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                            <h4 className="text-white font-semibold text-sm mb-1">{service.title}</h4>
                                            <p className="text-white/80 text-xs line-clamp-2">{service.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

  
  

            {/* FEATURED SERVICES */}
            <section className="ykb-section bg-white py-16">
                <div className="ykb-container">
                    <div className="mb-12 text-start">
                        <div className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/10 px-4 py-2 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t('home.featured')}</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-primary md:text-4xl">{t('home.featuredServices')}</h2>
                        <p className="mt-3 text-textSecondary">{t('home.featuredDesc')}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {featuredServices.map((service, idx) => (
                            <div key={service.id} className={`animate-on-scroll border border-secondary/25 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 hover:border-secondary/40 ${isVisible[`featured-${idx}`] ? 'visible' : ''}`} id={`featured-${idx}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 bg-secondary/20 flex items-center justify-center">
                                        <span className="text-sm font-bold text-secondary">{idx + 1}</span>
                                    </div>
                                    <div className="h-3 w-12 bg-secondary"></div>
                                </div>
                                <h3 className="mb-3 text-lg font-semibold text-primary">{service.title}</h3>
                                <p className="text-sm text-textSecondary mb-4 leading-relaxed">{service.description}</p>
                                <button 
                                    onClick={() => handleBookService(service.title)} 
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-accent transition-colors border-b border-secondary/30 hover:border-accent"
                                >
                                    {t('home.learnMore')} <ArrowRight className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <button 
                            onClick={() => navigate('/services')} 
                            className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary px-6 py-3 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105"
                        >
                            {t('home.viewAllServices')} <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* CUSTOM SERVICE REQUEST */}
            <section className="ykb-section bg-primary py-16">
                <div className="ykb-container">
                    <div className="mx-auto max-w-2xl">
                        <div className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/10 px-4 py-2 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t('home.custom')}</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-white">{t('home.dontSeeWhatYouNeed')}</h2>
                        <p className="mt-3 text-white/80">{t('home.customDesc')}</p>
                        <div className="mt-8 space-y-4">
                            <button 
                                onClick={() => openWhatsApp('Hello, I have a custom service request.')}
                                className="w-full inline-flex items-center justify-center gap-2 border border-secondary bg-secondary px-8 py-4 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105"
                            >
                                <span>{t('home.requestCustomService')}</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <div className="text-center">
                                <p className="text-white/60 text-sm">{t('home.orReachUs')}: <span className="font-semibold">0798891543</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* HOW IT WORKS + WHY TRUST US + PRICING + REVIEWS + STARTER KIT */}
            <section className="ykb-section bg-[#fdfbf7] py-16">
                <div className="ykb-container">
                    <div className="mb-12 text-start">
                        <div className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/10 px-4 py-2 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t('home.howItWorks', 'How it works')}</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-primary md:text-4xl">{t('home.howItWorksTitle', 'Simple steps to get your Bestie')}</h2>
                        <p className="mt-3 text-sm text-textSecondary">{t('home.howItWorksDesc', 'Choose a service, book online, pay accordingly, and we handle the rest.')}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        {[
                            { n: '01', title: t('home.stepChoose', 'Choose service'), desc: t('home.stepChooseDesc', 'Pick what you need: airport, relocation, bookings, and more.') },
                            { n: '02', title: t('home.stepBook', 'Book online'), desc: t('home.stepBookDesc', 'Select a time and submit your request.') },
                            { n: '03', title: t('home.stepPay', 'Pay accordingly'), desc: t('home.stepPayDesc', 'Transparent pricing for one-time and membership requests.') },
                            { n: '04', title: t('home.stepWeHandle', 'We handle the rest'), desc: t('home.stepWeHandleDesc', 'Our team coordinates everything with trusted local support.') },
                        ].map((s) => (
                            <div key={s.n} className="ykb-card ykb-card-hover p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10 text-sm font-bold text-secondary">
                                        {s.n}
                                    </div>
                                    <h3 className="text-lg font-semibold text-primary">{s.title}</h3>
                                </div>
                                <p className="text-sm text-textSecondary leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ykb-section bg-white py-16">
                <div className="ykb-container">
                    <div className="mb-12 text-start">
                        <div className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/10 px-4 py-2 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t('home.whyTrustUs', 'Why Trust Us?')}</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-primary md:text-4xl">{t('home.whyTrustUsTitle', 'Local expertise. Accountability. Vetted providers.')}</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        {[
                            { icon: MapPin, title: t('home.vettedProviders', 'Vetted providers'), desc: t('home.vettedProvidersDesc', 'We connect you to trusted professionals and services across Kigali.') },
                            { icon: ClipboardList, title: t('home.accountability', 'Accountability'), desc: t('home.accountabilityDesc', 'Clear communication and follow-through from request to delivery.') },
                            { icon: Handshake, title: t('home.localExpertise', 'Local expertise'), desc: t('home.localExpertiseDesc', 'We know the streets, the best offices, and the right people to call.') },
                            { icon: HeartHandshake, title: t('home.personalizedHelp', 'Personalized assistance'), desc: t('home.personalizedHelpDesc', 'You get a real Bestie—human support, tailored to you.') },
                        ].map((it, idx) => (
                            <div key={idx} className="ykb-card ykb-card-hover p-7">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 border border-secondary/20 text-secondary">
                                        <it.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-primary">{it.title}</h3>
                                </div>
                                <p className="text-sm text-textSecondary leading-relaxed">{it.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="ykb-section bg-white py-16">
                <div className="ykb-container">
                    <div className="mb-12 text-start">
                        <div className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/10 px-4 py-2 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t('home.personalizedRequests', 'Personalized requests')}</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-primary md:text-4xl">{t('home.personalizedRequestsTitle', 'Request anything we design the solution.')}</h2>
                        <p className="mt-3 text-sm text-textSecondary">{t('home.personalizedRequestsDesc', 'This is what separates us from a normal service business. Tell us what you need, and we make it happen.')}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[
                            { title: t('home.prioritizeYou', 'Tailored to you'), desc: t('home.prioritizeYouDesc', 'We adapt around your lifestyle, schedule, and preferences.') , icon: Sparkles },
                            { title: t('home.requestAny', 'Request anything'), desc: t('home.requestAnyDesc', 'If it’s not listed, we still help you build the plan.') , icon: BadgeCheck },
                            { title: t('home.fastResponse', 'Fast coordination'), desc: t('home.fastResponseDesc', 'We connect you with the right provider and follow through.') , icon: Clock },
                        ].map((it) => (
                            <div key={it.title} className="ykb-card ykb-card-hover p-7">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-secondary/20 bg-secondary/10 text-secondary">
                                    <it.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-xl font-semibold text-primary">{it.title}</h3>
                                <p className="text-sm text-textSecondary leading-relaxed">{it.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-textSecondary">{t('home.requestAnythingHint', 'Tap below to start a personalized request on WhatsApp.')}</p>
                        <button
                            onClick={() => openWhatsApp('Hello, I want to request something personalized')}
                            className="inline-flex items-center justify-center gap-2 border border-secondary/25 bg-secondary px-6 py-3 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105"
                        >
                            {t('home.startRequest', 'Request anything')}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </section>
            <section className="ykb-section bg-white py-16">
                <div className="ykb-container">
                    <div className="mb-12 text-start">
                        <div className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/10 px-4 py-2 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t('home.rwandaStarterKit', 'Rwanda Starter Kit')}</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-primary md:text-4xl">{t('home.rwandaStarterKitTitle', 'Get settled fast SIM, hospitals, and essentials')}</h2>
                        <p className="mt-3 text-sm text-textSecondary">{t('home.rwandaStarterKitDesc', 'A mini guide and curated services for your first days in Rwanda.')}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {[
                            { title: 'SIM cards', desc: 'How to get an MTN/Airtel SIM and set up data.', icon: MapPin },
                            { title: 'Hospitals', desc: 'Trusted clinics & emergency options near you.', icon: ClipboardList },
                            { title: 'Mobile money', desc: 'Momo setup and safe payment tips.', icon: CreditCard },
                        ].map((c) => (
                            <div key={c.title} className="ykb-card ykb-card-hover p-7">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-secondary/20 bg-secondary/10 text-secondary">
                                        <c.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-primary">{c.title}</h3>
                                </div>
                                <p className="text-sm text-textSecondary leading-relaxed">{c.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10">
                        <button
                            onClick={() => navigate('/guide')}
                            className="inline-flex items-center justify-center gap-2 border border-secondary/25 bg-secondary px-6 py-3 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105"
                        >
                            Explore Rwanda Starter Kit
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </section>

            {/* MISSION + FINAL CTA */}
            <section className="ykb-section bg-[#fdfbf7] py-16">
                <div className="ykb-container">
                    <div className="mb-12 text-start">
                        <div className="inline-flex items-center gap-2 border border-secondary/25 bg-secondary/10 px-4 py-2 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-secondary">{t('home.aboutUs')}</span>
                        </div>
                        <h2 className="text-3xl font-serif font-bold text-primary md:text-4xl">{t('home.ourPurpose')}</h2>
                        <p className="mt-3 text-textSecondary">{t('home.purposeDesc')}</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 mb-12">
                        <div className="border border-secondary/25 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary/20 flex items-center justify-center">
                                    <span className="text-lg font-bold text-primary">M</span>
                                </div>
                                <h3 className="text-lg font-serif font-bold text-primary">{t('home.ourMission')}</h3>
                            </div>
                            <p className="text-textSecondary leading-relaxed">{t('home.missionDesc')}</p>
                        </div>
                        <div className="border border-secondary/25 bg-white p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-secondary/20 flex items-center justify-center">
                                    <span className="text-lg font-bold text-secondary">V</span>
                                </div>
                                <h3 className="text-lg font-serif font-bold text-primary">{t('home.ourVision')}</h3>
                            </div>
                            <p className="text-textSecondary leading-relaxed">{t('home.visionDesc')}</p>
                        </div>
                    </div>

                    <div className="border border-secondary/25 bg-secondary/10 p-8 md:p-12 hover:bg-secondary/15 transition-colors">
                        <div className="text-start mb-8">
                            <h2 className="text-2xl font-serif font-bold text-primary md:text-3xl">{t('home.readyToStart')}</h2>
                            <p className="mt-3 max-w-md text-textSecondary">{t('home.readyDesc')}</p>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <button onClick={handleCTA} className="border border-secondary bg-secondary px-6 py-3 font-semibold text-primary transition-all hover:shadow-lg hover:scale-105">
                                    <span>{t('home.requestServiceNow')}</span>
                                </button>
                                <button onClick={() => navigate('/services')} className="border border-secondary/25 bg-white px-6 py-3 font-semibold text-primary transition-all hover:bg-secondary hover:text-white">
                                    <span>{t('home.browseServices')}</span>
                                </button>
                            </div>
                            <div className="text-center pt-4 border-t border-secondary/20">
                                <p className="text-sm text-textSecondary">
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
