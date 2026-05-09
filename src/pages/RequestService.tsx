import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchPublicServices, type PublicService } from '../data/registrationServices';
import { readJson, writeJson } from '../utils/storage';
import { openWhatsApp } from '../utils/whatsapp';
import { getBackendSession } from '../utils/backendAuth';
import { getSession } from '../utils/auth';
import { BackendAuthError } from '../utils/backendAuth';
import { createBackendRequest } from '../utils/backendRequests';

type ServiceRequest = {
  id: string;
  createdAt: string;
  service: string;
  location: string;
  startDate: string;
  endDate: string;
  budgetMin: number;
  budgetMax: number;
  details: string;
  customizations?: string;
};

type RequestDraft = {
  savedAt: string;
  returnTo: string;
  form: {
    service: string;
    location: string;
    startDate: string;
    endDate: string;
    budgetMin: string;
    budgetMax: string;
    details: string;
    customizations: string;
  };
};

const REQUEST_DRAFT_KEY = 'requestServiceDraft';

function withDefaultTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00`;
  return trimmed;
}

function toIsoFromDateTimeLocal(value: string): string | null {
  const normalized = withDefaultTime(value);
  if (!normalized) return null;
  const parsed = new Date(`${normalized}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function useQueryParam(name: string): string {
  const { search } = useLocation();
  return new URLSearchParams(search).get(name) ?? '';
}

