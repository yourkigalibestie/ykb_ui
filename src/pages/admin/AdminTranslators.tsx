import { useEffect, useMemo, useState } from 'react';
import { PriceGrid } from '../../components/PriceGrid';
import { getBackendAuthHeaders, API_BASE } from '../../utils/backendAuth';
import { getFriendlyRequestError, getFriendlyResponseError, getFriendlyUnexpectedResponseError } from '../../utils/friendlyErrors';

type Language = {
	id: number;
	title: string;
	prices: Record<string, number>;
	createdAt?: string;
	updatedAt?: string;
};

type PricePeriod = 'hour' | 'week' | 'month';

type FixedPriceInputs = Record<PricePeriod, string>;

const PRICE_FIELDS: Array<{ key: PricePeriod; label: string; placeholder: string }> = [
        { key: 'hour', label: 'Per hour', placeholder: 'e.g., 15' },
        { key: 'week', label: 'Per week', placeholder: 'e.g., 80' },
        { key: 'month', label: 'Per month', placeholder: 'e.g., 300' },
];

type Currency = 'usd' | 'rwf';

type MultiCurrencyPrices = Record<Currency, FixedPriceInputs>;

type TranslatorLanguageLink = {
	languageId: number;
	language?: Language;
};

type Translator = {
	id: number;
	name: string;
	email: string;
	phone: string;
	profileImageUrl?: string | null;
	profileImagePublicId?: string | null;
	languages: TranslatorLanguageLink[];
};

function normalizeLanguageIds(ids: number[]): number[] {
	const out: number[] = [];
	for (const id of ids) {
		const n = typeof id === 'number' ? id : Number(id);
		if (!Number.isInteger(n) || n <= 0) continue;
		out.push(n);
	}
	return Array.from(new Set(out));
}

