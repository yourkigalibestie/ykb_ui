import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchPublicServices, type PublicService } from '../data/registrationServices';
import { type ServiceOffering, type UserRole } from '../utils/auth';
import { BackendAuthError, loginBackend, registerBackend, API_BASE } from '../utils/backendAuth';
import logo from '../assets/images/logo.png';

const PHASE1_ENABLED = String(import.meta.env.VITE_PHASE1 ?? '').toLowerCase() !== 'true';

type Step = 1 | 2;

type IdentityState = {
  firstName: string;
  middleName: string;
  lastName: string;
  country: string;
  phone: string;
};

type AccountState = {
  email: string;
  password: string;
  confirm: string;
};

type ProviderState = {
  businessName: string;
  service: string;
  location: string;
  moneyRange: string;
  services: ServiceOffering[];
  appLinks: AppLinksState;
};

type AppLinksState = {
  webApp: boolean;
  webAppUrl: string;
  mobileApp: boolean;
  playStore: boolean;
  playStoreUrl: string;
  appStore: boolean;
  appStoreUrl: string;
};

type FieldErrors = Partial<
  Record<
    | 'firstName'
    | 'lastName'
    | 'country'
    | 'phone'
    | 'role'
    | 'email'
    | 'password'
    | 'confirm'
    | 'businessName'
    | 'service'
    | 'location'
    | 'moneyRange'
    | 'services'
    | 'appLinks'
    | 'webAppUrl'
    | 'playStoreUrl'
    | 'appStoreUrl',
    string
  >
>;

function mapBackendMessageToFieldErrors(message: string, t: (key: string, options?: Record<string, unknown>) => string): FieldErrors {
  const normalized = message.toLowerCase();
  const next: FieldErrors = {};

  if (normalized.includes('businessname')) next.businessName = t('auth.businessNameRequired');
  if (normalized.includes('moneyrange')) next.moneyRange = t('auth.moneyRangeRequired');
  if (normalized.includes('services')) next.services = t('auth.servicesRequired');
  if (normalized.includes('location')) next.location = t('auth.locationRequired');
  if (normalized.includes('service')) next.service = t('auth.serviceRequired');

  if (normalized.includes('phone')) next.phone = t('auth.phoneRequired');

  if (normalized.includes('email')) next.email = t('auth.emailInvalid');
  if (normalized.includes('password')) next.password = t('auth.passwordMinLength', { length: PASSWORD_MIN_LENGTH });

  return next;
}

const PASSWORD_MIN_LENGTH = 8;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function renderFieldLabel(label: string, htmlFor: string, required = true, t?: (key: string) => string) {
  return (
    <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor={htmlFor}>
      {label}
      {!required && t ? <span className="text-gray-400"> {t('auth.optional')}</span> : null}
    </label>
  );
}

function createEmptyServiceRow(): ServiceOffering {
  return { name: '', price: '' };
}

function createEmptyAppLinksState(): AppLinksState {
  return {
    webApp: false,
    webAppUrl: '',
    mobileApp: false,
    playStore: false,
    playStoreUrl: '',
    appStore: false,
    appStoreUrl: '',
  };
}

function buildDefaultProviderState(services: PublicService[]): ProviderState {
  return {
    businessName: '',
    service: services[0]?.title ?? '',
    location: '',
    moneyRange: '',
    services: [createEmptyServiceRow()],
    appLinks: createEmptyAppLinksState(),
  };
}

function normalizeServiceRows(rows: ServiceOffering[]): ServiceOffering[] {
  return rows.map((row) => ({
    name: row.name.trim(),
    price: row.price.trim(),
    description: row.description?.trim() || undefined,
  }));
}

function isAppCategory(service?: PublicService | undefined | null): boolean {
  return service?.group === 'APP';
}

