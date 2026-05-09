import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchPublicServices, type PublicService } from '../data/registrationServices';
import { type ServiceOffering, type UserRole } from '../utils/auth';
import { BackendAuthError, registerBackend } from '../utils/backendAuth';
import logo from '../assets/images/logo.png';

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
    <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor={htmlFor}>
      {label}
      {!required && t ? <span className="text-gray-400">{t('auth.optional')}</span> : null}
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
  const [role, setRole] = useState<UserRole | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [serviceLoadError, setServiceLoadError] = useState<string | null>(null);
  const [publicServices, setPublicServices] = useState<PublicService[]>([]);

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
  }, []);

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
    setRole('');
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
        setFieldErrors((prev) => ({ ...prev, email: t('auth.accountExists') }));
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
    <main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-12 px-4 pt-20">
      <div className="max-w-6xl mx-auto">
        {/* Unified Card Container */}
        <div className="bg-white  shadow-xl overflow-hidden">
          {success ? (
            <div className="text-center space-y-6 py-16 px-8">
              <div className="flex justify-center">
                <img src={logo} alt="Your Kigali Bestie" className="h-14 w-auto object-contain" />
              </div>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">{t('auth.registrationComplete')}</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                {safeNext
                  ? t('auth.redirecting')
                  : t('auth.accountCreated')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button type="button" className="ykb-button-primary" onClick={resetForm}>
                  {t('auth.registerAnother')}
                </button>
                <Link to={safeNext ?? loginHref} className="ykb-button-outline">
                  {safeNext ? t('auth.continue') : t('auth.goToLogin')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Sidebar Section - Now visually integrated */}
              <div className="md:w-2/5 bg-primary p-8 text-white">
                <div className="space-y-6">
                  <div>

                    <h1 className="text-3xl font-bold mb-6 text-white">{t('auth.createAccountTitle')}</h1>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {t('auth.createAccountDescription')}
                    </p>
                  </div>

                  <div className="border-t border-white/20 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-white/80">{t('auth.registrationProgress')}</span>
                      <span className="text-2xl font-bold">
                        {!role ? '—' : role === 'serviceProvider' ? `${step}/2` : '1/1'}
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-secondary h-2 rounded-full transition-all duration-300" 
                        style={{ width: !role ? '0%' : role === 'serviceProvider' ? (step === 1 ? '50%' : '100%') : '100%' }}
                      />
                    </div>
                  </div>

                  {role === 'serviceProvider' ? (
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center gap-3 text-sm">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-secondary text-primary' : 'bg-white/20 text-white/60'}`}>1</div>
                        <span className={step >= 1 ? 'text-white' : 'text-white/60'}>{t('auth.personalInformation')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-secondary text-primary' : 'bg-white/20 text-white/60'}`}>2</div>
                        <span className={step === 2 ? 'text-white font-medium' : 'text-white/60'}>{t('auth.accountCredentials')}</span>
                      </div>
                    </div>
                  ) : role === 'starter' ? (
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-secondary text-primary">1</div>
                        <span className="text-white">{t('auth.starterDetails')}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="pt-6 border-t border-white/20">
                    <p className="text-xs uppercase tracking-wider text-secondary font-semibold mb-3">{t('auth.selectedAccountType')}</p>
                    <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <p className="font-semibold">
                        {!role ? t('auth.selectType') : role === 'serviceProvider' ? t('auth.serviceProvider') : t('auth.starter')}
                      </p>
                      <p className="text-xs text-white/70 mt-1">
                        {role === 'serviceProvider'
                          ? t('auth.serviceProviderLongDescription')
                          : role === 'starter'
                            ? t('auth.starterLongDescription')
                            : t('auth.chooseType')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="md:w-3/5 p-8">
                <div className="flex justify-center mb-4">
                  <img src={logo} alt="Your Kigali Bestie" className="h-26 w-auto object-contain" />
                </div>
                <form
                  onSubmit={role === 'serviceProvider' ? (step === 1 ? handleFirstStepSubmit : handleSubmit) : handleStarterSubmit}
                  className="space-y-5"
                  noValidate
                >
                  {showRequestNotice ? (
                    <div className="ykb-alert ykb-alert-info">
                      {t('auth.requestNotice')}
                    </div>
                  ) : null}

                  {error && (
                    <div className="ykb-alert ykb-alert-error">
                      {error}
                    </div>
                  )}

                  <div>
                    {renderFieldLabel(t('auth.registerAs'), 'role')}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                          role === 'starter' ? 'border-secondary bg-secondary/10' : 'border-border bg-surface hover:border-secondary/30'
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
                          role === 'serviceProvider' ? 'border-secondary bg-secondary/10' : 'border-border bg-surface hover:border-secondary/30'
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

                  {role === '' ? (
                    <div className="ykb-alert ykb-alert-info">{t('auth.chooseType')}</div>
                  ) : role === 'starter' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <input
                          id="email"
                          type="email"
                          required
                          value={account.email}
                          onChange={(event) => {
                            setAccount((prev) => ({ ...prev, email: event.target.value }));
                            clearFieldError('email');
                          }}
                          className={fieldClass('email')}
                          placeholder="you@example.com"
                        />
                        {inlineError('email')}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-primary transition"
                              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-primary transition"
                              aria-label={showConfirmPassword ? t('auth.hideConfirmPassword') : t('auth.showConfirmPassword')}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {inlineError('confirm')}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full ykb-button-primary disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? t('auth.creatingAccount') : t('auth.createStarterAccount')}
                      </button>
                    </>
                  ) : step === 1 ? (
                    <>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="w-full ykb-button-primary disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                      >
                        {t('auth.continueAccountSetup')}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">{t('auth.reviewInfo')}</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-500">{t('auth.name')}:</span> {identity.firstName} {identity.middleName} {identity.lastName}</div>
                          <div><span className="text-gray-500">{t('auth.country')}:</span> {identity.country}</div>
                          <div><span className="text-gray-500">{t('auth.phone')}:</span> {identity.phone}</div>
                          <div><span className="text-gray-500">{t('auth.type')}:</span> {role === 'serviceProvider' ? t('auth.serviceProvider') : t('auth.starter')}</div>
                        </div>
                      </div>

                      <div>
                        {renderFieldLabel(t('auth.emailAddress'), 'email')}
                        <input
                          id="email"
                          type="email"
                          required
                          value={account.email}
                          onChange={(event) => {
                            setAccount((prev) => ({ ...prev, email: event.target.value }));
                            clearFieldError('email');
                          }}
                          className={fieldClass('email')}
                          placeholder="you@example.com"
                        />
                        {inlineError('email')}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-primary transition"
                              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-primary transition"
                              aria-label={showConfirmPassword ? t('auth.hideConfirmPassword') : t('auth.showConfirmPassword')}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {inlineError('confirm')}
                        </div>
                      </div>

                      {role === 'serviceProvider' && (
                        <div className="space-y-4 bg-surface rounded-lg p-5 border border-border">
                          <h3 className="text-lg font-semibold text-gray-800">{t('auth.businessInfo')}</h3>

                          {serviceLoadError && (
                            <div className="ykb-alert ykb-alert-error">{serviceLoadError}</div>
                          )}

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
                              <option value="">
                                {isLoadingServices ? t('auth.loadingServices') : t('auth.selectService')}
                              </option>
                              {publicServices.map((service) => (
                                <option key={service.id} value={service.title}>
                                  {service.title}
                                </option>
                              ))}
                            </select>
                            {inlineError('service')}
                          </div>

                          {providerService && (
                            <div className="bg-white rounded-lg p-3 text-sm border border-gray-200">
                              <p className="font-semibold text-gray-700">{providerService.title}</p>
                              <p className="text-gray-600 text-xs mt-1">{providerService.description}</p>
                            </div>
                          )}

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

                          {showAppLinks && (
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
                                    <span className="font-semibold block">{t('auth.webApp')}</span>
                                    <span className="text-xs text-gray-500">{t('auth.webAppDescription')}</span>
                                  </span>
                                </label>

                                {provider.appLinks.webApp && (
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
                                )}

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
                                    <span className="font-semibold block">{t('auth.mobileApp')}</span>
                                    <span className="text-xs text-gray-500">{t('auth.mobileAppDescription')}</span>
                                  </span>
                                </label>

                                {provider.appLinks.mobileApp && (
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
                                          <span className="font-semibold block">{t('auth.playStore')}</span>
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
                                          <span className="font-semibold block">{t('auth.appStore')}</span>
                                          <span className="text-xs text-gray-500">{t('auth.appStoreDescription')}</span>
                                        </span>
                                      </label>
                                    </div>

                                    {provider.appLinks.playStore && (
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
                                    )}

                                    {provider.appLinks.appStore && (
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
                                    )}

                                    {inlineError('appLinks')}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-800">{t('auth.servicesYouProvide')}</h4>
                                <p className="text-xs text-gray-500">{t('auth.addEachService')}</p>
                              </div>
                              <button
                                type="button"
                                onClick={addServiceRow}
                                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                              >
                                {t('auth.addService')}
                              </button>
                            </div>

                            <div className="space-y-3">
                              {provider.services.map((serviceRow, index) => (
                                <div key={`service-row-${index}`} className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
                                  <p className="text-sm font-medium text-gray-600">Service #{index + 1}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      )}

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setStep(1);
                            setError(null);
                          }}
                          className="ykb-button-outline disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={isSubmitting}
                        >
                          {t('auth.back')}
                        </button>
                        <button type="submit" className="flex-1 ykb-button-primary disabled:opacity-60 disabled:cursor-not-allowed" disabled={isSubmitting}>
                          {isSubmitting ? t('auth.creatingAccount') : t('auth.completeRegistration')}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}