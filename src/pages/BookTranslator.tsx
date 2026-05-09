import { useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from 'react';
import { openWhatsApp } from '../utils/whatsapp';

interface FormData {
    languageId: string;
    durationUnit: string;
}

type Language = {
    id: number;
    title: string;
    prices: Record<string, number>;
};

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000/api';

async function readApiErrorMessage(res: Response): Promise<string> {
    try {
        const data = (await res.json()) as any;
        const msg = data?.error?.message;
        if (typeof msg === 'string' && msg.trim().length > 0) return msg;
    } catch {
        // ignore
    }
    return `Request failed (${res.status})`;
}

export function BookTranslator() {
    const [formData, setFormData] = useState<FormData>({
        languageId: '',
        durationUnit: '',
    });

    const [submitted, setSubmitted] = useState(false);

    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/languages`);
                if (!res.ok) throw new Error(await readApiErrorMessage(res));
                const json = (await res.json()) as { languages?: Language[] };
                const list = Array.isArray(json.languages) ? json.languages : [];
                if (!mounted) return;
                setLanguages(list);
                setLoadError(null);
            } catch (err) {
                if (!mounted) return;
                const msg = err instanceof Error ? err.message : 'Could not load translator options.';
                setLanguages([]);
                setLoadError(msg);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void load();
        return () => {
            mounted = false;
        };
    }, []);

    const selectedLanguage = useMemo(() => {
        const id = Number(formData.languageId);
        if (!Number.isFinite(id)) return null;
        return languages.find((l) => l.id === id) ?? null;
    }, [formData.languageId, languages]);

    const durationOptions = useMemo(() => {
        if (!selectedLanguage) return [] as Array<{ unit: string; amount: number }>;
        const entries = Object.entries(selectedLanguage.prices ?? {});
        return entries
            .filter(([unit, amount]) => typeof unit === 'string' && unit.trim().length > 0 && Number.isFinite(amount) && amount > 0)
            .map(([unit, amount]) => ({ unit, amount }))
            .sort((a, b) => a.unit.localeCompare(b.unit));
    }, [selectedLanguage]);

    const selectedPrice = useMemo(() => {
        if (!selectedLanguage) return null;
        const raw = selectedLanguage.prices?.[formData.durationUnit];
        return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
    }, [formData.durationUnit, selectedLanguage]);

    const handleChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target as HTMLSelectElement | HTMLInputElement;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            const languageName = selectedLanguage?.title ?? formData.languageId;
            const durationUnit = formData.durationUnit;
            const priceLine = selectedPrice ? `Price: ${selectedPrice} (${durationUnit})` : '';

            openWhatsApp(
                [
                    'Hello Your Kigali Bestie, I would like to book a translator (paid service).',
                    `Language: ${languageName}`,
                    `Duration: ${durationUnit}`,
                    ...(priceLine ? [priceLine] : []),
                ].join('\n')
            );
            setSubmitted(false);
            setFormData({ languageId: '', durationUnit: '' });
        }, 500);
    };

    return (
    <main className="pt-16 bg-white text-gray-900">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Help commuinicate</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Book personal translator</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-textSecondary">
             Book a translator to help you communicate effectively in Kigali. Our professional translators are fluent in English and French, and can assist you with meetings, calls, documents, and more. Just fill out the form with your language needs and duration, and we'll connect you with the right translator for your situation.
            </p>
          </div>
        </div>
      </section>

            {/* Form Section */}
            <section className="ykb-section px-4 sm:px-6 lg:px-8 bg-dark-light">
                <div className="max-w-2xl mx-auto">
                    {loadError ? (
                        <div className="mb-5 ykb-card">
                            <div className="ykb-alert ykb-alert-error">{loadError}</div>
                        </div>
                    ) : null}

                    <div className="ykb-surface p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Language Selection */}
                            <div>
                                <label htmlFor="language" className="block text-lg font-serif font-semibold text-primary mb-3">
                                    Which language do you need?
                                </label>
                                <select
                                    id="language"
                                    name="languageId"
                                    value={formData.languageId}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setFormData((prev) => ({ ...prev, durationUnit: '' }));
                                    }}
                                    required
                                    disabled={loading || languages.length === 0}
                                    className="ykb-field"
                                >
                                    <option value="">{loading ? 'Loading…' : 'Select a language'}</option>
                                    {languages.map((l) => (
                                        <option key={l.id} value={String(l.id)}>
                                            {l.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Duration */}
                            <div>
                                <label htmlFor="duration" className="block text-lg font-serif font-semibold text-primary mb-3">
                                    What is the duration needed?
                                </label>
                                <div className="space-y-3">
                                    {selectedLanguage ? (
                                        durationOptions.length > 0 ? (
                                            durationOptions.map((opt) => (
                                                <label key={opt.unit} className="flex items-center justify-between gap-3 cursor-pointer">
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="radio"
                                                            name="durationUnit"
                                                            value={opt.unit}
                                                            checked={formData.durationUnit === opt.unit}
                                                            onChange={handleChange}
                                                            required
                                                            className="w-5 h-5 text-primary border-primary bg-dark-light focus:ring-primary/40"
                                                        />
                                                        <span className="text-gray-300/80 font-medium capitalize">{opt.unit}</span>
                                                    </div>
                                                    <span className="text-gray-400 text-sm">{opt.amount}</span>
                                                </label>
                                            ))
                                        ) : (
                                            <div className="ykb-alert ykb-alert-info">No pricing configured for this language yet.</div>
                                        )
                                    ) : (
                                        <div className="text-sm text-gray-400">Select a language to see available durations.</div>
                                    )}
                                </div>
                            </div>

                            {selectedLanguage && selectedPrice ? (
                                <div className="ykb-card p-4">
                                    <div className="text-sm text-textSecondary">Estimated price</div>
                                    <div className="mt-1 text-xl font-semibold text-primary">{selectedPrice}</div>
                                </div>
                            ) : null}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitted}
                                className={`w-full ykb-button-solid py-3 px-6 ${submitted ? 'opacity-60 cursor-not-allowed hover:bg-primary' : ''}`}
                            >
                                {submitted ? 'Submitting...' : 'Book Translator Now'}
                            </button>
                        </form>
                    </div>

                    {/* Service Info */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="ykb-card p-6">
                            <h3 className="font-serif font-semibold text-primary mb-3">Why Our Translators?</h3>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>✓ Native speakers with cultural knowledge</li>
                                <li>✓ Professional and experienced</li>
                                <li>✓ Available for meetings, calls, and documents</li>
                                <li>✓ Flexible scheduling</li>
                            </ul>
                        </div>

                        <div className="ykb-card p-6">
                            <h3 className="font-serif font-semibold text-primary mb-3">What We Cover</h3>
                            <ul className="space-y-2 text-gray-400 text-sm">
                                <li>✓ Business meetings and negotiations</li>
                                <li>✓ Document translation</li>
                                <li>✓ Personal communications</li>
                                <li>✓ Administrative matters</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 ykb-card p-6">
                        <h3 className="font-serif font-semibold text-primary mb-3">Available languages</h3>

                        {loading ? (
                            <p className="text-sm text-gray-400">Loading…</p>
                        ) : languages.length === 0 ? (
                            <p className="text-sm text-gray-400">No translator languages have been added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {languages.map((l) => {
                                    const rows = Object.entries(l.prices ?? {})
                                        .filter(([unit, amount]) => unit.trim().length > 0 && Number.isFinite(amount) && amount > 0)
                                        .sort(([a], [b]) => a.localeCompare(b));

                                    return (
                                        <div key={l.id} className="rounded-lg border border-border bg-white p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-primary">{l.title}</div>
                                                    <div className="mt-1 text-sm text-textSecondary">
                                                        {rows.length === 0
                                                            ? 'No prices configured yet.'
                                                            : rows.map(([unit, amount]) => `${unit}: ${amount}`).join(' • ')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
