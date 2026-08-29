import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import logo from '../assets/images/logo.png';

type Step = 'email' | 'verify' | 'reset';

import { API_BASE } from '../utils/apiConfig';

export function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const sendResetCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!email.trim()) {
      setFieldErrors({ email: 'Email is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/send-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
        setStep('verify');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!code.trim()) {
      setFieldErrors({ code: 'Verification code is required' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (response.ok) {
        setSuccess(true);
        setStep('reset');
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Invalid verification code');
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const nextFieldErrors: Record<string, string> = {};

    if (!password.trim()) nextFieldErrors.password = 'Password is required';
    if (password.length < 8) nextFieldErrors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) nextFieldErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const data = await response.json();
        setError(data.error?.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 py-12 px-4 pt-26">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="md:w-2/5 bg-primary p-8 text-white">
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-4 text-white pt-16">Reset Password</h1>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {step === 'email' && 'Enter your email address to receive a verification code.'}
                    {step === 'verify' && 'Enter the verification code sent to your email.'}
                    {step === 'reset' && 'Create a new password for your account.'}
                  </p>
                </div>

                <div className="border-t border-white/20 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-white/80">We'll send a verification code to your email</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-white/80">Verify your identity with the code</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="md:w-3/5 p-8">
              <div className="flex justify-center mb-8">
                <img src={logo} alt="Logo" className="h-12" />
              </div>

              {step === 'email' && (
                <form onSubmit={sendResetCode} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                      className={`ykb-field ${fieldErrors.email ? 'border-error focus:border-error focus:ring-error/20' : ''}`}
                      placeholder="you@example.com"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs font-semibold text-error">{fieldErrors.email}</p>
                    )}
                  </div>

                  {error && <div className="ykb-alert ykb-alert-error">{error}</div>}
                  {success && <div className="ykb-alert ykb-alert-success">Code sent to your email!</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full ykb-button-primary disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </form>
              )}

              {step === 'verify' && (
                <form onSubmit={verifyCode} className="space-y-6">
                  <div className="ykb-alert ykb-alert-info">
                    <p className="font-semibold mb-1">Verification code sent</p>
                    <p className="text-sm">We've sent a verification code to <span className="font-semibold">{email}</span></p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="code">
                      Verification Code
                    </label>
                    <input
                      id="code"
                      type="text"
                      required
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setFieldErrors({ ...fieldErrors, code: '' });
                      }}
                      className={`ykb-field ${fieldErrors.code ? 'border-error focus:border-error focus:ring-error/20' : ''}`}
                      placeholder="Enter the 6-digit code"
                    />
                    {fieldErrors.code && (
                      <p className="mt-1 text-xs font-semibold text-error">{fieldErrors.code}</p>
                    )}
                  </div>

                  {error && <div className="ykb-alert ykb-alert-error">{error}</div>}
                  {success && <div className="ykb-alert ykb-alert-success">Code verified!</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full ykb-button-primary disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-textSecondary mb-3">Didn't receive the code?</p>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        setLoading(true);
                        try {
                          const response = await fetch(`${API_BASE}/auth/send-reset-code`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email }),
                          });

                          if (response.ok) {
                            setSuccess(true);
                            setTimeout(() => setSuccess(false), 3000);
                          } else {
                            const data = await response.json();
                            setError(data.error?.message || 'Failed to resend code');
                          }
                        } catch (err) {
                          setError('Failed to resend code. Please try again.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      className="text-secondary hover:text-accent font-semibold text-sm transition disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="w-full ykb-button-outline"
                  >
                    Back
                  </button>
                </form>
              )}

              {step === 'reset' && (
                <form onSubmit={resetPassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="password">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setFieldErrors({ ...fieldErrors, password: '' });
                        }}
                        className={`ykb-field pr-10 ${fieldErrors.password ? 'border-error focus:border-error focus:ring-error/20' : ''}`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-primary transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1 text-xs font-semibold text-error">{fieldErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="confirmPassword">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                        }}
                        className={`ykb-field pr-10 ${fieldErrors.confirmPassword ? 'border-error focus:border-error focus:ring-error/20' : ''}`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-primary transition"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="mt-1 text-xs font-semibold text-error">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>

                  {error && <div className="ykb-alert ykb-alert-error">{error}</div>}
                  {success && <div className="ykb-alert ykb-alert-success">Password reset successfully! Redirecting to login...</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full ykb-button-primary disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('verify')}
                    className="w-full ykb-button-outline"
                  >
                    Back
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-sm text-textSecondary">
                  Remember your password?{' '}
                  <Link to="/login" className="font-semibold text-secondary hover:text-accent transition">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
