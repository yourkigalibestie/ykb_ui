import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Copy, ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { API_BASE } from '../utils/backendAuth';
import type { BackendProviderProfile, ProviderServiceOffering } from '../utils/backendProviders';
import { getFriendlyRequestError } from '../utils/friendlyErrors';
import appStoreIcon from '../assets/icons/appstore.png';
import playStoreIcon from '../assets/icons/playstore.png';
import webAppIcon from '../assets/icons/webApp.png';

function normalizeWhatsappPhone(value: string): string | null {
	const raw = value.trim();
	if (!raw) return null;

	const digits = raw.replace(/[^0-9+]/g, '');
	const plusStripped = digits.startsWith('+') ? digits.slice(1) : digits;
	const normalized = plusStripped.replace(/[^0-9]/g, '');

	if (!normalized) return null;

	// Rwanda common formats:
	// - 07xxxxxxxx -> 2507xxxxxxxx
	// - 7xxxxxxxx -> 2507xxxxxxxx
	if (normalized.length === 10 && normalized.startsWith('07')) return `250${normalized.slice(1)}`;
	if (normalized.length === 9 && normalized.startsWith('7')) return `250${normalized}`;

	return normalized;
}

function initials(name: string): string {
	const parts = name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2);
	if (parts.length === 0) return 'SP';
	return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

function safeOfferings(value: unknown): ProviderServiceOffering[] {
	if (!Array.isArray(value)) return [];

	const rows: ProviderServiceOffering[] = [];

	value.forEach((row) => {
		if (!row || typeof row !== 'object') return;
		const r = row as Record<string, unknown>;
		const name = typeof r.name === 'string' ? r.name.trim() : '';
		const price = typeof r.price === 'string' ? r.price.trim() : '';
		const description = typeof r.description === 'string' ? r.description.trim() : '';
		if (!name) return;

		const item: ProviderServiceOffering = { name, price };
		if (description) item.description = description;
		rows.push(item);
	});

	return rows;
}

function normalizeHttpUrl(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (!trimmed) return null;

	try {
		const url = new URL(trimmed);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
	} catch {
		// try with https prefix for plain domains
	}

	try {
		const withProtocol = new URL(`https://${trimmed}`);
		return withProtocol.toString();
	} catch {
		return null;
	}
}

function offeringIcon(name: string): { icon: string; label: string } {
	const normalized = name.trim().toLowerCase();
	if (normalized.includes('app store')) return { icon: appStoreIcon, label: 'App Store' };
	if (normalized.includes('play store')) return { icon: playStoreIcon, label: 'Play Store' };
	if (normalized.includes('web app')) return { icon: webAppIcon, label: 'Web App' };
	return { icon: webAppIcon, label: 'Link' };
}

