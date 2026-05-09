import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Globe, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import playStoreBadge from '../../assets/icons/playstore.png';
import appStoreBadge from '../../assets/icons/appstore.png';
import { BackendAuthError, getBackendSession } from '../../utils/backendAuth';
import { fetchProviderMeProfile, type BackendProviderProfile } from '../../utils/backendProviders';

type AppLinkPreview = {
	label: 'Web app' | 'Play Store' | 'App Store';
	kind: 'web' | 'play' | 'app';
	url: string | null;
	icon: ReactNode;
};

function normalizeText(value: string): string {
	return value.trim().toLowerCase();
}

function isValidUrl(value: string | null | undefined): value is string {
	if (!value) return false;
	try {
		new URL(value);
		return true;
	} catch {
		return false;
	}
}

function buildAppLinkPreviews(provider: BackendProviderProfile): AppLinkPreview[] {
	const offerings = Array.isArray(provider.serviceOfferings) ? provider.serviceOfferings : [];

	const findUrl = (names: string[]): string | null => {
		const match = offerings.find((item) => names.includes(normalizeText(item.name)));
		return isValidUrl(match?.description) ? match!.description!.trim() : null;
	};

	return [
		{
			label: 'Web app',
			kind: 'web',
			url: findUrl(['web app']),
			icon: <Globe className="h-4 w-4" />,
		},
		{
			label: 'Play Store',
			kind: 'play',
			url: findUrl(['play store']),
			icon: <img src={playStoreBadge} alt="Google Play" className="h-10 w-auto object-contain" />,
		},
		{
			label: 'App Store',
			kind: 'app',
			url: findUrl(['app store']),
			icon: <img src={appStoreBadge} alt="App Store" className="h-10 w-auto object-contain" />,
		},
	];
}

function SubscriptionsSection() {
	const navigate = useNavigate();
	const { t } = useTranslation();

	return (
		<section className="ykb-card">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
						<CreditCard className="h-5 w-5 text-secondary" />
					</div>
					<div>
						<div className="text-sm font-semibold text-gray-900">{t('provider.subscriptionPlans')}</div>
						<div className="text-xs text-textSecondary">{t('provider.upgradeServiceFeatures')}</div>
					</div>
				</div>
				<button
					onClick={() => navigate('/plans')}
					className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary/90"
				>
					{t('provider.browsePlans')}
				</button>
			</div>
		</section>
	);
}

interface AppLinkTileProps extends AppLinkPreview {
	t: (key: string) => string;
}

function AppLinkTile({ label, url, icon, t }: AppLinkTileProps) {
	return (
		<div className="rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
			<div className="flex min-h-[96px] items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
						{icon}
					</div>
					<div>
						<div className="text-sm font-semibold text-gray-900">{label}</div>
						<div className="text-xs text-textSecondary">{url ? t('provider.registeredLink') : t('provider.notProvided')}</div>
					</div>
				</div>
				{url ? (
					<a
						href={url}
						target="_blank"
						rel="noreferrer"
						className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-textSecondary transition-colors hover:border-secondary/30 hover:text-primary"
						aria-label={`Open ${label}`}
					>
						<ExternalLink className="h-4 w-4" />
					</a>
				) : null}
			</div>

			<div className="mt-3 break-all rounded-lg bg-surface px-3 py-2 text-xs text-primary">
				{url ? (
					<a href={url} target="_blank" rel="noreferrer" className="hover:underline">
						{url}
					</a>
				) : (
					<span className="text-textSecondary">{t('provider.noLinkSavedYet')}</span>
				)}
			</div>
		</div>
	);
}

type PageState =
	| { status: 'idle' | 'loading' }
	| { status: 'ready'; provider: BackendProviderProfile }
	| { status: 'error'; message: string; statusCode?: number };