function buildAppServiceRows(appLinks: AppLinksState): ServiceOffering[] {
  const rows: ServiceOffering[] = [];

  if (appLinks.webApp) {
    rows.push({
      name: 'Web app',
      price: 'Included',
      description: appLinks.webAppUrl.trim(),
    });
  }

  if (appLinks.mobileApp) {
    if (appLinks.playStore) {
      rows.push({
        name: 'Play Store',
        price: 'Included',
        description: appLinks.playStoreUrl.trim(),
      });
    }

    if (appLinks.appStore) {
      rows.push({
        name: 'App Store',
        price: 'Included',
        description: appLinks.appStoreUrl.trim(),
      });
    }
  }

  return rows;
}

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const nextParam = params.get('next');
  const reason = params.get('reason');
  const requestedRole = params.get('role');
  const safeNext = nextParam && nextParam.startsWith('/') ? nextParam : null;
  const showRequestNotice = reason === 'request' || Boolean(safeNext?.startsWith('/request'));
  const loginHref = (() => {
    if (!safeNext && !reason) return '/login';
    const nextParams = new URLSearchParams();
    if (safeNext) nextParams.set('next', safeNext);
    if (reason) nextParams.set('reason', reason);
    return `/login?${nextParams.toString()}`;
  })();

  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<UserRole | ''>(() => {
    if (requestedRole === 'serviceProvider') return 'serviceProvider';
    return PHASE1_ENABLED ? '' : 'serviceProvider';
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [serviceLoadError, setServiceLoadError] = useState<string | null>(null);
  const [publicServices, setPublicServices] = useState<PublicService[]>([]);

  const [emailVerified, setEmailVerified] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [sendingVerificationCode, setSendingVerificationCode] = useState(false);

  const clearFieldError = (key: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const fieldClass = (key: keyof FieldErrors, extra?: string) => {
    const errorClass = fieldErrors[key] ? ' border-error focus:border-error focus:ring-error/20' : '';
    return `ykb-field${errorClass}${extra ? ` ${extra}` : ''}`;
  };

  const inlineError = (key: keyof FieldErrors) =>
    fieldErrors[key] ? <p className="mt-1 text-xs font-semibold text-error">{fieldErrors[key]}</p> : null;

  const sendEmailVerificationCode = async () => {
    setSendingVerificationCode(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email }),
      });

      if (response.ok) {
        setShowVerificationCode(true);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Failed to send verification code');
      }
    } catch {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setSendingVerificationCode(false);
    }
  };

  const verifyEmailCode = async () => {
    setIsVerifyingEmail(true);
    setError(null);
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      setIsVerifyingEmail(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: account.email, code: verificationCode }),
      });

      if (response.ok) {
        setEmailVerified(true);
        setShowVerificationCode(false);
        setVerificationCode('');
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Invalid verification code');
      }
    } catch {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const [identity, setIdentity] = useState<IdentityState>({
    firstName: '',
    middleName: '',
    lastName: '',
    country: 'Rwanda',
    phone: '',
  });

  const [account, setAccount] = useState<AccountState>({
    email: '',
    password: '',
    confirm: '',
  });

  const [provider, setProvider] = useState<ProviderState>(() => buildDefaultProviderState([]));

  useEffect(() => {
    if (!success) return;
    if (!safeNext) return;
    const timer = setTimeout(() => navigate(safeNext), 500);
    return () => clearTimeout(timer);
  }, [navigate, safeNext, success]);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      setIsLoadingServices(true);
      setServiceLoadError(null);

      try {
        const services = await fetchPublicServices();
        console.log('Fetched services:', services);
        if (!mounted) return;

        setPublicServices(services);
        setProvider((prev) => {
          if (prev.service || services.length === 0) return prev;
          return { ...prev, service: services[0].title };
        });
      } catch {
        if (!mounted) return;
        setPublicServices([]);
        setServiceLoadError(t('auth.serviceLoadError'));
      } finally {
        if (mounted) setIsLoadingServices(false);
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, [t]);

  const providerService = useMemo(
    () => publicServices.find((service) => service.title === provider.service),
    [publicServices, provider.service]
  );

  const showAppLinks = useMemo(() => isAppCategory(providerService), [providerService]);

  const resetForm = () => {
    setStep(1);
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFieldErrors({});
    setRole(PHASE1_ENABLED ? '' : 'serviceProvider');
    setIdentity({
      firstName: '',
      middleName: '',
      lastName: '',
      country: 'Rwanda',
      phone: '',
    });
    setAccount({
      email: '',
      password: '',
      confirm: '',
    });
    setProvider(buildDefaultProviderState(publicServices));

    setEmailVerified(false);
    setShowVerificationCode(false);
    setVerificationCode('');
  };

  const updateServiceRow = (index: number, field: keyof ServiceOffering, value: string) => {
    setProvider((prev) => ({
      ...prev,
      services: prev.services.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const addServiceRow = () => {
    setProvider((prev) => ({
      ...prev,
      services: [...prev.services, createEmptyServiceRow()],
    }));
  };

  const handleFirstStepSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const nextFieldErrors: FieldErrors = {};

    if (!role) nextFieldErrors.role = t('auth.selectAccountType');

    if (!isNonEmpty(identity.firstName)) nextFieldErrors.firstName = t('auth.firstNameRequired');
    if (!isNonEmpty(identity.lastName)) nextFieldErrors.lastName = t('auth.lastNameRequired');
    if (!isNonEmpty(identity.country)) nextFieldErrors.country = t('auth.countryRequired');
    if (!isNonEmpty(identity.phone)) nextFieldErrors.phone = t('auth.phoneRequired');

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0] ?? t('auth.fixHighlightedFields'));
      return;
    }

    setFieldErrors({});
    setStep(2);
  };

  const performRegistration = async (providerPayload: Record<string, unknown> | null) => {
    const fullName = [identity.firstName, identity.middleName, identity.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ');

    if (!role) {
      setFieldErrors((prev) => ({ ...prev, role: t('auth.selectAccountType') }));
      setError(t('auth.selectAccountType'));
      return;
    }

    try {
      setIsSubmitting(true);
      await registerBackend({
        email: account.email,
        password: account.password,
        name: fullName,
        phone: identity.phone,
        role: role === 'serviceProvider' ? 'PROVIDER' : 'CUSTOMER',
        ...(providerPayload ?? {}),
      });
      setSuccess(true);
    } catch (err) {
      const status = err instanceof BackendAuthError ? err.status : undefined;

      if (status === 409) {
        const message = err instanceof BackendAuthError ? err.message : '';

        if (message.toLowerCase().includes('phone')) {
          setFieldErrors((prev) => ({ ...prev, phone: message }));
          setError(message);
          return;
        }

        setFieldErrors((prev) => ({ ...prev, email: t('auth.accountExists') }));

        if (emailVerified) {
          try {
            const session = await loginBackend(account.email, account.password);
            const destination = safeNext ?? (session.user.role === 'PROVIDER' ? '/provider' : '/profile');
            navigate(destination);
            return;
          } catch {
            navigate(loginHref);
            return;
          }
        }

        setError(t('auth.accountExists'));
        return;
      }

      if (status === 0 && err instanceof BackendAuthError) {
        setError(err.message);
        return;
      }

      if (status === 400 && err instanceof BackendAuthError) {
        const backendFieldErrors = mapBackendMessageToFieldErrors(err.message, t);
        if (Object.keys(backendFieldErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
        }
        setError(err.message);
        return;
      }

      if (status === 503) {
        setError(t('auth.serviceUnavailable'));
        return;
      }

      if (status && status >= 500) {
        setError(t('auth.serverError'));
        return;
      }

      if (err instanceof BackendAuthError && err.message) {
        setError(err.message);
        return;
      }

      setError(t('auth.couldNotCreateAccount'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isSubmitting) return;

    const nextFieldErrors: FieldErrors = {};

    if (!role) nextFieldErrors.role = t('auth.selectAccountType');
    if (role && role !== 'starter') nextFieldErrors.role = t('auth.selectStarter');

    if (!isNonEmpty(identity.firstName)) nextFieldErrors.firstName = t('auth.firstNameRequired');
    if (!isNonEmpty(identity.lastName)) nextFieldErrors.lastName = t('auth.lastNameRequired');
    if (!isNonEmpty(identity.country)) nextFieldErrors.country = t('auth.countryRequired');
    if (!isNonEmpty(identity.phone)) nextFieldErrors.phone = t('auth.phoneRequired');

    if (!isNonEmpty(account.email)) nextFieldErrors.email = t('auth.emailRequired');
    if (!emailVerified) {
      nextFieldErrors.email = 'Please verify your email address before continuing';
      setError('Please verify your email address before continuing');
    }
    if (account.password.length < PASSWORD_MIN_LENGTH) {
      nextFieldErrors.password = t('auth.passwordMinLength', { length: PASSWORD_MIN_LENGTH });
    }
    if (account.password !== account.confirm) {
      nextFieldErrors.confirm = t('auth.passwordsDoNotMatch');
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0] ?? t('auth.fixHighlightedFields'));
      return;
    }

    setFieldErrors({});
    await performRegistration(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (isSubmitting) return;

    const nextFieldErrors: FieldErrors = {};

    if (!role) nextFieldErrors.role = t('auth.selectAccountType');

    if (!isNonEmpty(account.email)) nextFieldErrors.email = t('auth.emailRequired');
    if (!emailVerified) {
      nextFieldErrors.email = 'Please verify your email address before continuing';
      setError('Please verify your email address before continuing');
    }
    if (account.password.length < PASSWORD_MIN_LENGTH) {
      nextFieldErrors.password = t('auth.passwordMinLength', { length: PASSWORD_MIN_LENGTH });
    }
    if (account.password !== account.confirm) {
      nextFieldErrors.confirm = t('auth.passwordsDoNotMatch');
    }

    let providerPayload:
      | {
          businessName: string;
          service: string;
          location: string;
          moneyRange: string;
          services: Array<{ name: string; price: string }>;
        }
      | null = null;

    if (role === 'serviceProvider') {
      if (isLoadingServices) {
        setError(t('auth.servicesLoading'));
        return;
      }

      if (publicServices.length === 0) {
        setError(t('auth.noServicesAvailable'));
        return;
      }

      if (!isNonEmpty(provider.businessName)) nextFieldErrors.businessName = t('auth.businessNameRequired');
      if (!isNonEmpty(provider.service)) nextFieldErrors.service = t('auth.serviceRequired');
      if (!isNonEmpty(provider.location)) nextFieldErrors.location = t('auth.locationRequired');
      if (!isNonEmpty(provider.moneyRange)) nextFieldErrors.moneyRange = t('auth.moneyRangeRequired');

      const normalizedServices = normalizeServiceRows(provider.services);
      const hasCompleteService = normalizedServices.some((service) => isNonEmpty(service.name) && isNonEmpty(service.price));

      if (!hasCompleteService) {
        nextFieldErrors.services = t('auth.servicesRequired');
      }

      const hasPartialService = normalizedServices.some(
        (service) =>
          (isNonEmpty(service.name) && !isNonEmpty(service.price)) ||
          (!isNonEmpty(service.name) && isNonEmpty(service.price))
      );

      if (hasPartialService) {
        nextFieldErrors.services = t('auth.serviceRowIncomplete');
      }

      if (showAppLinks) {
        const { appLinks } = provider;
        const hasAppChoice = appLinks.webApp || appLinks.mobileApp;

        if (!hasAppChoice) {
          nextFieldErrors.appLinks = t('auth.appLinksRequired');
        }

        if (appLinks.webApp && !isNonEmpty(appLinks.webAppUrl)) {
          nextFieldErrors.webAppUrl = t('auth.webAppUrlRequired');
        }

        if (appLinks.mobileApp) {
          const hasStoreChoice = appLinks.playStore || appLinks.appStore;
          if (!hasStoreChoice) {
            nextFieldErrors.appLinks = t('auth.storeLinksRequired');
          }

          if (appLinks.playStore && !isNonEmpty(appLinks.playStoreUrl)) {
            nextFieldErrors.playStoreUrl = t('auth.playStoreUrlRequired');
          }

          if (appLinks.appStore && !isNonEmpty(appLinks.appStoreUrl)) {
            nextFieldErrors.appStoreUrl = t('auth.appStoreUrlRequired');
          }
        }
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setError(Object.values(nextFieldErrors)[0] ?? t('auth.fixHighlightedFields'));
        return;
      }

      providerPayload = {
        businessName: provider.businessName.trim(),
        service: provider.service.trim(),
        location: provider.location.trim(),
        moneyRange: provider.moneyRange.trim(),
        services: [
          ...normalizedServices.filter((service) => isNonEmpty(service.name) && isNonEmpty(service.price)),
          ...buildAppServiceRows(provider.appLinks),
        ],
      };
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0] ?? t('auth.fixHighlightedFields'));
      return;
    }

    setFieldErrors({});

    await performRegistration(providerPayload as Record<string, unknown> | null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12 pt-20">
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden bg-white shadow-lg">
          {success ? (
            <div className="space-y-6 px-6 py-12 text-center sm:px-8">
              <img src={logo} alt="Your Kigali Bestie" className="mx-auto h-14 w-auto object-contain" />
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">{t('auth.registrationComplete')}</h2>
                <p className="mx-auto max-w-md text-sm text-gray-600">
                  {safeNext ? t('auth.redirecting') : t('auth.accountCreated')}
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button type="button" className="ykb-button-primary" onClick={resetForm}>
                  {t('auth.registerAnother')}
                </button>
                <Link to={safeNext ?? loginHref} className="ykb-button-outline">
                  {safeNext ? t('auth.continue') : t('auth.goToLogin')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <div className="mb-6 text-center">
                <img src={logo} alt="Your Kigali Bestie" className="mx-auto h-16 w-auto object-contain" />
                <div className="mx-auto mt-4 h-px w-8 bg-secondary" />
                <h1 className="mt-4 text-xl font-semibold text-primary">{t('auth.createAccountTitle')}</h1>
                <p className="mt-1 text-xs text-textSecondary">{t('auth.createAccountDescription')}</p>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-textSecondary">
                    <span>{t('auth.registrationProgress')}</span>
                    <span className="text-sm font-bold text-primary">
                      {!role ? '—' : role === 'serviceProvider' ? `${step}/2` : '1/1'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-secondary transition-all duration-300"
                      style={{ width: !role ? '0%' : role === 'serviceProvider' ? (step === 1 ? '50%' : '100%') : '100%' }}
                    />
                  </div>
                </div>
              </div>

              <form
                onSubmit={role === 'serviceProvider' ? (step === 1 ? handleFirstStepSubmit : handleSubmit) : handleStarterSubmit}
                className="space-y-5"
                noValidate
              >
                {showRequestNotice ? <div className="ykb-alert ykb-alert-info">{t('auth.requestNotice')}</div> : null}

                {error ? <div className="ykb-alert ykb-alert-error">{error}</div> : null}

                {PHASE1_ENABLED ? (
                  <div>
                    {renderFieldLabel(t('auth.registerAs'), 'role')}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                          role === 'starter'
                            ? 'border-secondary bg-secondary/10'
                            : 'border-border bg-surface hover:border-secondary/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value="starter"
                          checked={role === 'starter'}
                          onChange={() => {
                            setRole('starter');
                            setStep(1);
                            setError(null);
                            setFieldErrors({});
                          }}
                          className="mt-1 h-4 w-4 rounded border-border text-secondary focus:ring-secondary"
                        />
                        <span className="text-sm text-primary">
                          <span className="block font-semibold">{t('auth.starter')}</span>
                          <span className="block text-xs text-textSecondary">{t('auth.starterDescription')}</span>
                        </span>
                      </label>

                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                          role === 'serviceProvider'
                            ? 'border-secondary bg-secondary/10'
                            : 'border-border bg-surface hover:border-secondary/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value="serviceProvider"
                          checked={role === 'serviceProvider'}
                          onChange={() => {
                            setRole('serviceProvider');
                            setStep(1);
                            setError(null);
                            setFieldErrors({});
                            setProvider(buildDefaultProviderState(publicServices));
                          }}
                          className="mt-1 h-4 w-4 rounded border-border text-secondary focus:ring-secondary"
                        />
                        <span className="text-sm text-primary">
                          <span className="block font-semibold">{t('auth.serviceProvider')}</span>
                          <span className="block text-xs text-textSecondary">{t('auth.serviceProviderDescription')}</span>
                        </span>
                      </label>
                    </div>
                    {inlineError('role')}
                  </div>
                ) : null}

                {role === '' ? (
                  <div className="ykb-alert ykb-alert-info">{t('auth.chooseType')}</div>
                ) : role === 'starter' ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        {renderFieldLabel(t('auth.firstName'), 'firstName')}
                        <input
                          id="firstName"
                          required
                          value={identity.firstName}
                          onChange={(event) => {
                            setIdentity((prev) => ({ ...prev, firstName: event.target.value }));
                            clearFieldError('firstName');
                          }}
                          className={fieldClass('firstName')}
                          placeholder="e.g. Aline"
                        />
                        {inlineError('firstName')}
                      </div>

                      <div>
                        {renderFieldLabel(t('auth.middleName'), 'middleName', false, t)}
                        <input
                          id="middleName"
                          value={identity.middleName}
                          onChange={(event) => setIdentity((prev) => ({ ...prev, middleName: event.target.value }))}
                          className="ykb-field"
                          placeholder="e.g. Marie"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        {renderFieldLabel(t('auth.lastName'), 'lastName')}
                        <input
                          id="lastName"
                          required
                          value={identity.lastName}
                          onChange={(event) => {
                            setIdentity((prev) => ({ ...prev, lastName: event.target.value }));
                            clearFieldError('lastName');
                          }}
                          className={fieldClass('lastName')}
                          placeholder="e.g. Uwase"
                        />
                        {inlineError('lastName')}
                      </div>

                      <div>
                        {renderFieldLabel(t('auth.country'), 'country')}
                        <input
                          id="country"
                          required
                          value={identity.country}
                          onChange={(event) => {
                            setIdentity((prev) => ({ ...prev, country: event.target.value }));
                            clearFieldError('country');
                          }}
                          className={fieldClass('country')}
                          placeholder="e.g. Rwanda"
                        />
                        {inlineError('country')}
                      </div>
                    </div>

                    <div>
                      {renderFieldLabel(t('auth.phone'), 'phone')}
                      <input
                        id="phone"
                        required
                        value={identity.phone}
                        onChange={(event) => {
                          setIdentity((prev) => ({ ...prev, phone: onlyDigits(event.target.value).slice(0, 15) }));
                          clearFieldError('phone');
                        }}
                        className={fieldClass('phone')}
                        inputMode="tel"
                        placeholder="e.g. 0798891543"
                      />
                      {inlineError('phone')}
                    </div>

                    <div>
                      {renderFieldLabel(t('auth.emailAddress'), 'email')}
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            id="email"
                            type="email"
                            required
                            value={account.email}
                            onChange={(event) => {
                              setAccount((prev) => ({ ...prev, email: event.target.value }));
                              clearFieldError('email');
                              setEmailVerified(false);
                              setShowVerificationCode(false);
                              setVerificationCode('');
                            }}
                            className={fieldClass('email')}
                            placeholder="you@example.com"
                            disabled={emailVerified}
                          />
                          {!emailVerified ? (
                            <button
                              type="button"
                              onClick={sendEmailVerificationCode}
                              disabled={sendingVerificationCode || !account.email.trim()}
                              className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {sendingVerificationCode ? 'Sending...' : 'Verify Email'}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </div>
                          )}
                        </div>

                        {showVerificationCode && !emailVerified ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              placeholder="Enter 6-digit verification code"
                              className="ykb-field"
                            />
                            <button
                              type="button"
                              onClick={verifyEmailCode}
                              disabled={isVerifyingEmail || !verificationCode.trim()}
                              className="w-full rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isVerifyingEmail ? 'Verifying...' : 'Confirm Verification'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {inlineError('email')}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        {renderFieldLabel(t('auth.password'), 'password')}
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={account.password}
                            onChange={(event) => {
                              setAccount((prev) => ({ ...prev, password: event.target.value }));
                              clearFieldError('password');
                            }}
                            className={fieldClass('password', 'pr-10')}
                            autoComplete="new-password"
                            placeholder={t('auth.minCharacters', { length: PASSWORD_MIN_LENGTH })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary transition hover:text-primary"
                            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {inlineError('password')}
                      </div>

                      <div>
                        {renderFieldLabel(t('auth.confirmPassword'), 'confirm')}
                        <div className="relative">
                          <input
                            id="confirm"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={account.confirm}
                            onChange={(event) => {
                              setAccount((prev) => ({ ...prev, confirm: event.target.value }));
                              clearFieldError('confirm');
                            }}
                            className={fieldClass('confirm', 'pr-10')}
                            autoComplete="new-password"
                            placeholder={t('auth.confirmYourPassword')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary transition hover:text-primary"
                            aria-label={showConfirmPassword ? t('auth.hideConfirmPassword') : t('auth.showConfirmPassword')}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {inlineError('confirm')}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full ykb-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t('auth.creatingAccount') : t('auth.createStarterAccount')}
                    </button>
                  </>
                ) : step === 1 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        {renderFieldLabel(t('auth.firstName'), 'firstName')}
                        <input
                          id="firstName"
                          required
                          value={identity.firstName}
                          onChange={(event) => {
                            setIdentity((prev) => ({ ...prev, firstName: event.target.value }));
                            clearFieldError('firstName');
                          }}
                          className={fieldClass('firstName')}
                          placeholder="e.g. Aline"
                        />
                        {inlineError('firstName')}
                      </div>

                      <div>
                        {renderFieldLabel(t('auth.middleName'), 'middleName', false, t)}
                        <input
                          id="middleName"
                          value={identity.middleName}
                          onChange={(event) => setIdentity((prev) => ({ ...prev, middleName: event.target.value }))}
                          className="ykb-field"
                          placeholder="e.g. Marie"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        {renderFieldLabel(t('auth.lastName'), 'lastName')}
                        <input
                          id="lastName"
                          required
                          value={identity.lastName}
                          onChange={(event) => {
                            setIdentity((prev) => ({ ...prev, lastName: event.target.value }));
                            clearFieldError('lastName');
                          }}
                          className={fieldClass('lastName')}
                          placeholder="e.g. Uwase"
                        />
                        {inlineError('lastName')}
                      </div>

                      <div>
                        {renderFieldLabel(t('auth.country'), 'country')}
                        <input
                          id="country"
                          required
                          value={identity.country}
                          onChange={(event) => {
                            setIdentity((prev) => ({ ...prev, country: event.target.value }));
                            clearFieldError('country');
                          }}
                          className={fieldClass('country')}
                          placeholder="e.g. Rwanda"
                        />
                        {inlineError('country')}
                      </div>
                    </div>

                    <div>
                      {renderFieldLabel(t('auth.phone'), 'phone')}
                      <input
                        id="phone"
                        required
                        value={identity.phone}
                        onChange={(event) => {
                          setIdentity((prev) => ({ ...prev, phone: onlyDigits(event.target.value).slice(0, 15) }));
                          clearFieldError('phone');
                        }}
                        className={fieldClass('phone')}
                        inputMode="tel"
                        placeholder="e.g. 0798891543"
                      />
                      {inlineError('phone')}
                    </div>

                    <button
                      type="submit"
                      className="w-full ykb-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                    >
                      {t('auth.continueAccountSetup')}
                    </button>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('auth.reviewInfo')}</h3>
                      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <span className="text-gray-500">{t('auth.name')}:</span> {identity.firstName} {identity.middleName} {identity.lastName}
                        </div>
                        <div>
                          <span className="text-gray-500">{t('auth.country')}:</span> {identity.country}
                        </div>
                        <div>
                          <span className="text-gray-500">{t('auth.phone')}:</span> {identity.phone}
                        </div>
                        <div>
                          <span className="text-gray-500">{t('auth.type')}:</span> {role === 'serviceProvider' ? t('auth.serviceProvider') : t('auth.starter')}
                        </div>
                      </div>
                    </div>

                    <div>
                      {renderFieldLabel(t('auth.emailAddress'), 'email')}
                      <div className="space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            id="email"
                            type="email"
                            required
                            value={account.email}
                            onChange={(event) => {
                              setAccount((prev) => ({ ...prev, email: event.target.value }));
                              clearFieldError('email');
                              setEmailVerified(false);
                              setShowVerificationCode(false);
                              setVerificationCode('');
                            }}
                            className={fieldClass('email')}
                            placeholder="you@example.com"
                            disabled={emailVerified}
                          />
                          {!emailVerified ? (
                            <button
                              type="button"
                              onClick={sendEmailVerificationCode}
                              disabled={sendingVerificationCode || !account.email.trim()}
                              className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {sendingVerificationCode ? 'Sending...' : 'Verify Email'}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </div>
                          )}
                        </div>

                        {showVerificationCode && !emailVerified ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              placeholder="Enter 6-digit verification code"
                              className="ykb-field"
                            />
                            <button
                              type="button"
                              onClick={verifyEmailCode}
                              disabled={isVerifyingEmail || !verificationCode.trim()}
                              className="w-full rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isVerifyingEmail ? 'Verifying...' : 'Confirm Verification'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {inlineError('email')}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        {renderFieldLabel(t('auth.password'), 'password')}
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={account.password}
                            onChange={(event) => {
                              setAccount((prev) => ({ ...prev, password: event.target.value }));
                              clearFieldError('password');
                            }}
                            className={fieldClass('password', 'pr-10')}
                            autoComplete="new-password"
                            placeholder={t('auth.minCharacters', { length: PASSWORD_MIN_LENGTH })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary transition hover:text-primary"
                            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {inlineError('password')}
                      </div>

                      <div>
                        {renderFieldLabel(t('auth.confirmPassword'), 'confirm')}
                        <div className="relative">
                          <input
                            id="confirm"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={account.confirm}
                            onChange={(event) => {
                              setAccount((prev) => ({ ...prev, confirm: event.target.value }));
                              clearFieldError('confirm');
                            }}
                            className={fieldClass('confirm', 'pr-10')}
                            autoComplete="new-password"
                            placeholder={t('auth.confirmYourPassword')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary transition hover:text-primary"
                            aria-label={showConfirmPassword ? t('auth.hideConfirmPassword') : t('auth.showConfirmPassword')}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {inlineError('confirm')}
                      </div>
                    </div>

                    {role === 'serviceProvider' ? (
                      <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
                        <h3 className="text-lg font-semibold text-gray-800">{t('auth.businessInfo')}</h3>

                        {serviceLoadError ? <div className="ykb-alert ykb-alert-error">{serviceLoadError}</div> : null}

                        <div>
                          {renderFieldLabel(t('auth.businessName'), 'businessName')}
                          <input
                            id="businessName"
                            required
                            value={provider.businessName}
                            onChange={(event) => {
                              setProvider((prev) => ({ ...prev, businessName: event.target.value }));
                              clearFieldError('businessName');
                            }}
                            className={fieldClass('businessName')}
                            placeholder="e.g. Kigali Quick Help"
                          />
                          {inlineError('businessName')}
                        </div>

                        <div>
                          {renderFieldLabel(t('auth.mainService'), 'service')}
                          <select
                            id="service"
                            required
                            value={provider.service}
                            disabled={isLoadingServices || publicServices.length === 0}
                            onChange={(event) => {
                              setProvider((prev) => ({ ...prev, service: event.target.value }));
                              clearFieldError('service');
                            }}
                            className={`${fieldClass('service')} disabled:opacity-50`}
                          >
                            <option value="">{isLoadingServices ? t('auth.loadingServices') : t('auth.selectService')}</option>
                            {publicServices.map((service) => (
                              <option key={service.id} value={service.title}>
                                {service.title}
                              </option>
                            ))}
                          </select>
                          {inlineError('service')}
                        </div>

                        {providerService ? (
                          <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                            <p className="font-semibold text-gray-700">{providerService.title}</p>
                            <p className="mt-1 text-xs text-gray-600">{providerService.description}</p>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            {renderFieldLabel(t('auth.location'), 'location')}
                            <input
                              id="location"
                              required
                              value={provider.location}
                              onChange={(event) => {
                                setProvider((prev) => ({ ...prev, location: event.target.value }));
                                clearFieldError('location');
                              }}
                              className={fieldClass('location')}
                              placeholder="e.g. Kigali, Rwanda"
                            />
                            {inlineError('location')}
                          </div>

                          <div>
                            {renderFieldLabel(t('auth.moneyRange'), 'moneyRange')}
                            <input
                              id="moneyRange"
                              required
                              value={provider.moneyRange}
                              onChange={(event) => {
                                setProvider((prev) => ({ ...prev, moneyRange: event.target.value }));
                                clearFieldError('moneyRange');
                              }}
                              className={fieldClass('moneyRange')}
                              placeholder="e.g. 10,000 - 100,000 RWF"
                            />
                            {inlineError('moneyRange')}
                          </div>
                        </div>

                        {showAppLinks ? (
                          <div className="space-y-4 rounded-lg border border-dashed border-gray-300 bg-white p-4">
                            <div>
                              <h4 className="font-semibold text-gray-800">{t('auth.appLinks')}</h4>
                              <p className="text-xs text-gray-500">{t('auth.appLinksDescription')}</p>
                            </div>

                            <div className="space-y-4">
                              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                                <input
                                  type="checkbox"
                                  checked={provider.appLinks.webApp}
                                  onChange={(event) => {
                                    const checked = event.target.checked;
                                    setProvider((prev) => ({
                                      ...prev,
                                      appLinks: {
                                        ...prev.appLinks,
                                        webApp: checked,
                                        webAppUrl: checked ? prev.appLinks.webAppUrl : '',
                                      },
                                    }));
                                    clearFieldError('appLinks');
                                    clearFieldError('webAppUrl');
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">
                                  <span className="block font-semibold">{t('auth.webApp')}</span>
                                  <span className="text-xs text-gray-500">{t('auth.webAppDescription')}</span>
                                </span>
                              </label>

                              {provider.appLinks.webApp ? (
                                <div>
                                  {renderFieldLabel(t('auth.webAppLink'), 'webAppUrl')}
                                  <input
                                    id="webAppUrl"
                                    required
                                    type="url"
                                    value={provider.appLinks.webAppUrl}
                                    onChange={(event) => {
                                      setProvider((prev) => ({
                                        ...prev,
                                        appLinks: { ...prev.appLinks, webAppUrl: event.target.value },
                                      }));
                                      clearFieldError('webAppUrl');
                                    }}
                                    className={fieldClass('webAppUrl')}
                                    placeholder="https://your-web-app.example"
                                  />
                                  {inlineError('webAppUrl')}
                                </div>
                              ) : null}

                              <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                                <input
                                  type="checkbox"
                                  checked={provider.appLinks.mobileApp}
                                  onChange={(event) => {
                                    const checked = event.target.checked;
                                    setProvider((prev) => ({
                                      ...prev,
                                      appLinks: {
                                        ...prev.appLinks,
                                        mobileApp: checked,
                                        playStore: checked ? prev.appLinks.playStore : false,
                                        playStoreUrl: checked ? prev.appLinks.playStoreUrl : '',
                                        appStore: checked ? prev.appLinks.appStore : false,
                                        appStoreUrl: checked ? prev.appLinks.appStoreUrl : '',
                                      },
                                    }));
                                    clearFieldError('appLinks');
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">
                                  <span className="block font-semibold">{t('auth.mobileApp')}</span>
                                  <span className="text-xs text-gray-500">{t('auth.mobileAppDescription')}</span>
                                </span>
                              </label>

                              {provider.appLinks.mobileApp ? (
                                <div className="space-y-4 pl-1">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                                      <input
                                        type="checkbox"
                                        checked={provider.appLinks.playStore}
                                        onChange={(event) => {
                                          const checked = event.target.checked;
                                          setProvider((prev) => ({
                                            ...prev,
                                            appLinks: {
                                              ...prev.appLinks,
                                              playStore: checked,
                                              playStoreUrl: checked ? prev.appLinks.playStoreUrl : '',
                                            },
                                          }));
                                          clearFieldError('appLinks');
                                          clearFieldError('playStoreUrl');
                                        }}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                      <span className="text-sm text-gray-700">
                                        <span className="block font-semibold">{t('auth.playStore')}</span>
                                        <span className="text-xs text-gray-500">{t('auth.playStoreDescription')}</span>
                                      </span>
                                    </label>

                                    <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                                      <input
                                        type="checkbox"
                                        checked={provider.appLinks.appStore}
                                        onChange={(event) => {
                                          const checked = event.target.checked;
                                          setProvider((prev) => ({
                                            ...prev,
                                            appLinks: {
                                              ...prev.appLinks,
                                              appStore: checked,
                                              appStoreUrl: checked ? prev.appLinks.appStoreUrl : '',
                                            },
                                          }));
                                          clearFieldError('appLinks');
                                          clearFieldError('appStoreUrl');
                                        }}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                      />
                                      <span className="text-sm text-gray-700">
                                        <span className="block font-semibold">{t('auth.appStore')}</span>
                                        <span className="text-xs text-gray-500">{t('auth.appStoreDescription')}</span>
                                      </span>
                                    </label>
                                  </div>

                                  {provider.appLinks.playStore ? (
                                    <div>
                                      {renderFieldLabel(t('auth.playStoreLink'), 'playStoreUrl')}
                                      <input
                                        id="playStoreUrl"
                                        required
                                        type="url"
                                        value={provider.appLinks.playStoreUrl}
                                        onChange={(event) => {
                                          setProvider((prev) => ({
                                            ...prev,
                                            appLinks: { ...prev.appLinks, playStoreUrl: event.target.value },
                                          }));
                                          clearFieldError('playStoreUrl');
                                        }}
                                        className={fieldClass('playStoreUrl')}
                                        placeholder="https://play.google.com/store/apps/details?id=..."
                                      />
                                      {inlineError('playStoreUrl')}
                                    </div>
                                  ) : null}

                                  {provider.appLinks.appStore ? (
                                    <div>
                                      {renderFieldLabel(t('auth.appStoreLink'), 'appStoreUrl')}
                                      <input
                                        id="appStoreUrl"
                                        required
                                        type="url"
                                        value={provider.appLinks.appStoreUrl}
                                        onChange={(event) => {
                                          setProvider((prev) => ({
                                            ...prev,
                                            appLinks: { ...prev.appLinks, appStoreUrl: event.target.value },
                                          }));
                                          clearFieldError('appStoreUrl');
                                        }}
                                        className={fieldClass('appStoreUrl')}
                                        placeholder="https://apps.apple.com/app/..."
                                      />
                                      {inlineError('appStoreUrl')}
                                    </div>
                                  ) : null}

                                  {inlineError('appLinks')}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : null}

                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{t('auth.servicesYouProvide')}</h4>
                              <p className="text-xs text-gray-500">{t('auth.addEachService')}</p>
                            </div>
                            <button
                              type="button"
                              onClick={addServiceRow}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm transition hover:bg-gray-50"
                            >
                              {t('auth.addService')}
                            </button>
                          </div>

                          <div className="space-y-3">
                            {provider.services.map((serviceRow, index) => (
                              <div key={`service-row-${index}`} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
                                <p className="text-sm font-medium text-gray-600">Service #{index + 1}</p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <input
                                    placeholder={t('auth.serviceNamePlaceholder')}
                                    value={serviceRow.name}
                                    onChange={(event) => updateServiceRow(index, 'name', event.target.value)}
                                    className="ykb-field text-sm"
                                  />
                                  <input
                                    placeholder={t('auth.pricePlaceholder')}
                                    value={serviceRow.price}
                                    onChange={(event) => updateServiceRow(index, 'price', event.target.value)}
                                    className="ykb-field text-sm"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {inlineError('services')}
                        </div>
                      </div>
                    ) : null}

                    {role === 'serviceProvider' && step === 2 ? (
                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setStep(1);
                            setError(null);
                          }}
                          className="ykb-button-outline disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSubmitting}
                        >
                          {t('auth.back')}
                        </button>
                        <button
                          type="submit"
                          className="flex-1 ykb-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? t('auth.creatingAccount') : t('auth.completeRegistration')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