export function RequestService() {
  const navigate = useNavigate();
  const location = useLocation();
  const presetService = useQueryParam('service');
  const [publicServices, setPublicServices] = useState<PublicService[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [submittedRequest, setSubmittedRequest] = useState<ServiceRequest | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      setIsLoadingServices(true);

      try {
        const services = await fetchPublicServices();
        if (!mounted) return;
        setPublicServices(services);
      } catch {
        if (!mounted) return;
        setPublicServices([]);
      } finally {
        if (mounted) setIsLoadingServices(false);
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  const serviceOptions = useMemo(() => {
    const base = publicServices.map((service) => service.title);
    const extra = ['Service Provider Booking', 'Custom Service'];
    return Array.from(new Set([...base, ...extra]));
  }, [publicServices]);

  const lockedService = presetService.trim();

  const [form, setForm] = useState(() => {
    const base = {
      service: '',
      location: '',
      startDate: '',
      endDate: '',
      budgetMin: '',
      budgetMax: '',
      details: '',
      customizations: '',
    };

    const draft = readJson<RequestDraft | null>(REQUEST_DRAFT_KEY, null);
    const currentReturnTo = `${window.location.pathname}${window.location.search}`;

    if (!draft) return base;
    if (!draft.returnTo.startsWith('/request')) return base;
    if (draft.returnTo !== currentReturnTo) return base;

    const next = { ...base, ...draft.form };
    return {
      ...next,
      startDate: withDefaultTime(next.startDate),
      endDate: withDefaultTime(next.endDate),
    };
  });

  const returnTo = useMemo(() => `${location.pathname}${location.search}`, [location.pathname, location.search]);

  const effectiveService = useMemo(() => {
    if (lockedService) return lockedService;
    if (form.service) return form.service;
    return serviceOptions[0] ?? '';
  }, [form.service, lockedService, serviceOptions]);

  const serviceDescription = useMemo(() => {
    if (!effectiveService) return '';
    const service = publicServices.find((s) => s.title === effectiveService);
    return service?.description ?? '';
  }, [effectiveService, publicServices]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const isAuthenticated = Boolean(getBackendSession()?.accessToken || getSession());
    if (!isAuthenticated) {
      const draft: RequestDraft = {
        savedAt: new Date().toISOString(),
        returnTo,
        form: {
          ...form,
          service: effectiveService || form.service,
        },
      };

      writeJson<RequestDraft>(REQUEST_DRAFT_KEY, draft);
      navigate(`/login?next=${encodeURIComponent(returnTo)}&reason=request`);
      return;
    }

    if (!effectiveService) return;

    const backendUser = getBackendSession()?.user;
    const mockSession = getSession();
    const requesterLabel = (backendUser?.name ?? '').trim() || (mockSession?.email ?? '').trim() || 'N/A';

    const budgetMin = Number(form.budgetMin);
    const budgetMax = Number(form.budgetMax);
    if (!Number.isFinite(budgetMin) || !Number.isFinite(budgetMax)) return;
    if (budgetMin < 0 || budgetMax < 0) return;
    if (budgetMax < budgetMin) return;
    if (!form.startDate || !form.endDate) return;
    if (form.endDate < form.startDate) return;
    if (!form.location.trim()) return;

    const descriptionLines = [
      `Service: ${effectiveService}`,
      `Period: ${form.startDate} → ${form.endDate}`,
      `Budget range (RWF): ${budgetMin.toLocaleString()} - ${budgetMax.toLocaleString()}`,
      `Description: ${form.details.trim()}`,
      form.customizations.trim() ? `Customizations: ${form.customizations.trim()}` : 'Customizations: N/A',
      `Requested by: ${requesterLabel}`,
    ];

    const description = descriptionLines.join('\n');

    const preferredDate = toIsoFromDateTimeLocal(form.startDate);

    try {
      const created = await createBackendRequest({
        description,
        location: form.location.trim(),
        preferredDate: preferredDate ?? undefined,
        budget: String(budgetMax),
      });

      const request: ServiceRequest = {
        id: created.id,
        createdAt: created.createdAt,
        service: effectiveService,
        location: form.location.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        budgetMin,
        budgetMax,
        details: form.details.trim(),
        customizations: form.customizations.trim() || undefined,
      };

      writeJson<RequestDraft | null>(REQUEST_DRAFT_KEY, null);
      setSubmittedRequest(request);
      return;
    } catch (err) {
      const status = err instanceof BackendAuthError ? err.status : undefined;
      if (status === 401 || status === 403) {
        setSubmitError('Please login again to submit your request.');
        return;
      }

      if (status === 0 && err instanceof BackendAuthError) {
        setSubmitError(err.message);
        return;
      }

      if (status && status >= 500) {
        setSubmitError('Server error. Please try again later.');
        return;
      }

      setSubmitError(err instanceof Error ? err.message : 'Could not submit your request right now.');
    }
  };

  const sendToWhatsApp = () => {
    if (!submittedRequest) return;
    const backendUser = getBackendSession()?.user;
    const mockSession = getSession();
    const requesterLabel = (backendUser?.name ?? '').trim() || (mockSession?.email ?? '').trim() || 'N/A';
    const requesterPhone = (backendUser?.phone ?? '').toString().trim();
    openWhatsApp(
      [
        'Hello Your Kigali Bestie, I would like to request a service:',
        `Service: ${submittedRequest.service}`,
        `Name: ${requesterLabel}`,
        `Phone: ${requesterPhone || 'N/A'}`,
        `Location: ${submittedRequest.location}`,
        `Period: ${submittedRequest.startDate} → ${submittedRequest.endDate}`,
        `Budget range (RWF): ${submittedRequest.budgetMin.toLocaleString()} - ${submittedRequest.budgetMax.toLocaleString()}`,
        `Description: ${submittedRequest.details}`,
        submittedRequest.customizations ? `Customizations: ${submittedRequest.customizations}` : 'Customizations: N/A',
      ].join('\n')
    );
  };

  const isServiceUnavailable = !isLoadingServices && publicServices.length === 0;

  return (
    <main className="pt-16 bg-white text-gray-900">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Get connected with the service providers</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Request service</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
             Tell us what you need help with, and we’ll reach out on WhatsApp/call using the info provided. </p>
          </div>
        </div>
      </section>

      <section className="ykb-section px-4 sm:px-6 lg:px-8 bg-dark-light">
        <div className="max-w-2xl mx-auto">
          <div className="ykb-surface p-4 sm:p-5">
            {!submittedRequest ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                {submitError ? <div className="ykb-alert ykb-alert-error">{submitError}</div> : null}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1" htmlFor="service">
                    Which service do you need?
                  </label>

                  {lockedService ? (
                    <div>
                      <div className="ykb-field py-2 text-sm bg-surface flex items-center justify-between">
                        <span className="font-semibold text-primary">{effectiveService}</span>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary">Selected</span>
                      </div>
                      <input id="service" type="hidden" value={effectiveService} readOnly />
                    </div>
                  ) : (
                    <select
                      id="service"
                      required
                      value={effectiveService}
                      disabled={isLoadingServices || isServiceUnavailable}
                      onChange={(e) => setForm((prev) => ({ ...prev, service: e.target.value }))}
                      className="ykb-field py-2 text-sm disabled:opacity-70"
                    >
                      <option value="">{isLoadingServices ? 'Loading services…' : 'Select a service'}</option>
                      {serviceOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {serviceDescription && (
                    <div className="mt-2 p-3 rounded-lg bg-secondary/5 border border-secondary/10">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-textSecondary mb-1">Service Details</p>
                      <p className="text-sm leading-relaxed text-textSecondary">
                        {serviceDescription}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1" htmlFor="location">
                    Location
                  </label>
                  <input
                    id="location"
                    required
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="ykb-field py-2 text-sm"
                    placeholder="e.g., Kigali / Kicukiro / Kimironko"
                  />
                </div>

                <div>
                  <p className="block text-sm font-semibold text-primary mb-1">Period</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-1" htmlFor="startDate">
                        Start date
                      </label>
                      <input
                        id="startDate"
                        type="datetime-local"
                        required
                        value={form.startDate}
                        step={60}
                        onChange={(e) => setForm((prev) => ({ ...prev, startDate: withDefaultTime(e.target.value) }))}
                        className="ykb-field py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-1" htmlFor="endDate">
                        End date
                      </label>
                      <input
                        id="endDate"
                        type="datetime-local"
                        required
                        min={form.startDate || undefined}
                        value={form.endDate}
                        step={60}
                        onChange={(e) => setForm((prev) => ({ ...prev, endDate: withDefaultTime(e.target.value) }))}
                        className="ykb-field py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="block text-sm font-semibold text-primary mb-1">Budget range (RWF)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-1" htmlFor="budgetMin">
                        Minimum
                      </label>
                      <input
                        id="budgetMin"
                        type="number"
                        required
                        min={0}
                        step={1000}
                        value={form.budgetMin}
                        onChange={(e) => setForm((prev) => ({ ...prev, budgetMin: e.target.value }))}
                        className="ykb-field py-2 text-sm"
                        placeholder="e.g., 20,000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-textSecondary mb-1" htmlFor="budgetMax">
                        Maximum
                      </label>
                      <input
                        id="budgetMax"
                        type="number"
                        required
                        min={form.budgetMin || 0}
                        step={1000}
                        value={form.budgetMax}
                        onChange={(e) => setForm((prev) => ({ ...prev, budgetMax: e.target.value }))}
                        className="ykb-field py-2 text-sm"
                        placeholder="e.g., 100,000"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1" htmlFor="details">
                    Description
                  </label>
                  <textarea
                    id="details"
                    required
                    value={form.details}
                    onChange={(e) => setForm((prev) => ({ ...prev, details: e.target.value }))}
                    className="ykb-field py-2 text-sm min-h-24"
                    placeholder="Describe your needs, timing, location, and any important details."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1" htmlFor="customizations">
                    Customizations (optional)
                  </label>
                  <textarea
                    id="customizations"
                    value={form.customizations}
                    onChange={(e) => setForm((prev) => ({ ...prev, customizations: e.target.value }))}
                    className="ykb-field py-2 text-sm min-h-24"
                    placeholder="Any preferences, add-ons, options, brands, special requests, etc."
                  />
                </div>

                <button type="submit" className="w-full ykb-button-solid py-2 px-4">
                  Submit Request
                </button>

                <p className="text-xs text-gray-400">
                  After submitting, we’ll reach out on WhatsApp/call using the info provided.
                </p>
              </form>
            ) : (
              <div className="space-y-2">
                <div className="ykb-card p-4">
                  <h2 className="text-xl font-bold text-primary mb-1">Request received</h2>
                  <p className="text-textSecondary">
                    Your request was saved (mocked) and will appear in the admin Requests page.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={sendToWhatsApp} className="ykb-button-solid px-4 py-2">
                    Send to WhatsApp
                  </button>
                  <button onClick={() => navigate('/')} className="ykb-button-outline px-4 py-2">
                    Back Home
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSubmittedRequest(null);
                    writeJson<RequestDraft | null>(REQUEST_DRAFT_KEY, null);
                    setSubmitError(null);
                    setForm({
                      service: '',
                      location: '',
                      startDate: '',
                      endDate: '',
                      budgetMin: '',
                      budgetMax: '',
                      details: '',
                      customizations: '',
                    });
                  }}
                  className="ykb-button-outline px-4 py-2"
                >
                  Submit another request
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