export function ServiceProviders() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [providers, setProviders] = useState<BackendProviderProfile[]>([]);
	const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
	const [error, setError] = useState<string | null>(null);
	const [copiedLink, setCopiedLink] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	const serviceFilter = searchParams.get('service');
	const normalizedServiceFilter = (serviceFilter ?? '').trim().toLowerCase();

	const handleCopyLink = (url: string) => {
		navigator.clipboard.writeText(url).then(() => {
			setCopiedLink(url);
			setTimeout(() => setCopiedLink(null), 2000);
		});
	};

	const loadProviders = useCallback(async () => {
		setStatus('loading');
		setError(null);

		try {
			const res = await fetch(`${API_BASE}/providers`);
			if (!res.ok) {
				throw new Error(
					getFriendlyRequestError({
						status: res.status,
						action: 'load service providers',
					})
				);
			}

			const json = (await res.json()) as { providers?: BackendProviderProfile[] };
			const list = Array.isArray(json.providers) ? json.providers : [];
			setProviders(list);
			setStatus('ready');
		} catch (err) {
			setProviders([]);
			setError(
				err instanceof Error && err.message.trim().length > 0
					? err.message
					: getFriendlyRequestError({ error: err, action: 'load service providers' })
			);
			setStatus('error');
		}
	}, []);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			void loadProviders();
		}, 0);

		return () => window.clearTimeout(timer);
	}, [loadProviders, reloadKey]);

	const approvedProviders = useMemo(() => {
		return providers.filter((p) => (p.status ?? '').toUpperCase() === 'APPROVED');
	}, [providers]);

	const filteredProviders = useMemo(() => {
		const list = approvedProviders;
		if (!normalizedServiceFilter) return list;

		return list.filter((provider) => {
			const mainService = (provider.mainService ?? '').trim().toLowerCase();
			if (mainService && (mainService === normalizedServiceFilter || mainService.includes(normalizedServiceFilter))) {
				return true;
			}

			const offerings = safeOfferings(provider.serviceOfferings);
			return offerings.some((o) => {
				const name = (o.name ?? '').trim().toLowerCase();
				return name === normalizedServiceFilter || name.includes(normalizedServiceFilter);
			});
		});
	}, [approvedProviders, normalizedServiceFilter]);

	return (
		<main className="pt-16">
			<section className="border-b border-border bg-white py-8">
				<div className="ykb-container">
					<div className="max-w-2xl">
						<p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Service Providers</p>
						<h1 className="text-3xl font-semibold text-primary md:text-4xl">Find a provider</h1>
						<p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
							Browse verified providers for the service you need.
						</p>
					</div>
				</div>
			</section>

			<section className="ykb-section bg-dark-light">
				<div className="ykb-container">
					{serviceFilter ? (
						<div className="mb-4 ykb-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">Filtered by service</div>
								<div className="mt-1 text-lg font-semibold text-primary">{serviceFilter}</div>
								<div className="mt-1 text-sm text-textSecondary">Showing {filteredProviders.length} provider(s).</div>
							</div>
							<button type="button" className="ykb-button-outline" onClick={() => setSearchParams({})}>
								Clear filter
							</button>
						</div>
					) : null}

					{status === 'loading' || status === 'idle' ? (
						<div className="ykb-card">
							<p className="text-sm text-textSecondary">Loading service providers…</p>
						</div>
					) : status === 'error' ? (
						<div className="ykb-card">
							<div className="ykb-alert ykb-alert-error">{error ?? 'We could not load service providers right now. Please try again.'}</div>
							<button
								type="button"
								onClick={() => setReloadKey((v) => v + 1)}
								className="mt-3 ykb-button-outline"
							>
								Try again
							</button>
						</div>
					) : filteredProviders.length === 0 ? (
						<div className="ykb-card">
							<div className="ykb-alert ykb-alert-info">No verified providers match this service yet.</div>
						</div>
					) : (
						<div className="space-y-4">
							{filteredProviders.map((provider) => {
								const displayName = provider.businessName ?? provider.user?.name ?? 'Service Provider';
								const offerings = safeOfferings(provider.serviceOfferings);
								const phone = provider.user?.phone?.trim() ?? '';
								const waPhone = phone ? normalizeWhatsappPhone(phone) : null;
								const profileImageUrl = provider.profileImageUrl?.trim() ?? '';

								return (
									<article key={provider.id} className="ykb-card">
										<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
											<div className="flex items-start gap-4">
												<div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface flex items-center justify-center shadow-sm">
													{profileImageUrl ? (
														<img
															src={profileImageUrl}
															alt={displayName}
															className="h-full w-full object-cover"
															loading="lazy"
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center bg-[#d8dbdf]">
															<span className="text-lg font-semibold text-primary">{initials(displayName)}</span>
														</div>
													)}
												</div>

												<div className="min-w-0">
													  <h2 className="text-lg font-semibold text-primary wrap-break-word">{displayName}</h2>
													<p className="mt-0.5 text-sm font-medium text-primary">{provider.mainService ?? '—'}</p>

													<div className="mt-3 grid grid-cols-1 gap-2 text-sm text-textSecondary md:grid-cols-2">
														<div className="flex items-center gap-2">
															<MapPin className="h-4 w-4 text-textSecondary" />
															<span className="truncate">{provider.location ?? '—'}</span>
														</div>
														<div className="flex items-center gap-2">
															<Mail className="h-4 w-4 text-textSecondary" />
															{provider.user?.email ? (
																<a
																	className="truncate hover:text-secondary"
																	href={`mailto:${provider.user.email}`}
																	title={provider.user.email}
																>
																	{provider.user.email}
																</a>
															) : (
																<span>—</span>
															)}
														</div>
														<div className="flex items-center gap-2">
															<Phone className="h-4 w-4 text-textSecondary" />
															<span className="truncate">{phone || '—'}</span>
														</div>
														<div className="flex items-center gap-2">
															<MessageCircle className="h-4 w-4 text-textSecondary" />
															<span className="truncate">{waPhone ? waPhone : '—'}</span>
														</div>
													</div>

													{provider.bio ? (
														<p className="mt-3 text-sm text-textSecondary">{provider.bio}</p>
													) : null}
												</div>
											</div>

											<div className="flex flex-wrap gap-2 sm:flex-col sm:items-end sm:justify-start">
												{waPhone ? (
													<a
														className="ykb-button-primary"
														href={`https://wa.me/${encodeURIComponent(waPhone)}?text=${encodeURIComponent(
															`Hello ${displayName}, I found you on Your Kigali Bestie. I would like help with: ${serviceFilter ?? provider.mainService ?? 'a service'}.`
														)}`}
														target="_blank"
														rel="noreferrer"
													>
														WhatsApp
													</a>
												) : (
													<span className="text-xs text-textSecondary">No WhatsApp number</span>
												)}

												{/* <Link
													to={`/request?service=${encodeURIComponent(serviceFilter ?? provider.mainService ?? '')}`}
													className="ykb-button-outline"
												>
													Request service
												</Link> */}
											</div>
										</div>

										<div className="mt-4">
											<div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">Services</div>
											{offerings.length === 0 ? (
												<div className="mt-2 text-sm text-textSecondary">No service offerings listed yet.</div>
											) : (
												<div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
													{offerings.map((o, idx) => (
														<div key={`${provider.id}-${idx}-${o.name}`} className="rounded-md border border-border bg-white px-3 py-2">
															<div className="flex items-start justify-between gap-3">
																<div className="text-sm font-semibold text-primary">{o.name}</div>
																{o.price ? (
																	<div className="text-sm font-semibold text-primary">{o.price}</div>
																) : null}
															</div>
																		{(() => {
																			const link = normalizeHttpUrl(o.description);
																			if (!link) {
																				return o.description ? (
																					<div className="mt-1 text-xs text-textSecondary">{o.description}</div>
																				) : null;
																			}

																			const meta = offeringIcon(o.name);
																			return (
																				<div className="mt-2 rounded-md border border-border p-3 hover:bg-secondary/5 transition-colors">
																					<div className="flex items-center gap-2 mb-2">
																						<img src={meta.icon} alt={meta.label} className="h-5 w-5" />
																						<span className="text-sm font-semibold text-primary">{meta.label}</span>
																					</div>
																					<div className="flex items-center gap-2 bg-surface rounded px-2 py-1">
																						<a
																							className="flex-1 text-xs text-textSecondary hover:text-secondary truncate"
																							href={link}
																							target="_blank"
																							rel="noreferrer"
																							title={link}
																						>
																								{link}
																							</a>
																						<div className="flex gap-1">
																							<button
																								onClick={() => handleCopyLink(link)}
																								className="p-1 hover:bg-secondary/20 rounded transition-colors"
																								title="Copy link"
																							>
																								{copiedLink === link ? (
																									<Check className="h-4 w-4 text-green-500" />
																								) : (
																									<Copy className="h-4 w-4 text-textSecondary hover:text-primary" />
																								)}
																							</button>
																							<a
																								href={link}
																								target="_blank"
																								rel="noreferrer"
																								className="p-1 hover:bg-secondary/20 rounded transition-colors"
																								title="Open in new tab"
																							>
																								<ExternalLink className="h-4 w-4 text-textSecondary hover:text-primary" />
																							</a>
																						</div>
																					</div>
																				</div>
																			);
																		})()}
														</div>
													))}
												</div>
											)}
										</div>
									</article>
								);
							})}
						</div>
					)}
				</div>
			</section>
		</main>
	);
}

