import { useMemo, useState, type FormEvent, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, BadgeCheck, AlertCircle, ArrowLeft, Loader } from 'lucide-react';
import { API_BASE,getBackendAuthHeaders, getBackendAccessToken  } from '../utils/backendAuth';
import { getFriendlyRequestError } from '../utils/friendlyErrors';

type PaymentMethod = 'card' | 'mobileMoney';
type CardBrand = 'Visa' | 'Mastercard' | 'Unknown';

interface Plan {
  id: string;
  title: string;
  features: string[];
  feeRwf: number;
  feeUsd: number;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function formatCardNumber(raw: string): string {
  const digits = onlyDigits(raw).slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function detectCardBrand(raw: string): CardBrand {
  const digits = onlyDigits(raw);
  if (!digits) return 'Unknown';
  if (digits.startsWith('4')) return 'Visa';
  const first2 = Number(digits.slice(0, 2));
  if (first2 >= 51 && first2 <= 55) return 'Mastercard';
  const first4 = Number(digits.slice(0, 4));
  if (first4 >= 2221 && first4 <= 2720) return 'Mastercard';
  return 'Unknown';
}

function brandBadgeClasses(brand: CardBrand): string {
  if (brand === 'Visa') return 'border-primary/30 bg-primary/10 text-primary';
  if (brand === 'Mastercard') return 'border-secondary/30 bg-secondary/10 text-secondary';
  return 'border-border bg-surface text-textSecondary';
}

export function Subscribe() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as { planId?: string; currency?: 'RWF' | 'USD' } | null) ?? null;
  const planId = state?.planId;
  const initialCurrency = state?.currency;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [planLoading, setPlanLoading] = useState(Boolean(planId));
  const [planError, setPlanError] = useState<string | null>(
    planId ? null : 'No plan selected. Please select a plan first.'
  );
  
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [currency, setCurrency] = useState<'RWF' | 'USD'>(initialCurrency || 'RWF');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentWaiting, setPaymentWaiting] = useState(false);
  const [orderTrackingId, setOrderTrackingId] = useState<string | null>(null);
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

  const [card, setCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    email: '',
  });

  const [mobileMoney, setMobileMoney] = useState({
    network: 'mtn' as 'mtn' | 'airtel',
    phone: '',
    name: '',
    email: '',
  });

  const brand = useMemo(() => detectCardBrand(card.number), [card.number]);

  // Fetch plan details if planId is provided
  useEffect(() => {
    if (!planId) {
      return;
    }

    const fetchPlan = async () => {
      try {
        setPlanLoading(true);
        const token = getBackendAccessToken();
        const response = await fetch(`${API_BASE}/plans/${planId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(
            getFriendlyRequestError({
              status: response.status,
              action: 'load plan details',
            })
          );
        }

        const data = await response.json();
        setPlan(data.plan);
      } catch (err) {
        setPlanError(
          err instanceof Error && err.message.trim().length > 0
            ? err.message
            : getFriendlyRequestError({ error: err, action: 'load plan details' })
        );
      } finally {
        setPlanLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  const amount = plan ? (currency === 'RWF' ? plan.feeRwf : plan.feeUsd) : 0;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!plan) {
      setError('Plan information is missing');
      return;
    }

    try {
      setSubmitting(true);
      const token = getBackendAccessToken();

      if (!token) {
        navigate('/login');
        return;
      }

      // Prepare payment details based on method
      const paymentDetails = method === 'card' ? card : {
        ...mobileMoney,
        network: mobileMoney.network === 'mtn' ? 'MTN MoMo' : 'Airtel Money',
        phone: `+250${mobileMoney.phone}`, // Format with country code
      };

      // Create subscription
      const subscriptionResponse = await fetch(`${API_BASE}/subscriptions`, {
        method: 'POST',
        headers: {
          ...getBackendAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          currency,
          paymentMethod: method,
          paymentDetails,
          email: method === 'card' ? card.email : mobileMoney.email,
          firstName: method === 'card' ? card.name.split(' ')[0] : mobileMoney.name.split(' ')[0],
          lastName: method === 'card' ? card.name.split(' ').slice(1).join(' ') || undefined : mobileMoney.name.split(' ').slice(1).join(' ') || undefined,
          phone: method === 'mobileMoney' ? `+250${mobileMoney.phone}` : undefined,
        }),
      });

      if (!subscriptionResponse.ok) {
        let serverMessage = '';
        try {
          const errorData = await subscriptionResponse.json();
          serverMessage = typeof errorData?.message === 'string' ? errorData.message : '';
        } catch {
          // ignore parse errors and fallback to friendly message
        }

        throw new Error(
          serverMessage ||
            getFriendlyRequestError({
              status: subscriptionResponse.status,
              action: 'start your subscription',
            })
        );
      }

      const result = await subscriptionResponse.json();
      if (result.paymentUrl) {
        // Store order tracking ID for polling
        sessionStorage.setItem('pesapalOrderTrackingId', result.pesapalOrderTrackingId);
        sessionStorage.setItem('subscriptionId', result.id);
        setOrderTrackingId(result.pesapalOrderTrackingId);
        
        // Set payment waiting state
        setPaymentWaiting(true);
        setSubmitting(false);
        
        // Open Pesapal in a NEW window instead of redirecting
        const paymentWindow = window.open(result.paymentUrl, 'pesapal_payment', 'width=800,height=600');
        
        if (!paymentWindow) {
          setError('Please allow pop-ups to complete payment');
          setPaymentWaiting(false);
          return;
        }

        // Poll for payment status every 2 seconds
        let pollCount = 0;
        const maxPolls = 150; // 5 minutes max polling
        
        const pollStatus = setInterval(async () => {
          pollCount++;
          
          try {
            const statusResponse = await fetch(
              `${API_BASE}/subscriptions/status/check?orderTrackingId=${encodeURIComponent(result.pesapalOrderTrackingId)}`
            );
            
            if (statusResponse.ok) {
              const subscription = await statusResponse.json();
              
              // If payment succeeded or failed, stop polling and navigate
              if (subscription.status === 'ACTIVE' || subscription.status === 'FAILED') {
                clearInterval(pollStatus);
                
                // Close the Pesapal window if still open
                if (paymentWindow && !paymentWindow.closed) {
                  paymentWindow.close();
                }
                
                // Redirect to payment callback with tracking ID
                navigate(`/payment-callback?order_tracking_id=${encodeURIComponent(result.pesapalOrderTrackingId)}&merchant_ref=${encodeURIComponent(result.pesapalMerchantReference)}`);
              }
            }
          } catch (error) {
            console.error('Status polling error:', error);
          }
          
          // Stop polling after max attempts
          if (pollCount >= maxPolls) {
            clearInterval(pollStatus);
            navigate(`/payment-callback?order_tracking_id=${encodeURIComponent(result.pesapalOrderTrackingId)}&merchant_ref=${encodeURIComponent(result.pesapalMerchantReference)}`);
          }
        }, 2000);
        
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message.trim().length > 0
          ? err.message
          : getFriendlyRequestError({ error: err, action: 'start your subscription' })
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (planLoading) {
    return (
      <main className="pt-16 bg-white text-gray-900">
        <section className="ykb-section bg-dark-light">
          <div className="ykb-container flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </section>
      </main>
    );
  }

  if (planError || !plan) {
    return (
      <main className="pt-16 bg-white text-gray-900">
        <section className="border-b border-border bg-white py-8">
          <div className="ykb-container">
            <button
              onClick={() => navigate('/plans')}
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Plans
            </button>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Subscribe</h1>
          </div>
        </section>

        <section className="ykb-section bg-dark-light">
          <div className="ykb-container max-w-3xl mx-auto">
            <div className="ykb-card flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold">{planError || 'Plan not found'}</p>
                <button
                  onClick={() => navigate('/plans')}
                  className="mt-3 inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Return to Plans
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="pt-16 bg-white text-gray-900">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <button
            onClick={() => navigate('/plans')}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Plans
          </button>
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">
              Complete your subscription
            </p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Subscribe to {plan.title}</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              Choose your payment method and complete the subscription process.
            </p>
          </div>
        </div>
      </section>

      <section className="ykb-section bg-dark-light">
        <div className="ykb-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plan Summary */}
            <div className="lg:col-span-1">
              <div className="ykb-card sticky top-20">
                <h3 className="text-lg font-bold text-primary mb-4">Order Summary</h3>
                <div className="space-y-3 pb-4 border-b border-border">
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Plan:</span>
                    <span className="font-semibold text-primary">{plan.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Currency:</span>
                    <span className="font-semibold text-primary">{currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textSecondary">Amount:</span>
                    <span className="font-semibold text-primary">
                      {currency === 'RWF' ? `${amount.toLocaleString()} RWF` : `$${amount.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-primary mb-3">Included Features:</p>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="text-xs text-textSecondary flex items-start gap-2">
                        <span className="text-secondary mt-1">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-2">
              <div className="ykb-card">
                {paymentWaiting ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-5">
                      <Loader className="w-6 h-6 text-yellow-600 shrink-0 mt-1 animate-spin" />
                      <div>
                        <h2 className="text-2xl font-bold text-yellow-700">Payment in Progress</h2>
                        <p className="text-yellow-600 mt-1">
                          A payment window has been opened. Please complete your payment in the new window.
                        </p>
                        <p className="text-sm text-yellow-600 mt-2">
                          ✓ We are automatically checking for payment status...
                        </p>
                        <p className="text-sm text-yellow-600">
                          ✓ You will be automatically redirected once payment is confirmed.
                        </p>
                        <div className="mt-4 p-3 bg-yellow-100 rounded border border-yellow-200">
                          <p className="text-xs font-semibold text-yellow-700">⚠️ Don't close this window</p>
                          <p className="text-xs text-yellow-600 mt-1">Keep this page open while completing payment.</p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/payment-callback?order_tracking_id=' + encodeURIComponent(orderTrackingId || ''))}
                      className="w-full bg-primary text-white font-semibold py-3 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Check Payment Status Manually
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentWaiting(false);
                        setOrderTrackingId(null);
                      }}
                      className="w-full border border-primary text-primary font-semibold py-3 rounded-md hover:bg-primary/10 transition-colors"
                    >
                      Cancel Payment
                    </button>
                  </div>
                ) : !submitted ? (
                  <>
                    {error && (
                      <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-primary mb-4">Payment Details</h2>

                      {/* Currency Selection */}
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-primary mb-3">Choose Currency:</p>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setCurrency('RWF')}
                            className={`px-4 py-2 rounded-md border transition-colors ${
                              currency === 'RWF'
                                ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                                : 'border-border bg-surface text-textSecondary hover:bg-surface/70'
                            }`}
                          >
                            RWF (Rwandan Franc)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrency('USD')}
                            className={`px-4 py-2 rounded-md border transition-colors ${
                              currency === 'USD'
                                ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                                : 'border-border bg-surface text-textSecondary hover:bg-surface/70'
                            }`}
                          >
                            USD (US Dollar)
                          </button>
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <p className="text-sm font-semibold text-primary mb-3">Select Payment Method:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                        <button
                          type="button"
                          onClick={() => setMethod('card')}
                          className={`flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors ${
                            method === 'card'
                              ? 'border-primary/50 bg-primary/10 text-primary'
                              : 'border-border bg-surface text-textSecondary hover:bg-surface/70'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          Card (Visa/Mastercard)
                        </button>

                        <button
                          type="button"
                          onClick={() => setMethod('mobileMoney')}
                          className={`flex items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-colors ${
                            method === 'mobileMoney'
                              ? 'border-primary/50 bg-primary/10 text-primary'
                              : 'border-border bg-surface text-textSecondary hover:bg-surface/70'
                          }`}
                        >
                          <Smartphone className="w-4 h-4" />
                          Mobile Money
                        </button>
                      </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                      {method === 'card' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-primary">Card Payment</h3>
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${brandBadgeClasses(brand)}`}
                            >
                              <CreditCard className="w-4 h-4" />
                              {brand === 'Unknown' ? 'Card type: —' : `Card type: ${brand}`}
                            </span>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="cardNumber">
                              Card Number
                            </label>
                            <input
                              id="cardNumber"
                              required
                              value={card.number}
                              onChange={(e) =>
                                setCard((p) => ({
                                  ...p,
                                  number: formatCardNumber(e.target.value),
                                }))
                              }
                              className="ykb-field"
                              inputMode="numeric"
                              placeholder="1234 5678 9012 3456"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="cardName">
                                Name on Card
                              </label>
                              <input
                                id="cardName"
                                required
                                value={card.name}
                                onChange={(e) => setCard((p) => ({ ...p, name: e.target.value }))}
                                className="ykb-field"
                                placeholder="e.g., Jean Paul"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="cardEmail">
                                Email (Receipt)
                              </label>
                              <input
                                id="cardEmail"
                                type="email"
                                required
                                value={card.email}
                                onChange={(e) => setCard((p) => ({ ...p, email: e.target.value }))}
                                className="ykb-field"
                                placeholder="you@example.com"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="expiry">
                                Expiry (MM/YY)
                              </label>
                              <input
                                id="expiry"
                                required
                                value={card.expiry}
                                onChange={(e) => {
                                  const cleaned = e.target.value.replace(/[^0-9/]/g, '').slice(0, 5);
                                  setCard((p) => ({ ...p, expiry: cleaned }));
                                }}
                                className="ykb-field"
                                inputMode="numeric"
                                placeholder="MM/YY"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="cvv">
                                CVV
                              </label>
                              <input
                                id="cvv"
                                required
                                value={card.cvv}
                                onChange={(e) => setCard((p) => ({ ...p, cvv: onlyDigits(e.target.value).slice(0, 4) }))}
                                className="ykb-field"
                                inputMode="numeric"
                                placeholder="123"
                              />
                            </div>
                          </div>

                          <p className="text-xs text-textSecondary bg-primary/5 border border-primary/10 rounded p-3">
                            💳 Payments are securely processed via Pesapal. Your card information is never stored on our servers.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-primary">Mobile Money Payment</h3>

                          {/* Network Selection */}
                          <div>
                            <p className="text-sm font-semibold text-primary mb-3">Select Network:</p>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setMobileMoney((p) => ({ ...p, network: 'mtn' }))}
                                className={`flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition-colors ${
                                  mobileMoney.network === 'mtn'
                                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                    : 'border-border bg-surface text-textSecondary hover:bg-surface/70'
                                }`}
                              >
                                <Smartphone className="w-5 h-5" />
                                MTN MoMo
                              </button>

                              <button
                                type="button"
                                onClick={() => setMobileMoney((p) => ({ ...p, network: 'airtel' }))}
                                className={`flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-semibold transition-colors ${
                                  mobileMoney.network === 'airtel'
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-border bg-surface text-textSecondary hover:bg-surface/70'
                                }`}
                              >
                                <Smartphone className="w-5 h-5" />
                                Airtel Money
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="mmName">
                                Full Name
                              </label>
                              <input
                                id="mmName"
                                required
                                value={mobileMoney.name}
                                onChange={(e) => setMobileMoney((p) => ({ ...p, name: e.target.value }))}
                                className="ykb-field"
                                placeholder="e.g., Aline"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="mmEmail">
                                Email
                              </label>
                              <input
                                id="mmEmail"
                                type="email"
                                required
                                value={mobileMoney.email}
                                onChange={(e) => setMobileMoney((p) => ({ ...p, email: e.target.value }))}
                                className="ykb-field"
                                placeholder="you@example.com"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-primary mb-1.5" htmlFor="mmPhone">
                              {mobileMoney.network === 'mtn' ? 'MTN MoMo Number' : 'Airtel Money Number'}
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-textSecondary bg-surface px-3 py-2.5 rounded-md border border-border">
                                +250
                              </span>
                              <input
                                id="mmPhone"
                                required
                                value={mobileMoney.phone}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                                  setMobileMoney((p) => ({ ...p, phone: digits }));
                                }}
                                className="ykb-field flex-1"
                                inputMode="numeric"
                                placeholder={mobileMoney.network === 'mtn' ? '788 888 888' : '786 222 222'}
                              />
                            </div>
                            <p className="text-xs text-textSecondary mt-2">
                              {mobileMoney.network === 'mtn' 
                                ? '📱 Enter your MTN MoMo number (9 digits, e.g., 798 891 543)'
                                : '📱 Enter your Airtel Money number (9 digits, e.g., 786 222 222)'}
                            </p>
                          </div>

                          {/* Network Info */}
                          <div className={`text-xs rounded p-3 border ${
                            mobileMoney.network === 'mtn'
                              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                              : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {mobileMoney.network === 'mtn' ? (
                              <>
                                <p className="font-semibold">💛 MTN MoMo Payment</p>
                                <p className="mt-1">You'll receive a payment prompt on your MTN number. Enter your USSD code to complete payment.</p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold">❤️ Airtel Money Payment</p>
                                <p className="mt-1">You'll receive a payment prompt on your Airtel number. Enter your USSD code to complete payment.</p>
                              </>
                            )}
                          </div>

                          <p className="text-xs text-textSecondary bg-primary/5 border border-primary/10 rounded p-3">
                            📱 Mobile Money payments are processed securely through Pesapal. Your phone number will not be stored.
                          </p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-primary text-white font-semibold py-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Subscribe Now
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : submitted ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/10 p-5">
                      <BadgeCheck className="w-6 h-6 text-primary shrink-0 mt-1" />
                      <div>
                        <h2 className="text-2xl font-bold text-primary">Subscription Created!</h2>
                        <p className="text-textSecondary">
                          Your subscription to <strong>{plan.title}</strong> has been created successfully.
                        </p>
                        <p className="mt-2 text-sm text-textSecondary">
                          Please proceed to complete the payment using the {method === 'card' ? 'card' : 'mobile money'} method. You will receive a payment link via email.
                        </p>
                        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded">
                          <p className="text-sm font-semibold text-primary mb-2">Next Steps:</p>
                          <ol className="text-sm text-textSecondary space-y-1 list-decimal list-inside">
                            <li>Check your email for the payment link</li>
                            <li>Complete the payment via Pesapal</li>
                            <li>Your subscription will be activated once payment is confirmed</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="w-full bg-primary text-white font-semibold py-3 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
