import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackendAuthError, getBackendSession, API_BASE, getBackendAuthHeaders } from '../../utils/backendAuth';
import {
	addMyBackendRequestNote,
	fetchMyBackendRequests,
	rateBackendRequest,
	type BackendRequest,
	type BackendRequestStatus,
	updateMyBackendRequest,
} from '../../utils/backendRequests';

function formatDate(iso: string): string {
	try {
		return new Date(iso).toLocaleString();
	} catch {
		return iso;
	}
}

function deriveRequestTitle(request: BackendRequest): string {
	const description = request.description ?? '';
	const match = description.match(/^Service:\s*(.+)$/m);
	const service = match?.[1]?.trim();
	return service && service.length > 0 ? service : 'Service request';
}

function statusLabel(status: string, customerResolvedAt?: string | null, adminConfirmedAt?: string | null, adminResolvedAt?: string | null): string {
	// If marked as resolved by customer, admin confirmed provider, or admin directly resolved
	if (customerResolvedAt || adminConfirmedAt || adminResolvedAt) return 'Resolved';
	
	const s = status as BackendRequestStatus;
	if (s === 'PENDING') return 'Pending';
	if (s === 'IN_REVIEW') return 'Received';
	if (s === 'RESOLVED') return 'Resolved';
	if (s === 'CANCELLED') return 'Cancelled';
	return status;
}

function toDateTimeLocalValue(iso: string): string {
	try {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		const yyyy = d.getFullYear();
		const mm = pad(d.getMonth() + 1);
		const dd = pad(d.getDate());
		const hh = pad(d.getHours());
		const mi = pad(d.getMinutes());
		return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
	} catch {
		return '';
	}
}

function fromDateTimeLocalValue(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const parsed = new Date(`${trimmed}:00`);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed.toISOString();
}

