import { useNavigate } from 'react-router-dom';
import { MapPin, AlertCircle, Smartphone, Wifi, ArrowRight } from 'lucide-react';

interface GuideCardProps {
    icon: React.ReactNode;
    title: string;
    items: string[];
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

                    {/* Housing */}
                    <div className="mb-16">
                        <h2 className="text-3xl font-serif font-bold text-primary mb-8">Housing & Accommodation</h2>
                        <div className="ykb-surface p-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🏨</div>
                                    <h3 className="font-serif font-semibold text-primary">Hotels</h3>
                                    <p className="text-textSecondary text-sm">Various price ranges</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🏠</div>
                                    <h3 className="font-serif font-semibold text-primary">Apartments</h3>
                                    <p className="text-textSecondary text-sm">Long-term rentals</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🌐</div>
                                    <h3 className="font-serif font-semibold text-primary">Airbnb</h3>
                                    <p className="text-textSecondary text-sm">Flexible stays</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📍</div>
                                    <h3 className="font-serif font-semibold text-primary">Real Estate</h3>
                                    <p className="text-textSecondary text-sm">Buying/renting</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    navigate('/book-housing');
                                }}
                                className="w-full ykb-button-solid py-3 px-6"
                            >
                                <span>Help Me Book Housing</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
