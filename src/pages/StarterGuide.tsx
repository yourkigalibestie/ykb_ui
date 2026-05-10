import { MapPin, AlertCircle, Smartphone, Wifi, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getBackendAuthHeaders, API_BASE } from '../utils/backendAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface GuideCardProps {
    icon: React.ReactNode;
    title: string;
    items: string[];
}

interface StarterService {
    id: number;
    category: string;
    description?: string;
    imageUrl?: string;
    subcategories?: string[];
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
    const [services, setServices] = useState<StarterService[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('🔄 services state changed:', { length: services.length, items: services });
    }, [services]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const headers = getBackendAuthHeaders();
                const url = `${API_BASE}/starter-guide-categories?isStarterKit=true`;
                console.log('🔍 Fetching starter kit services from:', url);
                console.log('📋 Headers:', headers);
                
                const response = await fetch(url, { headers });
                console.log('📊 Response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Successfully fetched data:', data);
                    setServices(Array.isArray(data) ? data : []);
                } else {
                    const errorText = await response.text();
                    console.error('❌ API error response:', response.status, errorText);
                }
            } catch (error) {
                console.error('❌ Failed to fetch starter kit services:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    const navigate = useNavigate();

    return (
    <main className="pt-16 bg-white text-gray-900">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Enjoy the stay in Rwanda</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Starter Guide</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
                Welcome to Your Kigali Bestie! This starter guide will help you navigate your first 24 hours in Kigali with essential tips on mobile connectivity, emergency contacts, must-have apps, and housing options. Let's get you settled in and ready to explore the city like a local!
            </p>
          </div>
        </div>
      </section>

            {/* Content Sections */}
            <section className="ykb-section px-4 sm:px-6 lg:px-8 bg-dark-light">
                <div className="ykb-container">


                                        {/* Registered Services */}
                    {!loading && services.length > 0 && (
                        <div className="mb-16">
                            <h2 className="text-3xl font-serif font-bold text-primary mb-8">Starter Kit Services</h2>
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
                                        <h3 className="text-xl font-serif font-semibold text-primary mb-2">{service.category}</h3>
                                        {service.description && (
                                            <p className="text-textSecondary text-sm mb-4">{service.description}</p>
                                        )}
                                        {service.subcategories && service.subcategories.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-semibold text-primary">Categories:</p>
                                                <ul className="space-y-1">
                                                    {service.subcategories.map((sub, idx) => (
                                                        <li key={idx} className="flex items-start space-x-2">
                                                            <span className="text-primary font-bold">•</span>
                                                            <span className="text-textSecondary text-sm">{sub}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => navigate(`/request?service=${encodeURIComponent(service.category)}`)}
                                            className="mt-4 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-white shadow-gold transition-colors duration-200 hover:bg-[#c49b2f] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white w-full justify-center"
                                        >
                                            <span>Request Service</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && services.length === 0 && (
                        <div className="mb-16 p-4 rounded border border-border bg-white">
                            <p className="text-textSecondary">No starter kit services available.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="mb-16">
                            <LoadingSpinner size="lg" text="Loading starter kit services…" />
                        </div>
                    )}
                    
                    {/* First 24 Hours */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-primary mb-8">First 24 Hours</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <GuideCard
                                icon={<Smartphone className="w-6 h-6" />}
                                title="Mobile & SIM Cards"
                                items={[
                                    "MTN: Available at airport and city centers",
                                    "Airtel: Good coverage in Kigali",
                                    "Bring your passport for registration",
                                    "Affordable prepaid plans available"
                                ]}
                            />
                            <GuideCard
                                icon={<MapPin className="w-6 h-6" />}
                                title="Mobile Money"
                                items={[
                                    "MTN Mobile Money (Momo): Most popular",
                                    "Airtel Money: Widely accepted",
                                    "Use for easy transfers and payments",
                                    "Register with ID at any service point"
                                ]}
                            />
                            <GuideCard
                                icon={<MapPin className="w-6 h-6" />}
                                title="Currency Exchange"
                                items={[
                                    "Forex bureaus throughout the city",
                                    "Kigali City Center has many options",
                                    "ATMs accept major cards",
                                    "Competitive rates at established bureaus"
                                ]}
                            />
                        </div>
                    </div>


                    


                    {/* Emergencies */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-primary mb-8">In Case of Emergency</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GuideCard
                                icon={<AlertCircle className="w-6 h-6" />}
                                title="Medical"
                                items={[
                                    "King Faisal Hospital: Premium facility",
                                    "Nyarutarama Hospital: Excellent service",
                                    "Central Hospital: Public option",
                                    "Emergency: 912"
                                ]}
                            />
                            <GuideCard
                                icon={<AlertCircle className="w-6 h-6" />}
                                title="Police & Safety"
                                items={[
                                    "Police Emergency: 112",
                                    "Kigali is generally very safe",
                                    "Tourist Police: Helpful and friendly",
                                    "Keep copies of important documents"
                                ]}
                            />
                            <GuideCard
                                icon={<AlertCircle className="w-6 h-6" />}
                                title="Ambulance & Rescue"
                                items={[
                                    "Ambulance: 911",
                                    "Fast emergency response times",
                                    "Hospital ambulances available 24/7",
                                    "Many private clinics offer transport"
                                ]}
                            />
                        </div>
                    </div>

                    {/* Apps */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-primary mb-8">Must-Have Apps</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GuideCard
                                icon={<Smartphone className="w-6 h-6" />}
                                title="Food & Delivery"
                                items={[
                                    "Vuba Vuba: Popular local app",
                                    "Jumia Food: Wide restaurant selection",
                                    "Uber Eats: Growing in Kigali",
                                    "Quick delivery to most areas"
                                ]}
                            />
                            <GuideCard
                                icon={<Smartphone className="w-6 h-6" />}
                                title="Transportation"
                                items={[
                                    "Yego: Reliable ride-sharing",
                                    "Move: Affordable local transport",
                                    "Uber: Available in Kigali",
                                    "Fair rates and professional drivers"
                                ]}
                            />
                        </div>
                    </div>

                    {/* WiFi */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-primary mb-8">Internet & WiFi</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <GuideCard
                                icon={<Wifi className="w-6 h-6" />}
                                title="Mobile Internet"
                                items={[
                                    "Mango 4G: Fast and reliable",
                                    "MTN/Airtel mobile data: Affordable",
                                    "Good 4G coverage in Kigali",
                                    "Monthly plans available"
                                ]}
                            />
                            <GuideCard
                                icon={<Wifi className="w-6 h-6" />}
                                title="Home WiFi"
                                items={[
                                    "Canal Box: Home fiber solution",
                                    "Multiple providers in the city",
                                    "Good speeds for work and streaming",
                                    "Professional installation included"
                                ]}
                            />
                        </div>
                    </div>



                </div>
            </section>
        </main>
    );
}