export function ServiceProviderDashboard() {
	const { t } = useTranslation();
	const [state, setState] = useState<PageState>({ status: 'idle' });

	const session = getBackendSession();
	const accessToken = session?.accessToken;
	const userRole = session?.user?.role;

	useEffect(() => {
		if (!accessToken) return;
		if (userRole && userRole !== 'PROVIDER') return;

		let mounted = true;

		const load = async () => {
			setState({ status: 'loading' });

			try {
				const provider = await fetchProviderMeProfile();
				if (!mounted) return;
				setState({ status: 'ready', provider });
			} catch (err) {
				if (!mounted) return;

				if (err instanceof BackendAuthError) {
					setState({ status: 'error', message: err.message, statusCode: err.status });
					return;
				}

				setState({ status: 'error', message: t('provider.couldNotLoadDashboard') });
			}
		};

		load();
		return () => {
			mounted = false;
		};
	}, [accessToken, userRole, t]);

	return (
		<main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
			<div className="ykb-container">
				<header className="mb-6">
					<h1 className="text-3xl font-bold text-primary">{t('provider.dashboard')}</h1>
					<p className="mt-1 text-sm text-textSecondary">{t('provider.servicesAndPrices')}</p>
				</header>

				{userRole && userRole !== 'PROVIDER' ? (
					<div className="ykb-card">
						<div className="ykb-alert ykb-alert-warning">
							{t('provider.providerOnly')}
						</div>
						<div className="mt-4">
							<Link to="/profile" className="ykb-button-outline">{t('provider.goToProfile')}</Link>
						</div>
					</div>
				) : null}

				{userRole && userRole !== 'PROVIDER' ? null : !accessToken ? (
					<div className="ykb-card">
						<div className="ykb-alert ykb-alert-info">{t('provider.pleaseLogin')}</div>
						<div className="mt-4">
							<Link to="/login" className="ykb-button-primary">{t('provider.goToLogin')}</Link>
						</div>
					</div>
				) : state.status === 'loading' || state.status === 'idle' ? (
					<div className="ykb-card">
						<p className="text-sm text-textSecondary">{t('provider.loadingServices')}</p>
					</div>
				) : state.status === 'error' ? (
					<div className="ykb-card">
						<div className="ykb-alert ykb-alert-error">{state.message}</div>
						{state.statusCode === 401 ? (
							<div className="mt-4">
								<Link to="/login" className="ykb-button-primary">{t('provider.loginAgain')}</Link>
							</div>
						) : null}
					</div>
				) : state.status === 'ready' ? (
					<div className="grid grid-cols-1 gap-6">					<SubscriptionsSection />
						<section className="ykb-card">
							<div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">{t('provider.profile')}</div>
							<div className="mt-3 space-y-2">
								<div>
									<div className="text-xs text-textSecondary">{t('provider.businessName')}</div>
									<div className="font-semibold text-gray-900">{state.provider.businessName ?? '—'}</div>
								</div>
								<div>
									<div className="text-xs text-textSecondary">{t('provider.mainService')}</div>
									<div className="font-semibold text-gray-900">{state.provider.mainService ?? '—'}</div>
								</div>
								<div>
									<div className="text-xs text-textSecondary">{t('provider.locationField')}</div>
									<div className="font-semibold text-gray-900">{state.provider.location ?? '—'}</div>
								</div>
								<div>
									<div className="text-xs text-textSecondary">{t('provider.moneyRange')}</div>
									<div className="font-semibold text-gray-900">{state.provider.moneyRange ?? '—'}</div>
								</div>
							</div>
							<div className="mt-6 rounded-lg border border-gray-200 bg-surface px-4 py-4">
								<div className="flex items-center justify-between gap-4">
									<div>
										<div className="text-xs text-textSecondary">{t('provider.verificationStatus')}</div>
										<div className="mt-1 text-base font-semibold text-gray-900">{state.provider.status}</div>
									</div>
									{state.provider.status === 'REJECTED' ? (
										<span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">{t('provider.rejected')}</span>
									) : state.provider.status === 'APPROVED' ? (
										<span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">{t('provider.approved')}</span>
									) : (
										<span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">{t('provider.pending')}</span>
									)}
								</div>
								{state.provider.status === 'REJECTED' && state.provider.rejectionReason ? (
									<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
										<div className="text-sm font-semibold text-red-800">{t('provider.rejectionReason')}</div>
										<p className="mt-2 text-sm text-red-700">{state.provider.rejectionReason}</p>
									</div>
								) : null}
							</div>
						</section>

						<section className="ykb-card">
							<div className="flex items-center justify-between gap-4">
								<div>
									<div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">{t('provider.appPreview')}</div>
									<h2 className="mt-2 text-xl font-semibold text-primary">{t('provider.registeredAppLinks')}</h2>
								</div>
								<div className="text-xs text-textSecondary">{t('provider.previewFromRegistration')}</div>
							</div>

							<div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
								{buildAppLinkPreviews(state.provider).map((item) => (
									<AppLinkTile key={item.label} {...item} t={t} />
								))}
							</div>
						</section>

						<section className="ykb-card">
							<div className="flex items-center justify-between gap-4">
								<div>
									<div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">{t('provider.services')}</div>
									<h2 className="mt-2 text-xl font-semibold text-primary">{t('provider.servicesYouProvide')}</h2>
								</div>
							</div>

							<div className="mt-4">
								{Array.isArray(state.provider.serviceOfferings) && state.provider.serviceOfferings.length > 0 ? (
									<div className="divide-y divide-border rounded-lg border border-border bg-white">
										{state.provider.serviceOfferings.map((item, index) => (
											<div key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3">
												<div className="min-w-0">
													<div className="font-semibold text-gray-900 truncate">{item.name}</div>
												</div>
												<div className="shrink-0 font-semibold text-primary">{item.price}</div>
											</div>
										))}
									</div>
								) : (
									<div className="ykb-alert ykb-alert-info">{t('provider.noServicesYet')}</div>
								)}
							</div>
						</section>
					</div>
				) : null}
			</div>
		</main>
	);
}

