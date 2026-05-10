import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { API_BASE } from '../utils/backendAuth';

export function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [message, setMessage] = useState('Processing payment...');
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get parameters from URL or sessionStorage (for polling)
        let orderTrackingId = searchParams.get('order_tracking_id');
        
        // Fallback to sessionStorage if not in URL params
        if (!orderTrackingId) {
          orderTrackingId = sessionStorage.getItem('pesapalOrderTrackingId');
        }

        if (!orderTrackingId) {
          setStatus('failed');
          setMessage('Invalid payment response. Missing order tracking ID.');
          return;
        }

        // Check status with backend
        const response = await fetch(
          `${API_BASE}/subscriptions/status/check?orderTrackingId=${encodeURIComponent(orderTrackingId)}`
        );

        if (!response.ok) {
          throw new Error('Failed to check payment status');
        }

        const subscription = await response.json();
        setSubscriptionId(subscription.id);

        // Check subscription status
        if (subscription.status === 'ACTIVE') {
          setStatus('success');
          setMessage('Payment successful! Your subscription is now active.');
          // Clear session storage
          sessionStorage.removeItem('pesapalOrderTrackingId');
          sessionStorage.removeItem('subscriptionId');
          setTimeout(() => navigate('/provider'), 3000);
        } else if (subscription.status === 'PENDING' || subscription.pesapalStatus === 'PENDING') {
          setStatus('pending');
          setMessage('Payment received. Activation in progress...');
          setTimeout(() => navigate('/provider'), 3000);
        } else if (subscription.status === 'FAILED' || subscription.pesapalStatus === 'FAILED') {
          setStatus('failed');
          setMessage('Payment failed. Please try again or contact support.');
        } else {
          setStatus('pending');
          setMessage('Payment status is being verified...');
        }
      } catch (error) {
        console.error('Callback processing error:', error);
        setStatus('failed');
        setMessage('Error processing payment. Please contact support.');
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <main className="pt-16 bg-white text-gray-900 min-h-screen flex items-center justify-center">
      <section className="ykb-section bg-dark-light w-full">
        <div className="ykb-container max-w-2xl mx-auto">
          <div className="ykb-card text-center">
            {status === 'loading' && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader className="w-12 h-12 text-primary animate-spin" />
                </div>
                <h1 className="text-3xl font-bold text-primary mb-2">Processing Payment</h1>
                <p className="text-lg text-textSecondary">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
                <p className="text-lg text-textSecondary mb-4">{message}</p>
                <p className="text-sm text-textSecondary mb-6">
                  Redirecting to dashboard in a few seconds...
                </p>
                <button
                  onClick={() => navigate('/provider')}
                  className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  Go to Dashboard Now
                </button>
              </>
            )}

            {status === 'pending' && (
              <>
                <div className="flex justify-center mb-4">
                  <Loader className="w-12 h-12 text-yellow-500 animate-spin" />
                </div>
                <h1 className="text-3xl font-bold text-yellow-600 mb-2">Payment Processing</h1>
                <p className="text-lg text-textSecondary mb-4">{message}</p>
                <p className="text-sm text-textSecondary mb-6">
                  This may take a few moments. Redirecting soon...
                </p>
                <button
                  onClick={() => navigate('/provider')}
                  className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  Go to Dashboard Now
                </button>
              </>
            )}

            {status === 'failed' && (
              <>
                <div className="flex justify-center mb-4">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h1>
                <p className="text-lg text-textSecondary mb-6">{message}</p>
                <div className="space-y-2">
                  {subscriptionId && (
                    <p className="text-xs text-textSecondary">
                      Subscription ID: {subscriptionId}
                    </p>
                  )}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => navigate('/plans')}
                      className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition"
                    >
                      Try Another Plan
                    </button>
                    <button
                      onClick={() => navigate('/provider')}
                      className="inline-block border border-primary text-primary px-6 py-2 rounded-lg hover:bg-primary/10 transition"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
