import { useState, type FormEvent } from 'react';
import { Home, MapPin, DollarSign } from 'lucide-react';
import { openWhatsApp } from '../utils/whatsapp';

interface FormData {
    type: string;
    location: string;
    rooms: string;
    budget: string;
}

export function BookHousing() {
    const [formData, setFormData] = useState<FormData>({
        type: '',
        location: '',
        rooms: '',
        budget: '',
    });

    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            openWhatsApp(
                [
                    'Hello Your Kigali Bestie, I need help booking housing (paid service).',
                    `Type: ${formData.type}`,
                    `Location: ${formData.location}`,
                    `Bedrooms: ${formData.rooms}`,
                    `Budget: ${formData.budget} RWF`,
                ].join('\n')
            );
            setSubmitted(false);
            setFormData({ type: '', location: '', rooms: '', budget: '' });
        }, 500);
    };

    return (
     <main className="pt-16 bg-white text-gray-900">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Care what matters most</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Book Housing </h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
             We help you find the perfect place to stay in Kigali. Just fill out the form with your preferences and we'll get back to you with options that match your needs and budget.    
            </p>
          </div>
        </div>
      </section>

            {/* Form Section */}
            <section className="ykb-section px-4 sm:px-6 lg:px-8 bg-dark-light">
                <div className="max-w-2xl mx-auto">
                    <div className="ykb-surface p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Housing Type */}
                            <div>
                                <label htmlFor="type" className="block text-lg font-serif font-semibold text-primary mb-3">
                                    What type of housing are you looking for?
                                </label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                    className="ykb-field"
                                >
                                    <option value="">Select an option</option>
                                    <option value="hotel">Hotel</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="airbnb">Airbnb</option>
                                </select>
                            </div>

                            {/* Location */}
                            <div>
                                <label htmlFor="location" className="block text-lg font-serif font-semibold text-primary mb-3">
                                    Preferred Location
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-primary" />
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="e.g., Kigali City Center, Kacyiru, Remera"
                                        required
                                        className="ykb-field pl-10"
                                    />
                                </div>
                            </div>

                            {/* Rooms */}
                            <div>
                                <label htmlFor="rooms" className="block text-lg font-serif font-semibold text-primary mb-3">
                                    Number of Bedrooms
                                </label>
                                <div className="relative">
                                    <Home className="absolute left-3 top-3 w-5 h-5 text-primary" />
                                    <input
                                        type="number"
                                        id="rooms"
                                        name="rooms"
                                        value={formData.rooms}
                                        onChange={handleChange}
                                        placeholder="e.g., 1, 2, 3"
                                        min="1"
                                        required
                                        className="ykb-field pl-10"
                                    />
                                </div>
                            </div>

                            {/* Budget */}
                            <div>
                                <label htmlFor="budget" className="block text-lg font-serif font-semibold text-primary mb-3">
                                    Monthly Budget (RWF)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-primary" />
                                    <input
                                        type="text"
                                        id="budget"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        placeholder="e.g., 500000 - 1000000"
                                        required
                                        className="ykb-field pl-10"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitted}
                                className={`w-full ykb-button-solid py-3 px-6 ${submitted ? 'opacity-60 cursor-not-allowed hover:bg-primary' : ''}`}
                            >
                                {submitted ? 'Submitting...' : 'Submit Housing Request'}
                            </button>
                        </form>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 ykb-card p-6">
                        <h3 className="font-serif font-semibold text-primary mb-3">What happens next?</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li>✓ We receive your housing preferences</li>
                            <li>✓ Our team searches for matching properties</li>
                            <li>✓ We contact you within 24 hours with options</li>
                            <li>✓ We help with viewings and negotiations</li>
                        </ul>
                    </div>
                </div>
            </section>
        </main>
    );
}
