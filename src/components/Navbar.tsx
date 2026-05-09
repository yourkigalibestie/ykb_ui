import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, MessageCircle, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { openWhatsApp } from '../utils/whatsapp';
import { getBackendSession, isBackendAdmin, logoutBackend } from '../utils/backendAuth';
import { LanguageSwitcher } from './LanguageSwitcher';
import logo from '../assets/images/logo.png';

export function Navbar() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    const backendSession = getBackendSession();
    const isBackendProvider = backendSession?.user?.role === 'PROVIDER';
    const isBackendCustomer = backendSession?.user?.role === 'CUSTOMER';
    const isLoggedIn = Boolean(backendSession);

    const dashboardPath = isBackendAdmin() ? '/admin' : isBackendProvider ? '/provider' : '/profile';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setTimeout(() => setIsOpen(false), 0);
    }, [location]);

    const profilePath = isBackendProvider ? '/provider/profile' : '/profile';

    const navLinks = [
        { path: '/', label: t('navigation.home') },
        { path: '/services', label: t('navigation.services') },
        { path: '/subscribe', label: t('navigation.subscribe') },
        ...(isLoggedIn
            ? [
                  ...(isBackendCustomer ? [] : [{ path: profilePath, label: t('common.profile') }]),
                  { path: dashboardPath, label: t('common.dashboard') },
              ]
            : [
                  { path: '/login', label: t('navigation.login') },
                  { path: '/register', label: t('navigation.register') },
              ]),
    ];

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const handleBookNow = () => {
        openWhatsApp('Hello, I would like to book a service');
    };

    const handleWhatsAppContact = () => {
        openWhatsApp('Hello, I would like to get in touch with you');
    };

    const handlePhoneCall = () => {
        window.location.href = 'tel:+250788123456';
    };

    const handleEmail = () => {
        window.location.href = 'mailto:info@yourkigalibestie.com';
    };

    return (
        <>
            {/* Contact Navigation Bar */}
            <div className="fixed top-0 w-full z-40 bg-secondary text-white py-2 transition-all duration-300">
                <div className="ykb-container">
                    <div className="flex justify-center items-center gap-6 text-sm">
                        <button
                            onClick={handleWhatsAppContact}
                            className="flex items-center gap-2 hover:text-gray-200 transition-colors duration-200"
                            aria-label="Contact via WhatsApp"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                        <button
                            onClick={handlePhoneCall}
                            className="flex items-center gap-2 hover:text-gray-200 transition-colors duration-200"
                            aria-label="Call us"
                        >
                            <Phone className="w-4 h-4" />
                            <span className="hidden sm:inline">+250798891543</span>
                        </button>
                        <button
                            onClick={handleEmail}
                            className="flex items-center gap-2 hover:text-gray-200 transition-colors duration-200"
                            aria-label="Send email"
                        >
                            <Mail className="w-4 h-4" />
                            <span className="hidden sm:inline">yourkigalibestie@gmail.com</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Navigation Bar */}
            <nav
                className={`fixed top-8 w-full z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-white/95 backdrop-blur-xl border-b border-border shadow-sm'
                        : 'bg-white/80 backdrop-blur-md border-b border-border/60'
                }`}
            >
            <div className="ykb-container">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2 group">
                        <img
                            src={logo}
                            alt="Your Kigali Bestie"
                            className="w-20 h-20 object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="font-semibold text-primary text-lg hidden sm:inline">
                            Your<span className="text-secondary">Kigali</span>Bestie
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-3">

                        <div className="flex">
                            <div className="flex items-stretch">
                                {navLinks.map((link) => {
                                    const active = isActive(link.path);
                                    const isLast = link.path === navLinks[navLinks.length - 1]?.path;
                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            aria-current={active ? 'page' : undefined}
                                            className={`relative flex items-center px-3 text-sm font-semibold transition-colors duration-200 h-10 ${
                                                active
                                                    ? 'bg-secondary text-white'
                                                    : 'text-textSecondary hover:bg-surface/60 hover:text-primary'
                                            } ${
                                                isLast
                                                    ? ''
                                                    : 'after:absolute after:right-0 after:top-2 after:bottom-2 after:w-px after:bg-border'
                                            }`}
                                          >
                                            {link.label}
                                                    </Link>
                                    );
                                })}
                </div>
                        </div>

                        <LanguageSwitcher />
<button
                            onClick={handleBookNow}
                            className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm shadow-gold"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Book Now</span>
                        </button>

                        {backendSession && (
                            <button
                                onClick={() => {
                                    logoutBackend();
                                    window.location.href = '/';
                                }}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                            >
                                <span>{t('common.logout')}</span>
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-xl border border-border bg-white text-primary hover:bg-slate-50 transition-all duration-200"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X className="w-5 h-5 text-primary" /> : <Menu className="w-5 h-5 text-primary" />}
                    </button>
                </div>

                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="py-4 space-y-1 border-t border-border mt-2 bg-white">
                        <div className="px-4 py-2">
                            <LanguageSwitcher />
                        </div>
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`block px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                                    isActive(link.path)
                                        ? 'text-primary bg-secondary/10'
                                        : 'text-textSecondary hover:text-primary hover:bg-surface/60'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}

<button
                            onClick={handleBookNow}
                            className="w-full mt-3 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 text-sm shadow-gold"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Book Now</span>
                        </button>

                        {backendSession && (
                            <button
                                onClick={() => {
                                    logoutBackend();
                                    window.location.href = '/';
                                }}
                                className="w-full mt-3 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 text-sm"
                            >
                                <span>{t('common.logout')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            </nav>
        </>
    );
}
