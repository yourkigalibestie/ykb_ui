import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
export function Faq() {
  const { t } = useTranslation();
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

  return (
    <main className="pt-16 bg-white text-gray-900">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">{t('faq.kicker')}</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">{t('faq.title')}</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">{t('faq.description')}</p>
          </div>
        </div>
      </section>

      <section className="ykb-section px-4 sm:px-6 lg:px-8">
        <div className="ykb-container">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('faq.items.0.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('faq.items.0.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('faq.items.1.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('faq.items.1.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('faq.items.2.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('faq.items.2.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('faq.items.3.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('faq.items.3.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('faq.items.4.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('faq.items.4.description')}</p>
            </div>

            <div className="ykb-card">
              <h2 className="text-base font-semibold text-primary">{t('faq.items.5.title')}</h2>
              <p className="mt-2 text-sm text-textSecondary">{t('faq.items.5.description')}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