function isValidEmail(value: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidUrl(value: string): boolean {
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}

function translatorLanguageIds(t: Translator | null): number[] {
	if (!t?.languages) return [];
	return t.languages.map((l) => l.languageId).filter((id) => Number.isInteger(id) && id > 0);
}

function emptyPriceInputs(): FixedPriceInputs {
        return { hour: '', week: '', month: '' };
}

function emptyMultiCurrencyPrices(): MultiCurrencyPrices {
        return { usd: emptyPriceInputs(), rwf: emptyPriceInputs() };
}

function readLanguagePrices(prices: Record<string, number> | undefined): MultiCurrencyPrices {
        const out = emptyMultiCurrencyPrices();
        if (!prices || typeof prices !== 'object') return out;

        for (const period of Object.keys(out.usd) as PricePeriod[]) {
                const usdKey = `usd_${period}`;
                const rwfKey = `rwf_${period}`;

                if (typeof prices[usdKey] === 'number' && Number.isFinite(prices[usdKey]) && prices[usdKey] > 0) {
                        out.usd[period] = String(prices[usdKey]);
                }
                if (typeof prices[rwfKey] === 'number' && Number.isFinite(prices[rwfKey]) && prices[rwfKey] > 0) {
                        out.rwf[period] = String(prices[rwfKey]);
                }
        }

        // Fallback: if legacy numeric keys exist (hour/week/month) treat them as RWF
        for (const period of Object.keys(out.usd) as PricePeriod[]) {
                if (!out.rwf[period] || out.rwf[period].length === 0) {
                        const legacy = prices[period];
                        if (typeof legacy === 'number' && Number.isFinite(legacy) && legacy > 0) out.rwf[period] = String(legacy);
                }
        }

        return out;
}

function buildPricesForSubmit(inputs: MultiCurrencyPrices): { prices: Record<string, number> | null; error: string | null } {
        const prices: Record<string, number> = {};

        for (const currency of Object.keys(inputs) as Currency[]) {
                for (const field of PRICE_FIELDS) {
                        const raw = inputs[currency][field.key as PricePeriod];
                        const value = Number(raw);
                        if (!Number.isFinite(value) || value <= 0) {
                                return { prices: null, error: `${currency.toUpperCase()} ${field.label} must be a positive number.` };
                        }
                        prices[`${currency}_${field.key}`] = value;
                }
        }

        return { prices, error: null };
}





export function AdminTranslators() {
	const [languages, setLanguages] = useState<Language[]>([]);
	const [languagesLoading, setLanguagesLoading] = useState(true);
	const [languagesError, setLanguagesError] = useState<string | null>(null);

	const [translators, setTranslators] = useState<Translator[]>([]);
	const [translatorsLoading, setTranslatorsLoading] = useState(true);
	const [translatorsError, setTranslatorsError] = useState<string | null>(null);
        const [activeTab, setActiveTab] = useState<'languages' | 'translators'>('languages');

	// Create translator form
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [profileImageUrl, setProfileImageUrl] = useState('');
	const [profileImagePublicId, setProfileImagePublicId] = useState('');
	const [selectedLanguageIds, setSelectedLanguageIds] = useState<number[]>([]);

        const [createError, setCreateError] = useState<string | null>(null);
	const [creating, setCreating] = useState(false);
        const [showCreateModal, setShowCreateModal] = useState(false);

	// Language management
	const [languageTitle, setLanguageTitle] = useState('');
        const [languagePrices, setLanguagePrices] = useState<MultiCurrencyPrices>(emptyMultiCurrencyPrices());
	const [languageCreateError, setLanguageCreateError] = useState<string | null>(null);
	const [creatingLanguage, setCreatingLanguage] = useState(false);
	const [editingLanguageId, setEditingLanguageId] = useState<number | null>(null);
	const [editingLanguageTitle, setEditingLanguageTitle] = useState('');
        const [editingLanguagePrices, setEditingLanguagePrices] = useState<MultiCurrencyPrices>(emptyMultiCurrencyPrices());
	const [languageEditError, setLanguageEditError] = useState<string | null>(null);
	const [savingLanguageEdit, setSavingLanguageEdit] = useState(false);

	// Edit language assignment
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editingLanguageIds, setEditingLanguageIds] = useState<number[]>([]);
	const [editError, setEditError] = useState<string | null>(null);
	const [savingEdit, setSavingEdit] = useState(false);

	const languageById = useMemo(() => {
		const map = new Map<number, Language>();
		for (const l of languages) map.set(l.id, l);
		return map;
	}, [languages]);

	const loadLanguages = async () => {
		setLanguagesLoading(true);
		setLanguagesError(null);
		try {
			const res = await fetch(`${API_BASE}/languages`, {
				headers: { ...getBackendAuthHeaders() },
			});
                        if (!res.ok) throw new Error(await getFriendlyResponseError(res, 'load languages'));
			const json = (await res.json()) as { languages?: Language[] };
			setLanguages(Array.isArray(json.languages) ? json.languages : []);
		} catch (e) {
                        setLanguagesError(getFriendlyRequestError({ error: e, action: 'load languages' }));
			setLanguages([]);
		} finally {
			setLanguagesLoading(false);
		}
	};

	const loadTranslators = async () => {
		setTranslatorsLoading(true);
		setTranslatorsError(null);
		try {
			const res = await fetch(`${API_BASE}/translators`, {
				headers: { ...getBackendAuthHeaders() },
			});
                        if (!res.ok) throw new Error(await getFriendlyResponseError(res, 'load translators'));
			const json = (await res.json()) as { translators?: Translator[] };
			setTranslators(Array.isArray(json.translators) ? json.translators : []);
		} catch (e) {
                        setTranslatorsError(getFriendlyRequestError({ error: e, action: 'load translators' }));
			setTranslators([]);
		} finally {
			setTranslatorsLoading(false);
		}
	};

	useEffect(() => {
                void (async () => {
                        await Promise.all([loadLanguages(), loadTranslators()]);
                })();
	}, []);

	const toggleLanguageId = (id: number) => {
		setSelectedLanguageIds((prev) => {
			const has = prev.includes(id);
			const next = has ? prev.filter((x) => x !== id) : [...prev, id];
			return normalizeLanguageIds(next);
		});
	};

	const toggleEditingLanguageId = (id: number) => {
		setEditingLanguageIds((prev) => {
			const has = prev.includes(id);
			const next = has ? prev.filter((x) => x !== id) : [...prev, id];
			return normalizeLanguageIds(next);
		});
	};

	const validateCreate = (): string | null => {
		if (!name.trim()) return 'Name is required.';
		if (!email.trim() || !isValidEmail(email)) return 'A valid email is required.';
		if (!phone.trim() || phone.trim().length < 5) return 'Phone number is required.';
		const langs = normalizeLanguageIds(selectedLanguageIds);
		if (langs.length === 0) return 'Select at least one language.';
		if (!profileImageUrl.trim()) return 'Profile image URL is required.';
		if (!isValidUrl(profileImageUrl.trim())) return 'Profile image URL must be a valid URL.';
		if (profileImagePublicId.trim() && profileImagePublicId.trim().length < 1) return 'Profile image publicId is invalid.';
		return null;
	};

	const createTranslator = async () => {
		const err = validateCreate();
		if (err) {
			setCreateError(err);
			return;
		}

		setCreating(true);
		setCreateError(null);
		try {
			const res = await fetch(`${API_BASE}/translators`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...getBackendAuthHeaders() },
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					phone: phone.trim(),
					profileImageUrl: profileImageUrl.trim() ? profileImageUrl.trim() : null,
					profileImagePublicId: profileImagePublicId.trim() ? profileImagePublicId.trim() : null,
					languageIds: normalizeLanguageIds(selectedLanguageIds),
				}),
			});

                        if (!res.ok) throw new Error(await getFriendlyResponseError(res, 'create translator'));

			const json = (await res.json()) as { translator?: Translator };
                        if (!json.translator) throw new Error(getFriendlyUnexpectedResponseError('create translator'));

