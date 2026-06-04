import { useState, type FormEvent ,useEffect} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackendAuthError, loginBackend } from '../utils/backendAuth';
import logo from '../assets/images/logo.png';
import { LoadingSpinner } from '../components/LoadingSpinner';

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingScript = document.querySelector('script[src="https://www.googletagmanager.com/gtag/js?id=G-5T7DTFNYP6"]');
    if (existingScript) return;

    const externalScript = document.createElement('script');
    externalScript.async = true;
    externalScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-5T7DTFNYP6';
    document.head.appendChild(externalScript);

    const inlineScript = document.createElement('script');
    inlineScript.text = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-5T7DTFNYP6');`;
    document.head.appendChild(inlineScript);

    return () => {
      document.head.removeChild(externalScript);
      document.head.removeChild(inlineScript);
    };
  }, []);


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const clearFieldError = (key: 'email' | 'password') => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };



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
    setIsLoading(true);

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

      if (status === 0 && err instanceof BackendAuthError) {
        setError(err.message);
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

      if (status === 400 && err instanceof BackendAuthError) {
        setError(err.message);
        return;
      }

      if (status && status >= 500) {
        setError(t('auth.serverError'));
        return;
      }

      setError(t('auth.couldNotSignIn'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 pt-20">
      <div className="max-w-md mx-auto">
        {/* Login Card */}
        <div className="bg-white shadow-lg overflow-hidden">
          {/* Logo Section */}
          <div className="flex justify-center pt-8 pb-4 border-b border-gray-100">
            <img src={logo} alt="Your Kigali Bestie" className="h-20 w-auto object-contain" />
          </div>

          {/* Form Section */}
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="h-px w-8 bg-secondary mx-auto mb-4"></div>
              <h1 className="text-xl font-semibold text-primary">{t('auth.welcomeBack')}</h1>
              <p className="text-xs text-textSecondary mt-1">{t('auth.signInDescription')}</p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {showRequestNotice && (
                <div className="border-l-4 border-secondary bg-secondary/5 p-3">
                  <p className="text-xs text-textSecondary">{t('auth.requestNotice')}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-primary mb-1.5" htmlFor="email">
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
                  className={`w-full border px-3 py-2 text-sm transition-colors focus:outline-none focus:border-secondary ${
                    fieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200'
                  }`}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-primary" htmlFor="password">
                    {t('auth.password')}
                  </label>
                  <Link to="/forgot-password" className="text-xs text-secondary hover:text-accent transition">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                  }}
                  className={`w-full border px-3 py-2 text-sm transition-colors focus:outline-none focus:border-secondary ${
                    fieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200'
                  }`}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              {error && (
                <div className="border-l-4 border-red-500 bg-red-50 p-3">
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="border-l-4 border-green-500 bg-green-50 p-3">
                  <p className="text-xs text-green-700">{t('auth.loggedIn')}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full border border-secondary bg-secondary py-2.5 font-semibold text-primary transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>{t('auth.signingIn') || 'Signing in...'}</span>
                  </div>
                ) : (
                  t('auth.signInButton')
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-400">{t('auth.newToPlatform')}</span>
                </div>
              </div>

              <Link to={registerHref}>
                <button type="button" className="w-full border border-gray-200 bg-white py-2.5 font-semibold text-primary transition-all hover:border-secondary hover:bg-secondary/5 text-sm">
                  {t('auth.createAccount')}
                </button>
              </Link>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}