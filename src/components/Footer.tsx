import { Phone, Mail, MapPin, Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    const currentYear = new Date().getFullYear();

    const quickLinks = [
        { path: '/', label: 'Home' },
        { path: '/services', label: 'Services' },
        { path: '/guide', label: 'Starter Guide' },
        { path: '/request', label: 'Request Service' },
        { path: '/about', label: 'About Us' },
        { path: '/contact', label: 'Contact' },
    ];

    const serviceLinks = [
        { path: '/book-housing', label: 'Housing Assistance' },
        { path: '/book-translator', label: 'Translation Services' },
        { path: '/request?service=Event%20Planning', label: 'Event Planning' },
        { path: '/request?service=Errand%20Running', label: 'Errand Running' },
        { path: '/request?service=Airport%20Pickup', label: 'Airport Pickup' },
        { path: '/request?service=Tour%20Guide', label: 'Tour Guide' },
    ];

    return (
        <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-200">
            {/* Main Footer */}
            <div className=" mx-auto cols px-4 sm:px-6 lg:px-4 pt-2 pb-2">

                {/* Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
                            Quick Links
                        </h4>
                        <ul className="space-y-3">
                            {quickLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm flex items-center gap-1 group"
                                    >
                                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="group-hover:translate-x-0.5 transition-transform inline-block">
                                            {link.label}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
                            Our Services
                        </h4>
                        <ul className="space-y-3">
                            {serviceLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm flex items-center gap-1 group"
                                    >
                                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="group-hover:translate-x-0.5 transition-transform inline-block">
                                            {link.label}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
                            Support
                        </h4>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/faq" className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm flex items-center gap-1 group">
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">FAQ</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm flex items-center gap-1 group">
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">Privacy Policy</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm flex items-center gap-1 group">
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">Terms of Service</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/refund" className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm flex items-center gap-1 group">
                                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="group-hover:translate-x-0.5 transition-transform inline-block">Refund Policy</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-5">
                            Contact Us
                        </h4>
                        <div className="space-y-4">
                            <a
                                href="tel:+250798891543"
                                className="flex items-center gap-3 text-gray-600 hover:text-primary transition-colors duration-200 group"
                            >
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Phone className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm">+250 798 891 543</span>
                            </a>
                            <a
                                href="mailto:hello@yourkigalibestie.com"
                                className="flex items-center gap-3 text-gray-600 hover:text-primary transition-colors duration-200 group"
                            >
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Mail className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm">hello@yourkigalibestie.com</span>
                            </a>
                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm">Kigali, Rwanda</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            &copy; {currentYear} Your Kigali Bestie. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <Link to="/sitemap" className="hover:text-primary transition-colors">Sitemap</Link>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                            Made with
                            <Heart className="h-3.5 w-3.5 text-secondary" />
                            in Kigali
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}