import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackendAuthError, getBackendSession } from '../../utils/backendAuth';
import {
	fetchProviderMeProfile,
	updateProviderMeProfile,
	type BackendProviderProfile,
	type ProviderServiceOffering,
} from '../../utils/backendProviders';
import { useTranslation } from 'react-i18next';

type PageState =
	| { status: 'idle' | 'loading' }
	| { status: 'ready'; provider: BackendProviderProfile }
	| { status: 'error'; message: string; statusCode?: number };

export function ServiceProviderServices() {
	const { t } = useTranslation();
	const [state, setState] = useState<PageState>({ status: 'idle' });
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

	const [editorMode, setEditorMode] = useState<'add' | 'edit' | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [draft, setDraft] = useState<{ name: string; price: string; description: string }>({
		name: '',
		price: '',
		description: '',
	});
	const [draftError, setDraftError] = useState<string | null>(null);

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

				setState({ status: 'error', message: t('provider.couldNotLoadServices') });
			}
		};

		load();
		return () => {
			mounted = false;
		};
	}, [accessToken, userRole, t]);

	const provider = state.status === 'ready' ? state.provider : null;
	const offerings: ProviderServiceOffering[] = useMemo(() => {
		if (!provider?.serviceOfferings) return [];
		return Array.isArray(provider.serviceOfferings) ? provider.serviceOfferings : [];
	}, [provider?.serviceOfferings]);

	const closeEditor = () => {
		setEditorMode(null);
		setEditingIndex(null);
		setDraft({ name: '', price: '', description: '' });
		setDraftError(null);
	};

	const openAdd = () => {
		setSaveSuccess(null);
		setSaveError(null);
		setEditorMode('add');
		setEditingIndex(null);
		setDraft({ name: '', price: '', description: '' });
		setDraftError(null);
	};

	const openEdit = (index: number) => {
		const item = offerings[index];
		if (!item) return;
		setSaveSuccess(null);
		setSaveError(null);
		setEditorMode('edit');
		setEditingIndex(index);
		setDraft({
			name: item.name ?? '',
			price: item.price ?? '',
			description: item.description ?? '',
		});
		setDraftError(null);
	};

	const validateDraft = (): string | null => {
		if (draft.name.trim().length === 0) return t('provider.serviceNameRequired');
		if (draft.price.trim().length === 0) return t('provider.servicePriceRequired');
		if (draft.description.trim().length === 0) return t('provider.serviceDescriptionRequired');
		return null;
	};

	const persistOfferings = async (nextOfferings: ProviderServiceOffering[]) => {
		setIsSaving(true);
		setSaveError(null);
		setSaveSuccess(null);
		try {
			const updated = await updateProviderMeProfile({ serviceOfferings: nextOfferings });
			setState({ status: 'ready', provider: updated });
			setSaveSuccess(t('provider.saved'));
		} catch (err) {
			const message = err instanceof BackendAuthError ? err.message : t('provider.couldNotSaveServices');
			setSaveError(message);
		} finally {
			setIsSaving(false);
		}
	};

	const saveDraft = async () => {
		setDraftError(null);
		const error = validateDraft();
		if (error) {
			setDraftError(error);
			return;
		}

		const nextItem: ProviderServiceOffering = {
			name: draft.name.trim(),
			price: draft.price.trim(),
			description: draft.description.trim(),
		};

		if (editorMode === 'add') {
			await persistOfferings([...offerings, nextItem]);
			closeEditor();
			return;
		}

		if (editorMode === 'edit' && editingIndex !== null) {
			const next = offerings.map((item, index) => (index === editingIndex ? nextItem : item));
			await persistOfferings(next);
			closeEditor();
		}
	};

	const deleteOffering = async (index: number) => {
		const item = offerings[index];
		if (!item) return;
		const ok = window.confirm(t('provider.deleteConfirm', { name: item.name }));
		if (!ok) return;
		setSaveSuccess(null);
		setSaveError(null);
		await persistOfferings(offerings.filter((_x, i) => i !== index));
	};

	return (
		<main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
			<div className="ykb-container">
				<header className="mb-6">
					<h1 className="text-3xl font-bold text-primary">{t('provider.yourServices')}</h1>
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
					<div className="space-y-4">
						<section className="ykb-card">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">{t('provider.createEditServices')}</div>
									<h2 className="mt-2 text-xl font-semibold text-primary">{t('provider.createEditServices')}</h2>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={openAdd}
										disabled={isSaving}
										className="ykb-button-primary"
									>
										{t('provider.addServiceButton')}
									</button>
								</div>
							</div>

							{saveSuccess ? <div className="mt-4 ykb-alert ykb-alert-success">{saveSuccess}</div> : null}
							{saveError ? <div className="mt-4 ykb-alert ykb-alert-error">{saveError}</div> : null}
						</section>

						{editorMode ? (
							<section className="ykb-card">
								<div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">
									{editorMode === 'add' ? t('provider.newService') : t('provider.editService')}
								</div>

								{draftError ? <div className="mt-3 ykb-alert ykb-alert-warning">{draftError}</div> : null}

								<div className="mt-4 grid grid-cols-1 gap-4">
									<div>
										<label className="block text-sm font-semibold text-primary mb-1" htmlFor="serviceName">
											{t('provider.serviceNameLabel')}
										</label>
										<input
											id="serviceName"
											className="ykb-field"
											value={draft.name}
											onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
											placeholder={t('provider.placeholderServiceName')}
											disabled={isSaving}
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold text-primary mb-1" htmlFor="servicePrice">
											{t('provider.servicePriceField')}
										</label>
										<input
											id="servicePrice"
											className="ykb-field"
											value={draft.price}
											onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value }))}
											placeholder={t('provider.placeholderPrice')}
											disabled={isSaving}
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold text-primary mb-1" htmlFor="serviceDescription">
											{t('provider.serviceDescriptionLabel')}
										</label>
										<textarea
											id="serviceDescription"
											className="ykb-field min-h-[110px]"
											value={draft.description}
											onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
											placeholder={t('provider.placeholderDescription')}
											disabled={isSaving}
										/>
									</div>

									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
										<button
											onClick={closeEditor}
											disabled={isSaving}
											className="ykb-button-outline"
										>
											{t('provider.cancel')}
										</button>
										<button
											onClick={saveDraft}
											disabled={isSaving}
											className="ykb-button-primary"
										>
											{t('provider.saveService')}
										</button>
									</div>
								</div>
							</section>
						) : null}

						<section className="ykb-card">
							<div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">{t('provider.yourList')}</div>
							<h2 className="mt-2 text-xl font-semibold text-primary">{t('provider.services')}</h2>

							<div className="mt-4">
								{offerings.length > 0 ? (
									<div className="divide-y divide-border rounded-lg border border-border bg-white">
										{offerings.map((item, index) => (
											<div key={`${item.name}-${index}`} className="px-4 py-3">
												<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
													<div className="min-w-0">
														<div className="font-semibold text-gray-900 truncate">{item.name}</div>
														{item.description ? (
															<div className="mt-1 text-sm text-textSecondary whitespace-pre-wrap">{item.description}</div>
														) : (
															<div className="mt-1 text-sm text-textSecondary">{t('provider.noDescriptionYet')}</div>
														)}
													</div>
													<div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
														<div className="font-semibold text-primary">{item.price}</div>
														<div className="flex items-center gap-2">
															<button
																onClick={() => openEdit(index)}
																disabled={isSaving}
																className="ykb-button-outline"
															>
																{t('provider.edit')}
															</button>
															<button
																onClick={() => deleteOffering(index)}
																disabled={isSaving}
																className="ykb-button-outline"
															>
																{t('provider.delete')}
															</button>
														</div>
													</div>
												</div>
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
