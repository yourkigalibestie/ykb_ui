import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { login as loginMock, seedAuthIfEmpty } from '../utils/auth';
import { BackendAuthError, loginBackend } from '../utils/backendAuth';
import logo from '../assets/images/logo.png';

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const nextParam = params.get('next');
  const reason = params.get('reason');
  const safeNext = nextParam && nextParam.startsWith('/') ? nextParam : null;
  const showRequestNotice = reason === 'request' || Boolean(safeNext?.startsWith('/request'));
  const registerHref = (() => {
    if (!safeNext && !reason) return '/register';
    const nextParams = new URLSearchParams();
    if (safeNext) nextParams.set('next', safeNext);
    if (reason) nextParams.set('reason', reason);
    return `/register?${nextParams.toString()}`;
  })();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const clearFieldError = (key: 'email' | 'password') => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    // Helps you test quickly without registering first.
    seedAuthIfEmpty();
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const nextFieldErrors: { email?: string; password?: string } = {};
    if (email.trim().length === 0) nextFieldErrors.email = t('auth.emailRequired');
    if (password.trim().length === 0) nextFieldErrors.password = t('auth.passwordRequired');

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0] ?? t('auth.fixHighlightedFields'));
      return;
    }

    setFieldErrors({});

    // safeNext is computed once above

    try {
      const session = await loginBackend(email, password);
      setSuccess(true);
      const destination = safeNext ?? (session.user.role === 'ADMIN' ? '/admin' : '/profile');
      setTimeout(() => navigate(destination), 400);
      return;
    } catch (err) {
      const status = err instanceof BackendAuthError ? err.status : undefined;

      if (status === 401 || status === 404) {
        setFieldErrors({ email: t('auth.checkEmail'), password: t('auth.incorrectCredentials') });
      }

      // If the backend says "invalid credentials", fall back to the existing mocked auth
      // so the demo accounts still work.
      if (status === 401 || status === 404) {
        const result = loginMock(email, password);
        if (result.ok === false) {
          setError(result.message);
          return;
        }

        setSuccess(true);
        setTimeout(() => navigate(safeNext ?? '/profile'), 400);
        return;
      }

      if (status === 401 || status === 404) {
        setError(t('auth.incorrectCredentials'));
        return;
      }

      if (status === 429) {
        setError(t('auth.tooManyAttempts'));
        return;
      }

      if (status === 0 && err instanceof BackendAuthError) {
        setError(err.message);
        return;
      }

      if (status === 400 && err instanceof BackendAuthError) {
        setError(err.message);
        return;
      }

      if (status && status >= 500) {
        setError(t('auth.serverError'));
        return;
      }

      setError(t('auth.couldNotSignIn'));
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-12 px-4 pt-26">
      <div className="max-w-4xl mx-auto">
        {/* Unified Card Container */}
        <div className="bg-white shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar Section - Professional info panel integrated with the card */}
            <div className="md:w-2/5 bg-primary p-8 text-white">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-4 text-white pt-16">{t('auth.welcomeBack')}</h1>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {t('auth.signInDescription')}
                  </p>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-secondary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-white/80">{t('auth.accessDashboard')}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-secondary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-white/80">{t('auth.manageRequests')}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-secondary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-white/80">{t('auth.updateProfile')}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Form Section */}
            <div className="md:w-3/5 p-8">
              <div className="flex justify-center mb-6">
                <img src={logo} alt="Your Kigali Bestie" className="h-26 w-auto object-contain" />
              </div>
              <form onSubmit={submit} className="space-y-5">
                {showRequestNotice ? (
                  <div className="ykb-alert ykb-alert-info">
                    {t('auth.requestNotice')}
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="email">
                    {t('auth.emailAddress')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    className={`ykb-field ${fieldErrors.email ? 'border-error focus:border-error focus:ring-error/20' : ''}`}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                  {fieldErrors.email ? (
                    <p className="mt-1 text-xs font-semibold text-error">{fieldErrors.email}</p>
                  ) : null}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-semibold text-primary" htmlFor="password">
                      {t('auth.password')}
                    </label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-secondary hover:text-accent transition">
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      className={`ykb-field pr-10 ${fieldErrors.password ? 'border-error focus:border-error focus:ring-error/20' : ''}`}
                      autoComplete="current-password"
                      placeholder="Enter your password"
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
                  {fieldErrors.password ? (
                    <p className="mt-1 text-xs font-semibold text-error">{fieldErrors.password}</p>
                  ) : null}
                </div>

                {error && (
                  <div className="ykb-alert ykb-alert-error">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="ykb-alert ykb-alert-success">
                    {t('auth.loggedIn')}
                  </div>
                )}

                <button type="submit" className="w-full ykb-button-primary">
                  {t('auth.signInButton')}
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">{t('auth.newToPlatform')}</span>
                  </div>
                </div>

                <Link to={registerHref}>
                  <button type="button" className="w-full ykb-button-outline">
                    {t('auth.createAccount')}
                  </button>
                </Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}