setTranslators((prev) => [...prev, json.translator!].sort((a, b) => a.id - b.id));

                        // Reset form
                        setName('');
                        setEmail('');
                        setPhone('');
                        setProfileImageUrl('');
                        setProfileImagePublicId('');
                        setSelectedLanguageIds([]);
                        setShowCreateModal(false);
                } catch (e) {
                        setCreateError(getFriendlyRequestError({ error: e, action: 'create translator' }));
                } finally {
                        setCreating(false);
                }
        };

        const handleEditClick = (translator: Translator) => {
                setEditingId(translator.id);
                setEditingLanguageIds(translatorLanguageIds(translator));
        };

        const saveEdit = async () => {
                if (editingId === null) return;

                const langs = normalizeLanguageIds(editingLanguageIds);
                if (langs.length === 0) {
                        setEditError('Select at least one language.');
                        return;
                }

                setSavingEdit(true);
                setEditError(null);
                try {
                        const res = await fetch(`${API_BASE}/translators/${editingId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', ...getBackendAuthHeaders() },
                                body: JSON.stringify({ languageIds: langs }),
                        });

                                                if (!res.ok) throw new Error(await getFriendlyResponseError(res, 'update translator'));

                        const json = (await res.json()) as { translator?: Translator };
                                                if (!json.translator) throw new Error(getFriendlyUnexpectedResponseError('update translator'));

                        setTranslators((prev) =>
                                prev.map((t) => (t.id === editingId ? json.translator! : t))
                        );
                        setEditingId(null);
                        setEditingLanguageIds([]);
                } catch (e) {
                                                setEditError(getFriendlyRequestError({ error: e, action: 'update translator' }));
                } finally {
                        setSavingEdit(false);
                }
        };

const deleteTranslator = async (id: number) => {
                if (!confirm('Are you sure you want to delete this translator?')) return;

                try {
                        const res = await fetch(`${API_BASE}/translators/${id}`, {
                                method: 'DELETE',
                                headers: { ...getBackendAuthHeaders() },
                        });

                                                if (!res.ok) throw new Error(await getFriendlyResponseError(res, 'delete translator'));

                        setTranslators((prev) => prev.filter((t) => t.id !== id));
                } catch (e) {
                                                alert(getFriendlyRequestError({ error: e, action: 'delete translator' }));
                }
        };

        // Language CRUD functions
        const createLanguage = async () => {
                if (!languageTitle.trim()) {
                        setLanguageCreateError('Language title is required.');
                        return;
                }
                                        const builtPrices = buildPricesForSubmit(languagePrices);
                                        if (!builtPrices.prices) {
                                                setLanguageCreateError(builtPrices.error ?? 'All prices must be positive numbers.');
                                                return;
                                        }

                setCreatingLanguage(true);
                setLanguageCreateError(null);
                try {
                        const res = await fetch(`${API_BASE}/languages`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', ...getBackendAuthHeaders() },
                                body: JSON.stringify({
                                        title: languageTitle.trim(),
                                                        prices: builtPrices.prices,
                                }),
                        });

                                                if (!res.ok) throw new Error(await getFriendlyResponseError(res, 'create language'));

                        const json = (await res.json()) as { language?: Language };
                                                if (!json.language) throw new Error(getFriendlyUnexpectedResponseError('create language'));

                        setLanguages((prev) => [...prev, json.language!].sort((a, b) => a.id - b.id));
                        setLanguageTitle('');
                                        setLanguagePrices(emptyMultiCurrencyPrices());
                } catch (e) {
                                                setLanguageCreateError(getFriendlyRequestError({ error: e, action: 'create language' }));
                } finally {
                        setCreatingLanguage(false);
                }
        };

        const handleEditLanguageClick = (lang: Language) => {
                setEditingLanguageId(lang.id);
                setEditingLanguageTitle(lang.title);
                setEditingLanguagePrices(readLanguagePrices(lang.prices));
        };

        const saveLanguageEdit = async () => {
                if (editingLanguageId === null) return;

                if (!editingLanguageTitle.trim()) {
                        setLanguageEditError('Language title is required.');
                        return;
                }
                const builtPrices = buildPricesForSubmit(editingLanguagePrices);
                if (!builtPrices.prices) {
                        setLanguageEditError(builtPrices.error ?? 'All prices must be positive numbers.');
                        return;
                }

                setSavingLanguageEdit(true);
                setLanguageEditError(null);
                try {
                        const res = await fetch(`${API_BASE}/languages/${editingLanguageId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', ...getBackendAuthHeaders() },
                                body: JSON.stringify({
                                        title: editingLanguageTitle.trim(),
                                                        prices: builtPrices.prices,
                                }),
                        });

                                                if (!res.ok) throw new Error(await getFriendlyResponseError(res, 'update language'));

                        const json = (await res.json()) as { language?: Language };
                                                if (!json.language) throw new Error(getFriendlyUnexpectedResponseError('update language'));

                        setLanguages((prev) =>
                                prev.map((l) => (l.id === editingLanguageId ? json.language! : l))
                        );
                        setEditingLanguageId(null);
                        setEditingLanguageTitle('');
                        setEditingLanguagePrices(emptyMultiCurrencyPrices());
                } catch (e) {
                                                setLanguageEditError(getFriendlyRequestError({ error: e, action: 'update language' }));
                } finally {
                        setSavingLanguageEdit(false);
                }
        };

        const deleteLanguage = async (id: number) => {
                if (!confirm('Are you sure you want to delete this language? This will also remove it from all translators.')) return;

                try {
                        const res = await fetch(`${API_BASE}/languages/${id}`, {
                                method: 'DELETE',
                                headers: { ...getBackendAuthHeaders() },
                        });

                                                if (!res.ok) throw new Error(await getFriendlyResponseError(res, 'delete language'));

                        setLanguages((prev) => prev.filter((l) => l.id !== id));
                        // Also update translators to remove this language
                        setTranslators((prev) =>
                                prev.map((t) => ({
                                        ...t,
                                        languages: (t.languages || []).filter((l) => l.languageId !== id)
                                }))
                        );
                } catch (e) {
                                                alert(getFriendlyRequestError({ error: e, action: 'delete language' }));
                }
        };

        return (
                <main className="min-h-screen bg-white pt-16 text-gray-900">
                        <section className="border-b border-border bg-white py-8">
                                <div className="ykb-container">
                                        <div className="max-w-2xl">
                                                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Manage translation services</p>
                                                <h1 className="text-3xl font-semibold text-primary md:text-4xl">Translator Languages</h1>
                                                <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
                                                                                Create languages and set fixed prices for hour, week, and month.
                                                </p>
                                        </div>
                                </div>
                        </section>

                        <div className="ykb-container mt-8">
                                <div className="flex flex-wrap gap-2 border-b border-border pb-4">
                                        <button
                                                type="button"
                                                onClick={() => setActiveTab('languages')}
                                                className={activeTab === 'languages' ? 'ykb-button-solid' : 'ykb-button-outline'}
                                        >
                                                Languages & Prices
                                        </button>
                                        <button
                                                type="button"
                                                onClick={() => setActiveTab('translators')}
                                                className={activeTab === 'translators' ? 'ykb-button-solid' : 'ykb-button-outline'}
                                        >
                                                Translators
                                        </button>
                                </div>
                        </div>

                        {/* Languages Section */}
                        <section className={activeTab === 'languages' ? 'ykb-section bg-surface/50' : 'ykb-section bg-surface/50 hidden'}>
                                <div className="ykb-container">
                                        <div className="mb-6 flex items-center justify-between">
                                                <h2 className="text-xl font-bold text-primary">Languages</h2>
                                        </div>

                                        {/* Create Language Form */}
                                        <div className="ykb-card mb-6">
                                                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                                        <div className="flex-1">
                                                                <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="language-title">
                                                                        Language Name *
                                                                </label>
                                                                <input
                                                                        id="language-title"
                                                                        type="text"
                                                                        value={languageTitle}
                                                                        onChange={(e) => setLanguageTitle(e.target.value)}
                                                                        className="ykb-field"
                                                                        placeholder="e.g., Kinyarwanda, English, French"
                                                                />
                                                        </div>
                                                        {PRICE_FIELDS.map((field) => (
                                                                <div key={field.key} className="w-44">
                                                                        <label className="mb-1.5 block text-sm font-semibold text-primary">
                                                                                {field.label}
                                                                        </label>
                                                                        <div className="flex gap-2">
                                                                                <div className="flex-1">
                                                                                        <input
                                                                                                id={`language-price-usd-${field.key}`}
                                                                                                type="number"
                                                                                                value={languagePrices.usd[field.key]}
                                                                                                onChange={(e) => setLanguagePrices((prev) => ({ ...prev, usd: { ...prev.usd, [field.key]: e.target.value } }))}
                                                                                                className="ykb-field"
                                                                                                min="1"
                                                                                                placeholder={`USD ${field.placeholder}`}
                                                                                        />
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                        <input
                                                                                                id={`language-price-rwf-${field.key}`}
                                                                                                type="number"
                                                                                                value={languagePrices.rwf[field.key]}
                                                                                                onChange={(e) => setLanguagePrices((prev) => ({ ...prev, rwf: { ...prev.rwf, [field.key]: e.target.value } }))}
                                                                                                className="ykb-field"
                                                                                                min="1"
                                                                                                placeholder={`RWF ${field.placeholder}`}
                                                                                        />
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        ))}
                                                        <button
                                                                type="button"
                                                                onClick={createLanguage}
                                                                disabled={creatingLanguage}
                                                                className="ykb-button-solid"
                                                        >
                                                                {creatingLanguage ? 'Adding...' : 'Add Language'}
                                                        </button>
                                                </div>
                                                {languageCreateError && (
                                                        <div className="mt-3 ykb-alert ykb-alert-error">{languageCreateError}</div>
                                                )}
                                        </div>

                                        {/* Languages List */}
                                        {languagesLoading ? (
                                                <div className="ykb-card">
                                                        <p className="text-sm text-textSecondary">Loading languages...</p>
                                                </div>
                                        ) : languagesError ? (
                                                <div className="ykb-card">
                                                        <div className="ykb-alert ykb-alert-error">{languagesError}</div>
                                                </div>
                                        ) : languages.length === 0 ? (
                                                <div className="ykb-card">
                                                        <div className="ykb-alert ykb-alert-info">
                                                                No languages yet. Add a language above to get started.
                                                        </div>
                                                </div>
                                        ) : (
                                                <div className="overflow-hidden rounded-lg border border-border bg-border">
                                                        <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3">
                                                                {languages.map((lang) => (
                                                                        <div
                                                                                key={lang.id}
                                                                                className="bg-white p-4"
                                                                        >
                                                                                <div className="flex items-start justify-between">
                                                                                        <div>
                                                                                                <h3 className="text-base font-semibold text-primary">{lang.title}</h3>
                                                                                                <PriceGrid prices={lang.prices} />
                                                                                        </div>
                                                                                        <div className="flex gap-1">
                                                                                                <button
                                                                                                        type="button"
                                                                                                        onClick={() => handleEditLanguageClick(lang)}
                                                                                                        className="ykb-button-outline text-xs px-2 py-1"
                                                                                                >
                                                                                                        Edit
                                                                                                </button>
                                                                                                <button
                                                                                                        type="button"
                                                                                                        onClick={() => deleteLanguage(lang.id)}
                                                                                                        className="ykb-button-outline border-red-200! text-red-600! hover:bg-red-50! text-xs px-2 py-1"
                                                                                                >
                                                                                                        Delete
                                                                                                </button>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                ))}
                                                        </div>
                                                </div>
                                        )}
                                </div>
                        </section>

                        <section className={activeTab === 'translators' ? 'ykb-section bg-surface/50' : 'ykb-section bg-surface/50 hidden'}>
                                <div className="ykb-container">
                                        {/* Create Button */}
                                        <div className="mb-6 flex justify-end">
                                                <button
                                                        type="button"
                                                        onClick={() => setShowCreateModal(true)}
                                                        className="ykb-button-solid"
                                                >
                                                        + Add New Translator
                                                </button>
                                        </div>

                                        {/* Languages Loading/Error */}
                                        {languagesLoading ? (
                                                <div className="ykb-card">
                                                        <p className="text-sm text-textSecondary">Loading languages…</p>
                                                </div>
                                        ) : languagesError ? (
                                                <div className="ykb-card">
                                                        <div className="ykb-alert ykb-alert-error">{languagesError}</div>
                                                </div>
                                        ) : null}

                                        {/* Translators Loading/Error */}
                                        {translatorsLoading ? (
                                                <div className="ykb-card">
                                                        <p className="text-sm text-textSecondary">Loading translators…</p>
                                                </div>
                                        ) : translatorsError ? (
                                                <div className="ykb-card">
                                                        <div className="ykb-alert ykb-alert-error">{translatorsError}</div>
                                                </div>
                                        ) : translators.length === 0 ? (
                                                <div className="ykb-card">
                                                        <div className="ykb-alert ykb-alert-info">
                                                                No translators yet. Click "Add New Translator" to create one.
                                                        </div>
                                                </div>
                                        ) : (
                                                <div className="overflow-hidden rounded-lg border border-border bg-border">
                                                        <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3">
                                                                {translators.map((translator) => (
                                                                        <div
                                                                                key={translator.id}
                                                                                className="bg-white p-5"
                                                                        >
                                                                                <div className="mb-3 flex items-start gap-4">
                                                                                        {translator.profileImageUrl ? (
                                                                                                <img
                                                                                                        src={translator.profileImageUrl}
                                                                                                        alt={translator.name}
                                                                                                        className="h-16 w-16 rounded-full object-cover border border-border"
                                                                                                />
                                                                                        ) : (
                                                                                                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface text-2xl font-semibold text-primary">
                                                                                                        {translator.name.charAt(0).toUpperCase()}
                                                                                                </div>
                                                                                        )}
                                                                                        <div className="min-w-0 grow">
                                                                                                <h3 className="text-lg font-semibold text-primary truncate">
                                                                                                        {translator.name}
                                                                                                </h3>
                                                                                                <p className="text-sm text-textSecondary truncate">
                                                                                                        {translator.email}
                                                                                                </p>
                                                                                                <p className="text-sm text-textSecondary">
                                                                                                        {translator.phone}
                                                                                                </p>
                                                                                        </div>
                                                                                </div>

                                                                                <div className="mb-4">
                                                                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary mb-2">
                                                                                                Linked Languages
                                                                                        </div>
                                                                                        <div className="flex flex-wrap gap-1">
                                                                                                {translator.languages?.length > 0 ? (
                                                                                                        translator.languages.map((link) => {
                                                                                                                const language = languageById.get(link.languageId);
                                                                                                                if (!language) return <span key={link.languageId} className="text-sm text-textSecondary">Language {link.languageId}</span>;
                                                                                                                return (
                                                                                                                        <div key={link.languageId} className="rounded-md border border-secondary/20 bg-secondary/10 px-3 py-2 text-sm text-primary">
                                                                                                                                <div className="font-semibold text-xs mb-1">{language.title}</div>
                                                                                                                                <PriceGrid prices={language.prices} />
                                                                                                                        </div>
                                                                                                                );
                                                                                                        })
                                                                                                ) : (
                                                                                                        <span className="text-sm text-textSecondary">No languages assigned</span>
                                                                                                )}
                                                                                        </div>
                                                                                </div>

                                                                                <div className="flex gap-2">
                                                                                        <button
                                                                                                type="button"
                                                                                                onClick={() => handleEditClick(translator)}
                                                                                                className="ykb-button-outline flex-1"
                                                                                        >
                                                                                                Edit Languages
                                                                                        </button>
                                                                                        <button
                                                                                                type="button"
                                                                                                onClick={() => deleteTranslator(translator.id)}
                                                                                                className="ykb-button-outline border-red-200! text-red-600! hover:bg-red-50!"
                                                                                        >
                                                                                                Delete
                                                                                        </button>
                                                                                </div>
                                                                        </div>
                                                                ))}
                                                        </div>
                                                </div>
                                        )}
                                </div>
                        </section>

                        {/* Create Modal */}
                        {showCreateModal && (
                                <div
                                                        className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
                                        role="dialog"
                                        aria-modal="true"
                                        onClick={() => setShowCreateModal(false)}
                                >
                                        <div className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
                                                <div className="ykb-card">
                                                        <div className="flex items-start justify-between gap-4 mb-5">
                                                                <div>
                                                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">
                                                                                Create Translator
                                                                        </div>
                                                                        <h2 className="mt-2 text-xl font-semibold text-primary">
                                                                                Add New Translator
                                                                        </h2>
                                                                        <p className="mt-1 text-sm text-textSecondary">
                                                                                Fill in the details and assign languages.
                                                                        </p>
                                                                </div>
                                                                <button
                                                                        type="button"
                                                                        className="ykb-button-outline"
                                                                        onClick={() => setShowCreateModal(false)}
                                                                >
                                                                        Close
                                                                </button>
                                                        </div>

                                                        <div className="space-y-4">
                                                                <div>
                                                                        <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="translator-name">
                                                                                Name *
                                                                        </label>
                                                                        <input
                                                                                id="translator-name"
                                                                                type="text"
                                                                                value={name}
                                                                                onChange={(e) => setName(e.target.value)}
                                                                                className="ykb-field"
                                                                                placeholder="e.g., John Doe"
                                                                        />
                                                                </div>

                                                                <div>
                                                                        <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="translator-email">
                                                                                Email *
                                                                        </label>
                                                                        <input
                                                                                id="translator-email"
                                                                                type="email"
                                                                                value={email}
                                                                                onChange={(e) => setEmail(e.target.value)}
                                                                                className="ykb-field"
                                                                                placeholder="e.g., john@example.com"
                                                                        />
                                                                </div>

                                                                <div>
                                                                        <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="translator-phone">
                                                                                Phone *
                                                                        </label>
                                                                        <input
                                                                                id="translator-phone"
                                                                                type="tel"
                                                                                value={phone}
                                                                                onChange={(e) => setPhone(e.target.value)}
                                                                                className="ykb-field"
                                                                                placeholder="e.g., +250 780 000 000"
                                                                        />
                                                                </div>

                                                                <div>
                                                                        <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="translator-image">
                                                                                Profile Image URL *
                                                                        </label>
                                                                        <input
                                                                                id="translator-image"
                                                                                type="url"
                                                                                value={profileImageUrl}
                                                                                onChange={(e) => setProfileImageUrl(e.target.value)}
                                                                                className="ykb-field"
                                                                                placeholder="https://example.com/image.jpg"
                                                                        />
                                                                </div>

                                                                <div>
                                                                        <label className="mb-1.5 block text-sm font-semibold text-primary">
                                                                                Select Languages *
                                                                        </label>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                {languages.map((lang) => (
                                                                                        <label
                                                                                                key={lang.id}
                                                                                                className="flex items-center gap-2 cursor-pointer"
                                                                                        >
                                                                                                <input
                                                                                                        type="checkbox"
                                                                                                        checked={selectedLanguageIds.includes(lang.id)}
                                                                                                        onChange={() => toggleLanguageId(lang.id)}
                                                                                                        className="h-4 w-4 rounded border-border text-secondary focus:ring-secondary"
                                                                                                />
                                                                                                <span className="text-sm text-primary">{lang.title}</span>
                                                                                        </label>
                                                                                ))}
                                                                        </div>
                                                                </div>

                                                                {createError && (
                                                                        <div className="ykb-alert ykb-alert-error">{createError}</div>
                                                                )}

                                                                <button
                                                                        type="button"
                                                                        onClick={createTranslator}
                                                                        disabled={creating}
                                                                        className="w-full ykb-button-solid disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                        {creating ? 'Creating…' : 'Create Translator'}
                                                                </button>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        )}

{/* Edit Modal */}
                        {editingId !== null && (
                                <div
                                                        className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
                                        role="dialog"
                                        aria-modal="true"
                                        onClick={() => setEditingId(null)}
                                >
                                        <div className="w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
                                                <div className="ykb-card">
                                                        <div className="flex items-start justify-between gap-4 mb-5">
                                                                <div>
                                                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">
                                                                                Edit Languages
                                                                        </div>
                                                                        <h2 className="mt-2 text-xl font-semibold text-primary">
                                                                                Update Language Assignment
                                                                        </h2>
                                                                </div>
                                                                <button
                                                                        type="button"
                                                                        className="ykb-button-outline"
                                                                        onClick={() => setEditingId(null)}
                                                                >
                                                                        Close
                                                                </button>
                                                        </div>

                                                        <div className="space-y-4">
                                                                <div>
                                                                        <label className="mb-1.5 block text-sm font-semibold text-primary">
                                                                                Select Languages *
                                                                        </label>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                                {languages.map((lang) => (
                                                                                        <label
                                                                                                key={lang.id}
                                                                                                className="flex items-center gap-2 cursor-pointer"
                                                                                        >
                                                                                                <input
                                                                                                        type="checkbox"
                                                                                                        checked={editingLanguageIds.includes(lang.id)}
                                                                                                        onChange={() => toggleEditingLanguageId(lang.id)}
                                                                                                        className="h-4 w-4 rounded border-border text-secondary focus:ring-secondary"
                                                                                                />
                                                                                                <span className="text-sm text-primary">{lang.title}</span>
                                                                                        </label>
                                                                                ))}
                                                                        </div>
                                                                </div>

                                                                {editError && (
                                                                        <div className="ykb-alert ykb-alert-error">{editError}</div>
                                                                )}

                                                                <button
                                                                        type="button"
                                                                        onClick={saveEdit}
                                                                        disabled={savingEdit}
                                                                        className="w-full ykb-button-solid disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                        {savingEdit ? 'Saving…' : 'Save Changes'}
                                                                </button>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        )}

                        {/* Edit Language Modal */}
                        {editingLanguageId !== null && (
                                <div
                                                        className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 px-4"
                                        role="dialog"
                                        aria-modal="true"
                                        onClick={() => setEditingLanguageId(null)}
                                >
                                        <div className="w-full max-w-md" onClick={(event) => event.stopPropagation()}>
                                                <div className="ykb-card">
                                                        <div className="flex items-start justify-between gap-4 mb-5">
                                                                <div>
                                                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">
                                                                                Edit Language
                                                                        </div>
                                                                        <h2 className="mt-2 text-xl font-semibold text-primary">
                                                                                Update Language
                                                                        </h2>
                                                                </div>
                                                                <button
                                                                        type="button"
                                                                        className="ykb-button-outline"
                                                                        onClick={() => setEditingLanguageId(null)}
                                                                >
                                                                        Close
                                                                </button>
                                                        </div>

                                                        <div className="space-y-4">
                                                                <div>
                                                                        <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="edit-language-title">
                                                                                Language Name *
                                                                        </label>
                                                                        <input
                                                                                id="edit-language-title"
                                                                                type="text"
                                                                                value={editingLanguageTitle}
                                                                                onChange={(e) => setEditingLanguageTitle(e.target.value)}
                                                                                className="ykb-field"
                                                                        />
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                                        {PRICE_FIELDS.map((field) => (
                                                                                <div key={field.key}>
                                                                                        <label className="mb-1.5 block text-sm font-semibold text-primary">
                                                                                                {field.label}
                                                                                        </label>
                                                                                        <div className="flex gap-2">
                                                                                                <div className="flex-1">
                                                                                                        <input
                                                                                                                id={`edit-language-price-usd-${field.key}`}
                                                                                                                type="number"
                                                                                                                value={editingLanguagePrices.usd[field.key]}
                                                                                                                onChange={(e) => setEditingLanguagePrices((prev) => ({ ...prev, usd: { ...prev.usd, [field.key]: e.target.value } }))}
                                                                                                                className="ykb-field"
                                                                                                                min="1"
                                                                                                                placeholder={`USD ${field.placeholder}`}
                                                                                                        />
                                                                                                </div>
                                                                                                <div className="flex-1">
                                                                                                        <input
                                                                                                                id={`edit-language-price-rwf-${field.key}`}
                                                                                                                type="number"
                                                                                                                value={editingLanguagePrices.rwf[field.key]}
                                                                                                                onChange={(e) => setEditingLanguagePrices((prev) => ({ ...prev, rwf: { ...prev.rwf, [field.key]: e.target.value } }))}
                                                                                                                className="ykb-field"
                                                                                                                min="1"
                                                                                                                placeholder={`RWF ${field.placeholder}`}
                                                                                                        />
                                                                                                </div>
                                                                                        </div>
                                                                                </div>
                                                                        ))}
                                                                </div>

                                                                {languageEditError && (
                                                                        <div className="ykb-alert ykb-alert-error">{languageEditError}</div>
                                                                )}

                                                                <button
                                                                        type="button"
                                                                        onClick={saveLanguageEdit}
                                                                        disabled={savingLanguageEdit}
                                                                        className="w-full ykb-button-solid disabled:cursor-not-allowed disabled:opacity-60"
                                                                >
                                                                        {savingLanguageEdit ? 'Saving...' : 'Save Changes'}
                                                                </button>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                        )}
                </main>
        );
}