export function StarterRequests() {
	const session = getBackendSession();
	const isAuthenticated = Boolean(session?.accessToken);

	const [requests, setRequests] = useState<BackendRequest[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [editingId, setEditingId] = useState<string | null>(null);
	const [editForm, setEditForm] = useState({ location: '', preferredDate: '', budget: '', description: '' });
	const [savingId, setSavingId] = useState<string | null>(null);
	const [noteId, setNoteId] = useState<string | null>(null);
	const [noteText, setNoteText] = useState('');
	const [ratingValue, setRatingValue] = useState(5);
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (!isAuthenticated) {
			setIsLoading(false);
			setRequests([]);
			setError(null);
			return;
		}

		setIsLoading(true);
		setError(null);
		try {
			const list = await fetchMyBackendRequests();
			setRequests(list);
		} catch (err) {
			const status = err instanceof BackendAuthError ? err.status : undefined;
			if (status === 401) setError('Please login to view your requests.');
			else if (status === 0 && err instanceof BackendAuthError) setError(err.message);
			else setError(err instanceof Error ? err.message : 'Could not load your requests.');
			setRequests([]);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated]);

	const markResolved = useCallback(
		async (requestId: string) => {
			setUpdatingId(requestId);
			setActionError(null);

			const updated = [...requests];
			const idx = updated.findIndex((r) => r.id === requestId);
			if (idx === -1) return;

			const original = updated[idx];
			updated[idx] = { ...original, providerResolvedAt: new Date().toISOString() };
			setRequests(updated);

			try {
				const res = await fetch(`${API_BASE}/requests/${encodeURIComponent(requestId)}/provider-mark-resolved`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						...getBackendAuthHeaders(),
					},
				});

				if (!res.ok) {
					throw new Error(`Request failed (${res.status})`);
				}

				const json = (await res.json()) as { request?: BackendRequest };
				if (json?.request?.id) {
					setRequests((prev) => prev.map((r) => (r.id === requestId ? json.request! : r)));
				}
			} catch (err) {
				setRequests([...updated]);
				setActionError(err instanceof Error ? err.message : 'Could not mark as resolved.');
			} finally {
				setUpdatingId(null);
			}
		},
		[requests]
	);

	const submitRating = useCallback(
		async (requestId: string) => {
			setSavingId(requestId);
			setActionError(null);
			try {
				await rateBackendRequest(requestId, ratingValue);
				setRatingValue(5);
				await load();
			} catch (err) {
				const status = err instanceof BackendAuthError ? err.status : undefined;
				if (status === 401) setActionError('Please login again to rate this request.');
				else if (status === 0 && err instanceof BackendAuthError) setActionError(err.message);
				else setActionError(err instanceof Error ? err.message : 'Could not submit rating.');
			} finally {
				setSavingId(null);
			}
		},
		[ratingValue, load]
	);

	useEffect(() => {
		void Promise.resolve().then(load);
	}, [load]);

	return (
		<main className="pt-16">
			<section className="ykb-section bg-dark-light">
				<div className="ykb-container">
					<div className="mb-4">
						<h1 className="text-3xl font-semibold text-primary md:text-4xl">My requests</h1>
						<p className="mt-1 text-sm text-textSecondary">Track the status of the services you requested.</p>
					</div>

					{!isAuthenticated ? (
						<div className="ykb-card p-6 text-center">
							<h2 className="text-2xl font-bold text-primary mb-2">Login required</h2>
							<p className="text-textSecondary">Please login to view your submitted requests.</p>
							<div className="mt-4">
								<Link to="/login" className="ykb-button-solid px-4 py-2">
									Go to login
								</Link>
							</div>
						</div>
					) : error ? (
						<div className="ykb-card p-6 text-center">
							<h2 className="text-2xl font-bold text-primary mb-2">Could not load requests</h2>
							<p className="text-textSecondary">{error}</p>
						</div>
					) : isLoading ? (
						<div className="ykb-card p-6 text-center">
							<h2 className="text-2xl font-bold text-primary mb-2">Loading…</h2>
							<p className="text-textSecondary">Fetching your requests from the backend.</p>
						</div>
					) : requests.length === 0 ? (
						<div className="ykb-card p-6 text-center">
							<h2 className="text-2xl font-bold text-primary mb-2">No requests yet</h2>
							<p className="text-textSecondary">Create one from the request page.</p>
							<div className="mt-4">
								<Link to="/request" className="ykb-button-solid px-4 py-2">
									Request a service
								</Link>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{requests.map((r) => (
								<div key={r.id} className="ykb-card">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h2 className="text-xl font-bold text-primary">{deriveRequestTitle(r)}</h2>
											<p className="text-textSecondary text-sm">{formatDate(r.createdAt)}</p>
										</div>
										<div className="text-right">
											<div className="text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary">Status</div>
											<div className="text-sm font-bold text-primary">{statusLabel(r.status, r.customerResolvedAt, r.adminConfirmedAt, r.adminResolvedAt)}</div>
										</div>
									</div>

									{actionError && (editingId === r.id || noteId === r.id) ? (
										<div className="mt-3 ykb-alert ykb-alert-error">{actionError}</div>
									) : null}

									{r.status === 'PENDING' ? (
										<div className="mt-3">
											{editingId !== r.id ? (
												<button
													type="button"
													className="ykb-button-outline px-3 py-1.5 text-xs"
													onClick={() => {
														setActionError(null);
														setNoteId(null);
														setEditingId(r.id);
														setEditForm({
															location: r.location ?? '',
															preferredDate: r.preferredDate ? toDateTimeLocalValue(r.preferredDate) : '',
															budget: r.budget == null ? '' : String(r.budget),
															description: r.description ?? '',
														});
													}}
												>
													Edit request
												</button>
											) : (
												<div className="space-y-3 rounded-xl border border-border bg-surface p-3">
													<div>
														<label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-1">Location</label>
														<input
															className="ykb-field py-2 text-sm"
															value={editForm.location}
															onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
														/>
													</div>

													<div>
														<label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-1">Preferred date</label>
														<input
															type="datetime-local"
															step={60}
															className="ykb-field py-2 text-sm"
															value={editForm.preferredDate}
															onChange={(e) => setEditForm((p) => ({ ...p, preferredDate: e.target.value }))}
														/>
													</div>

													<div>
														<label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-1">Budget (RWF)</label>
														<input
															type="number"
															min={0}
															step={1000}
															className="ykb-field py-2 text-sm"
															value={editForm.budget}
															onChange={(e) => setEditForm((p) => ({ ...p, budget: e.target.value }))}
														/>
													</div>

													<div>
														<label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-1">Description</label>
														<textarea
															className="ykb-field py-2 text-sm min-h-24"
															value={editForm.description}
															onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
														/>
													</div>

													<div className="flex flex-col sm:flex-row gap-2">
														<button
															type="button"
															disabled={savingId === r.id}
															className="ykb-button-solid px-4 py-2 text-sm disabled:opacity-70"
															onClick={async () => {
																setSavingId(r.id);
																setActionError(null);
																try {
																	await updateMyBackendRequest(r.id, {
																		location: editForm.location.trim(),
																		preferredDate: editForm.preferredDate
																			? fromDateTimeLocalValue(editForm.preferredDate)
																			: null,
																		budget: editForm.budget.trim() ? String(Number(editForm.budget)) : null,
																		description: editForm.description,
																	});
																	setEditingId(null);
																	await load();
																} catch (err) {
																	const status = err instanceof BackendAuthError ? err.status : undefined;
																	if (status === 401) setActionError('Please login again to edit this request.');
																	else if (status === 0 && err instanceof BackendAuthError) setActionError(err.message);
																	else setActionError(err instanceof Error ? err.message : 'Could not save changes.');
																} finally {
																	setSavingId(null);
																}
															}}
														>
															{savingId === r.id ? 'Saving…' : 'Save changes'}
														</button>

														<button
															type="button"
															className="ykb-button-outline px-4 py-2 text-sm"
															onClick={() => {
																setEditingId(null);
																setActionError(null);
															}}
														>
															Cancel
														</button>
													</div>
												</div>
											)}
										</div>
									) : (
										<div className="mt-3">
											{r.status === 'IN_REVIEW' && !r.customerResolvedAt && !r.providerResolvedAt && (
												<button
													type="button"
													onClick={() => void markResolved(r.id)}
													disabled={updatingId === r.id}
													className="w-full ykb-button-solid py-2 px-3 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mb-3"
												>
													{updatingId === r.id ? 'Marking as resolved...' : 'Mark as Resolved'}
												</button>
											)}

											{r.providerResolvedAt && r.requiresAdminConfirmation && (
												<div className="mb-3 p-3 rounded bg-blue-100 border border-blue-300 text-sm text-blue-900">
													⏳ Waiting for admin confirmation (marked resolved on {formatDate(r.providerResolvedAt)})
												</div>
											)}

											{r.customerResolvedAt && (
												<div className="mb-3 p-3 rounded bg-yellow-100 border border-yellow-300 text-sm text-yellow-900">
													✓ Marked as resolved on {formatDate(r.customerResolvedAt)}
												</div>
											)}

											{(r.customerResolvedAt || r.adminConfirmedAt || r.adminResolvedAt) && !r.rating ? (
									<div className="space-y-3 rounded-xl border border-border bg-surface p-3 mt-3">
										<div>
											<label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-3">
												Rate your satisfaction (1-10)
											</label>
											<div className="grid grid-cols-5 gap-2">
												{Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
													<label key={num} className="flex flex-col items-center cursor-pointer">
														<input
															type="radio"
															name={`rating-${r.id}`}
															value={num}
															checked={ratingValue === num}
															onChange={() => setRatingValue(num)}
															className="mb-1"
														/>
														<span className={`text-xs font-semibold px-2 py-1 rounded text-center w-full ${
															ratingValue === num
																? 'bg-primary text-white'
																: 'bg-gray-200 text-gray-700'
														}`}>
															{num}
														</span>
														{(num === 1 || num === 5 || num === 10) && (
															<span className="text-xs text-textSecondary mt-1">
																{num === 1 ? 'Poor' : num === 5 ? 'Fair' : 'Excellent'}
															</span>
														)}
													</label>
												))}
											</div>
										</div>

										<div className="flex flex-col sm:flex-row gap-2">
											<button
												type="button"
												disabled={savingId === r.id}
												className="ykb-button-solid px-4 py-2 text-sm disabled:opacity-70"
												onClick={async () => {
													await submitRating(r.id);
												}}
											>
												{savingId === r.id ? 'Submitting…' : 'Submit rating'}
											</button>
										</div>
									</div>
								) : r.rating ? (
									<div className="p-3 rounded bg-green-100 border border-green-300 text-sm text-green-900 mt-3">
												</div>
											) : null}

											{r.status !== 'RESOLVED' && !r.customerResolvedAt && !r.adminConfirmedAt && !r.adminResolvedAt && (
												<>
													{noteId !== r.id ? (
														<button
															type="button"
															className="ykb-button-outline px-3 py-1.5 text-xs"
															onClick={() => {
																setActionError(null);
																setEditingId(null);
																setNoteId(r.id);
																setNoteText('');
															}}
														>
															Add note
														</button>
													) : (
														<div className="space-y-3 rounded-xl border border-border bg-surface p-3">
															<div>
																<label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-1">
																	New note
																</label>
																<textarea
																	className="ykb-field py-2 text-sm min-h-24"
																	value={noteText}
																	onChange={(e) => setNoteText(e.target.value)}
																	placeholder="Add more details or changes…"
																/>
															</div>

															<div className="flex flex-col sm:flex-row gap-2">
																<button
																	type="button"
																	disabled={savingId === r.id}
																	className="ykb-button-solid px-4 py-2 text-sm disabled:opacity-70"
																	onClick={async () => {
																		if (!noteText.trim()) return;
																		setSavingId(r.id);
																		setActionError(null);
																		try {
																			await addMyBackendRequestNote(r.id, noteText.trim());
																			setNoteId(null);
																			setNoteText('');
																			await load();
																		} catch (err) {
																			const status = err instanceof BackendAuthError ? err.status : undefined;
																			if (status === 401) setActionError('Please login again to add a note.');
																			else if (status === 0 && err instanceof BackendAuthError)
																				setActionError(err.message);
																			else setActionError(err instanceof Error ? err.message : 'Could not add note.');
																		} finally {
																			setSavingId(null);
																		}
																	}}
																>
																	{savingId === r.id ? 'Saving…' : 'Save note'}
																</button>

																<button
																	type="button"
																	className="ykb-button-outline px-4 py-2 text-sm"
																	onClick={() => {
																		setNoteId(null);
																		setNoteText('');
																		setActionError(null);
																	}}
																>
																	Cancel
																</button>
															</div>
														</div>
													)}
												</>
											)}
										</div>
									)}

									<div className="mt-4 space-y-2 text-sm">
										<div className="text-textSecondary">
											<span className="font-semibold text-primary">Location:</span> {r.location}
										</div>
										<div className="text-textSecondary">
											<span className="font-semibold text-primary">Preferred date:</span>{' '}
											{r.preferredDate ? formatDate(r.preferredDate) : 'N/A'}
										</div>
										<div className="text-textSecondary">
											<span className="font-semibold text-primary">Description:</span> {r.description}
										</div>
										{r.adminNotes ? (
											<div className="text-textSecondary">
												<span className="font-semibold text-primary">Admin notes:</span> {r.adminNotes}
											</div>
										) : null}

										{r.customerNotes ? (
											<div className="text-textSecondary whitespace-pre-wrap">
												<span className="font-semibold text-primary">Your notes wantedn  the modifications  :</span> {r.customerNotes}
											</div>
										) : null}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</section>
		</main>
	);
}
