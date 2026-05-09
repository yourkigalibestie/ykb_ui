import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle2, Zap, AlertCircle } from 'lucide-react';
import { API_BASE, getBackendAuthHeaders, getBackendAccessToken } from '../utils/backendAuth';

interface Plan {
  id: string;
  title: string;
  features: string[];
  feeRwf: number;
  feeUsd: number;
  createdAt: string;
  updatedAt: string;
}

export function Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'RWF' | 'USD'>('RWF');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const token = getBackendAccessToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE}/plans`, {
          headers: {
            ...getBackendAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch plans');
        }

        const data = await response.json();
        setPlans(data.plans || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [navigate]);

  const handleSelectPlan = (planId: string) => {
    navigate('/subscribe', { state: { planId, currency: selectedCurrency } });
  };

  return (
    <main className="pt-16 bg-white text-gray-900">
      {/* Header Section */}
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">
              Choose your plan
            </p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">
              Subscription Plans
            </h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              Select the plan that best fits your business needs and start serving customers today.
            </p>
          </div>
        </div>
      </section>

      {/* Currency Selector */}
      <section className="ykb-section bg-dark-light">
        <div className="ykb-container">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-sm font-semibold text-textSecondary">Select Currency:</span>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCurrency('RWF')}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  selectedCurrency === 'RWF'
                    ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-surface text-textSecondary hover:bg-surface/70'
                }`}
              >
                RWF (Rwandan Franc)
              </button>
              <button
                onClick={() => setSelectedCurrency('USD')}
                className={`px-4 py-2 rounded-md border transition-colors ${
                  selectedCurrency === 'USD'
                    ? 'border-primary/50 bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-surface text-textSecondary hover:bg-surface/70'
                }`}
              >
                USD (US Dollar)
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-8 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Plans Grid */}
          {!loading && plans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const price =
                  selectedCurrency === 'RWF' ? plan.feeRwf : plan.feeUsd;
                const currency = selectedCurrency;

                return (
                  <div
                    key={plan.id}
                    className="ykb-card h-full flex flex-col hover:shadow-lg transition-shadow duration-300"
                  >
                    {/* Plan Header */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-primary mb-2">
                        {plan.title}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-primary">
                          {price.toLocaleString()}
                        </span>
                        <span className="text-textSecondary">/ {currency}</span>
                      </div>
                      <p className="text-sm text-textSecondary mt-1">
                        per subscription period
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="mb-8 flex-grow">
                      <p className="text-sm font-semibold text-primary mb-4">
                        Includes:
                      </p>
                      <ul className="space-y-3">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-sm text-textSecondary"
                          >
                            <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className="w-full bg-primary text-white font-semibold py-3 rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Subscribe Now
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && plans.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-textSecondary mx-auto mb-4" />
              <p className="text-textSecondary mb-4">
                No plans available at the moment.
              </p>
              <p className="text-sm text-textSecondary">
                Please check back later or contact support for more information.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="ykb-section bg-white">
        <div className="ykb-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-primary mb-2">Easy Setup</h4>
              <p className="text-sm text-textSecondary">
                Get started in minutes with our simple subscription process.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <h4 className="font-semibold text-primary mb-2">Instant Access</h4>
              <p className="text-sm text-textSecondary">
                Activate your subscription and start using premium features immediately.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <h4 className="font-semibold text-primary mb-2">Flexible Billing</h4>
              <p className="text-sm text-textSecondary">
                Choose your preferred currency and payment method.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
